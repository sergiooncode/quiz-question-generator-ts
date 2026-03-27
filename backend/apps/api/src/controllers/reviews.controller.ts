import { Context } from 'koa';
import { prisma, DifficultyLevel } from '../../../../libs/db/src';
import { judgeQuestion } from '../../../../libs/llm/src';

export async function reviewQuestion(ctx: Context) {
  const { uuid } = ctx.params;

  const question = await prisma.question.findUnique({
    where: { uuid },
  });

  if (!question) {
    ctx.status = 404;
    ctx.body = { error: 'Question not found' };
    return;
  }

  const result = await judgeQuestion({
    questionText: question.questionText,
    options: question.options as string[],
    correctOption: question.correctOption,
    topic: question.topic,
    targetDifficultyLabel: question.targetDifficultyLabel,
  });

  const review = await prisma.questionReview.create({
    data: {
      questionId: question.id,
      ak: result.scores.AK,
      cl: result.scores.CL,
      od: result.scores.OD,
      ts: result.scores.TS,
      difficultyScore: result.difficulty_score,
      difficultyLabel: result.difficulty_label as DifficultyLevel,
      isValid: result.feedback.is_valid,
      topicMismatch: result.feedback.topic_mismatch,
      styleViolations: result.feedback.style_violations,
      factualConcerns: result.feedback.factual_concerns,
      rawJudgeOutput: result,
    },
  });

  ctx.status = 201;
  ctx.body = { data: review };
}

export async function getReviews(ctx: Context) {
  const { uuid } = ctx.params;

  const question = await prisma.question.findUnique({
    where: { uuid },
    include: { reviews: { orderBy: { createdAt: 'desc' } } },
  });

  if (!question) {
    ctx.status = 404;
    ctx.body = { error: 'Question not found' };
    return;
  }

  ctx.body = { data: question.reviews };
}
