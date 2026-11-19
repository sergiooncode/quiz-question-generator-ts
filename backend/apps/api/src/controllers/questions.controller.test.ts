import { describe, it, expect, vi, beforeEach } from 'vitest';

const { prisma, generate_question } = vi.hoisted(() => ({
  prisma: { question: { findMany: vi.fn(), findUnique: vi.fn(), create: vi.fn() } },
  generate_question: vi.fn(),
}));
vi.mock('../../../../libs/db/src', () => ({ prisma, DifficultyLevel: {} }));
vi.mock('../../../../libs/llm/src', () => ({ generate_question }));

import { listQuestions, getQuestion, generateQuestion } from './questions.controller';

const ctx = (over: Record<string, unknown> = {}): any => ({ query: {}, params: {}, request: { body: {} }, ...over });

const generated = (topic: string) => ({
  question: `Q about ${topic}`,
  options: ['a) 1', 'b) 2', 'c) 3', 'd) 4'],
  correct_option: 'b',
  topic,
  answer_explanation: 'because',
  answer_sources: ['src'],
});

beforeEach(() => {
  vi.resetAllMocks();
  prisma.question.findMany.mockResolvedValue([]);
  prisma.question.create.mockImplementation(async ({ data }: any) => ({ id: 1, ...data }));
});

describe('listQuestions', () => {
  it('applies defaults: no filters, take 20, skip 0, newest first', async () => {
    const c = ctx();
    await listQuestions(c);
    expect(prisma.question.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {}, take: 20, skip: 0, orderBy: { createdAt: 'desc' } })
    );
    expect(c.body).toEqual({ data: [] });
  });

  it('maps topic and difficulty filters', async () => {
    await listQuestions(ctx({ query: { topic: 'Rivers', difficulty: 'EXPERT' } }));
    expect(prisma.question.findMany.mock.calls[0][0].where).toEqual({
      topic: 'Rivers',
      targetDifficultyLabel: 'EXPERT',
    });
  });

  it('parses limit and offset as integers', async () => {
    await listQuestions(ctx({ query: { limit: '5', offset: '10' } }));
    expect(prisma.question.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 5, skip: 10 }));
  });

  it('includes only the latest review per question', async () => {
    await listQuestions(ctx());
    expect(prisma.question.findMany.mock.calls[0][0].include).toEqual({
      reviews: { take: 1, orderBy: { createdAt: 'desc' } },
    });
  });

  // Documents current behaviour: garbage input reaches Prisma as NaN.
  it.fails('rejects a non-numeric limit instead of passing NaN to Prisma', async () => {
    await listQuestions(ctx({ query: { limit: 'abc' } }));
    expect(prisma.question.findMany.mock.calls[0][0].take).not.toBeNaN();
  });
});

describe('getQuestion', () => {
  it('returns the question', async () => {
    prisma.question.findUnique.mockResolvedValue({ id: 1 });
    const c = ctx({ params: { uuid: 'u1' } });
    await getQuestion(c);
    expect(prisma.question.findUnique).toHaveBeenCalledWith({ where: { uuid: 'u1' }, include: { reviews: true } });
    expect(c.body).toEqual({ data: { id: 1 } });
  });

  it('404s when not found', async () => {
    prisma.question.findUnique.mockResolvedValue(null);
    const c = ctx({ params: { uuid: 'missing' } });
    await getQuestion(c);
    expect(c.status).toBe(404);
    expect(c.body).toEqual({ error: 'Question not found' });
  });
});

describe('generateQuestion', () => {
  it('defaults to one EXPERT question and responds 201', async () => {
    generate_question.mockResolvedValue(generated('Alps'));
    const c = ctx();
    await generateQuestion(c);
    expect(generate_question).toHaveBeenCalledTimes(1);
    expect(generate_question.mock.calls[0][0]).toBe('EXPERT');
    expect(c.status).toBe(201);
    expect(c.body.data).toHaveLength(1);
  });

  it('persists the generated fields with the right column mapping', async () => {
    generate_question.mockResolvedValue(generated('Alps'));
    await generateQuestion(ctx({ request: { body: { targetDifficulty: 'BEGINNER' } } }));
    expect(prisma.question.create).toHaveBeenCalledWith({
      data: {
        questionText: 'Q about Alps',
        options: ['a) 1', 'b) 2', 'c) 3', 'd) 4'],
        correctOption: 'b',
        topic: 'Alps',
        targetDifficultyLabel: 'BEGINNER',
        answerExplanation: 'because',
        answerSources: ['src'],
      },
    });
  });

  it('passes recent DB topics to the generator', async () => {
    prisma.question.findMany.mockResolvedValue([{ topic: 'Nile' }, { topic: 'Alps' }]);
    generate_question.mockResolvedValue(generated('Andes'));
    await generateQuestion(ctx());
    expect(prisma.question.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ take: 15, select: { topic: true } })
    );
    expect(generate_question.mock.calls[0][1]).toEqual(['Nile', 'Alps']);
  });

  it('accumulates topics from earlier questions in the same batch', async () => {
    prisma.question.findMany.mockResolvedValue([{ topic: 'Nile' }]);
    generate_question
      .mockResolvedValueOnce(generated('Alps'))
      .mockResolvedValueOnce(generated('Andes'))
      .mockResolvedValueOnce(generated('Gobi'));
    const c = ctx({ request: { body: { count: 3 } } });
    await generateQuestion(c);
    expect(generate_question.mock.calls.map((x) => x[1])).toEqual([
      ['Nile'],
      ['Nile', 'Alps'],
      ['Nile', 'Alps', 'Andes'],
    ]);
    expect(c.body.data).toHaveLength(3);
  });

  it('propagates generator failure and stops the batch', async () => {
    generate_question.mockResolvedValueOnce(generated('Alps')).mockRejectedValueOnce(new Error('LLM down'));
    await expect(generateQuestion(ctx({ request: { body: { count: 3 } } }))).rejects.toThrow('LLM down');
    expect(generate_question).toHaveBeenCalledTimes(2);
    // Known limitation: the first question is already saved but the caller never learns of it.
    expect(prisma.question.create).toHaveBeenCalledTimes(1);
  });

  // count is unbounded: one request can trigger arbitrarily many paid LLM calls.
  it.fails('caps count to protect against runaway LLM spend', async () => {
    generate_question.mockResolvedValue(generated('X'));
    await generateQuestion(ctx({ request: { body: { count: 500 } } })).catch(() => {});
    expect(generate_question.mock.calls.length).toBeLessThanOrEqual(50);
  });
});
