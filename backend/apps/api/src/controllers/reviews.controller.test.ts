import { describe, it, expect, vi, beforeEach } from 'vitest';

const { prisma, judgeQuestion } = vi.hoisted(() => ({
  prisma: { question: { findUnique: vi.fn() }, questionReview: { create: vi.fn() } },
  judgeQuestion: vi.fn(),
}));
vi.mock('../../../../libs/db/src', () => ({ prisma, DifficultyLevel: {} }));
vi.mock('../../../../libs/llm/src', () => ({ judgeQuestion }));

import { reviewQuestion, getReviews } from './reviews.controller';

const ctx = (uuid = 'u1'): any => ({ params: { uuid } });

const question = {
  id: 7,
  questionText: 'Q?',
  options: ['a) 1', 'b) 2', 'c) 3', 'd) 4'],
  correctOption: 'b',
  topic: 'Rivers',
  targetDifficultyLabel: 'EXPERT',
};

const judged = {
  scores: { AK: 1, CL: 2, OD: 3, TS: 4 },
  difficulty_score: 2.5,
  difficulty_label: 'INTERMEDIATE',
  feedback: {
    is_valid: true,
    reasons: [],
    topic_mismatch: false,
    style_violations: ['v'],
    factual_concerns: ['f'],
  },
};

beforeEach(() => {
  vi.resetAllMocks();
});

describe('reviewQuestion', () => {
  it('404s and skips the LLM when the question does not exist', async () => {
    prisma.question.findUnique.mockResolvedValue(null);
    const c = ctx();
    await reviewQuestion(c);
    expect(c.status).toBe(404);
    expect(judgeQuestion).not.toHaveBeenCalled();
    expect(prisma.questionReview.create).not.toHaveBeenCalled();
  });

  it('sends the stored question to the judge', async () => {
    prisma.question.findUnique.mockResolvedValue(question);
    judgeQuestion.mockResolvedValue(judged);
    prisma.questionReview.create.mockResolvedValue({ id: 1 });
    await reviewQuestion(ctx());
    expect(judgeQuestion).toHaveBeenCalledWith({
      questionText: 'Q?',
      options: question.options,
      correctOption: 'b',
      topic: 'Rivers',
      targetDifficultyLabel: 'EXPERT',
    });
  });

  it('persists the judge result with the correct column mapping and returns 201', async () => {
    prisma.question.findUnique.mockResolvedValue(question);
    judgeQuestion.mockResolvedValue(judged);
    prisma.questionReview.create.mockResolvedValue({ id: 1 });
    const c = ctx();
    await reviewQuestion(c);
    expect(prisma.questionReview.create).toHaveBeenCalledWith({
      data: {
        questionId: 7,
        ak: 1,
        cl: 2,
        od: 3,
        ts: 4,
        difficultyScore: 2.5,
        difficultyLabel: 'INTERMEDIATE',
        isValid: true,
        topicMismatch: false,
        styleViolations: ['v'],
        factualConcerns: ['f'],
        rawJudgeOutput: judged,
      },
    });
    expect(c.status).toBe(201);
    expect(c.body).toEqual({ data: { id: 1 } });
  });

  it('does not save a review when the judge fails', async () => {
    prisma.question.findUnique.mockResolvedValue(question);
    judgeQuestion.mockRejectedValue(new Error('bad json'));
    await expect(reviewQuestion(ctx())).rejects.toThrow('bad json');
    expect(prisma.questionReview.create).not.toHaveBeenCalled();
  });
});

describe('getReviews', () => {
  it('returns reviews newest first', async () => {
    prisma.question.findUnique.mockResolvedValue({ reviews: [{ id: 2 }, { id: 1 }] });
    const c = ctx();
    await getReviews(c);
    expect(prisma.question.findUnique).toHaveBeenCalledWith({
      where: { uuid: 'u1' },
      include: { reviews: { orderBy: { createdAt: 'desc' } } },
    });
    expect(c.body).toEqual({ data: [{ id: 2 }, { id: 1 }] });
  });

  it('404s when the question is missing', async () => {
    prisma.question.findUnique.mockResolvedValue(null);
    const c = ctx();
    await getReviews(c);
    expect(c.status).toBe(404);
    expect(c.body).toEqual({ error: 'Question not found' });
  });
});
