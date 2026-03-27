import { Context } from 'koa';
import { prisma, DifficultyLevel } from '../../../../libs/db/src';
import { generate_question } from '../../../../libs/llm/src';

export async function listQuestions(ctx: Context) {
  const { topic, difficulty, limit, offset } = ctx.query;

  const where: Record<string, unknown> = {};
  if (topic) where.topic = topic;
  if (difficulty) where.targetDifficultyLabel = difficulty as DifficultyLevel;

  const questions = await prisma.question.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit ? parseInt(limit as string, 10) : 20,
    skip: offset ? parseInt(offset as string, 10) : 0,
    include: {
      reviews: {
        take: 1,
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  ctx.body = { data: questions };
}

export async function getQuestion(ctx: Context) {
  const question = await prisma.question.findUnique({
    where: { uuid: ctx.params.uuid },
    include: { reviews: true },
  });

  if (!question) {
    ctx.status = 404;
    ctx.body = { error: 'Question not found' };
    return;
  }

  ctx.body = { data: question };
}

export async function generateQuestion(ctx: Context) {
  const { targetDifficulty = 'EXPERT', count = 1 } = ctx.request.body as Record<string, any>;

  const recentQuestions = await prisma.question.findMany({
    take: 15,
    orderBy: { createdAt: 'desc' },
    select: { topic: true },
  });
  const topicsToAvoid = recentQuestions.map(q => q.topic);

  const generated = [];
  for (let i = 0; i < count; i++) {
    const q = await generate_question(targetDifficulty, [
      ...topicsToAvoid,
      ...generated.map(g => g.topic),
    ]);

    const saved = await prisma.question.create({
      data: {
        questionText: q.question,
        options: q.options,
        correctOption: q.correct_option,
        topic: q.topic,
        targetDifficultyLabel: targetDifficulty as DifficultyLevel,
      },
    });

    generated.push(saved);
  }

  ctx.status = 201;
  ctx.body = { data: generated };
}
