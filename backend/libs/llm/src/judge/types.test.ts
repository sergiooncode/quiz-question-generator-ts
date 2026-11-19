import { describe, it, expect } from 'vitest';
import { JudgeResponseSchema, DifficultyScoresSchema } from './types';

const validResponse = () => ({
  scores: { AK: 3, CL: 4, OD: 2, TS: 5 },
  difficulty_score: 3.5,
  difficulty_label: 'ADVANCED',
  feedback: { is_valid: true, topic_mismatch: false },
});

describe('DifficultyScoresSchema', () => {
  it.each([1, 3, 5])('accepts %i', (n) => {
    expect(DifficultyScoresSchema.safeParse({ AK: n, CL: n, OD: n, TS: n }).success).toBe(true);
  });

  it.each([0, 6, -1, 2.5, '3', null])('rejects score %j', (n) => {
    expect(DifficultyScoresSchema.safeParse({ AK: n, CL: 3, OD: 3, TS: 3 }).success).toBe(false);
  });

  it('rejects a missing dimension', () => {
    expect(DifficultyScoresSchema.safeParse({ AK: 3, CL: 3, OD: 3 }).success).toBe(false);
  });
});

describe('JudgeResponseSchema', () => {
  it('accepts a valid response and defaults list fields to []', () => {
    const result = JudgeResponseSchema.parse(validResponse());
    expect(result.feedback.reasons).toEqual([]);
    expect(result.feedback.style_violations).toEqual([]);
    expect(result.feedback.factual_concerns).toEqual([]);
  });

  it('keeps provided list fields', () => {
    const r = validResponse() as any;
    r.feedback.factual_concerns = ['dubious date'];
    expect(JudgeResponseSchema.parse(r).feedback.factual_concerns).toEqual(['dubious date']);
  });

  it.each(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'])('accepts label %s', (label) => {
    expect(JudgeResponseSchema.safeParse({ ...validResponse(), difficulty_label: label }).success).toBe(true);
  });

  it.each(['expert', 'HARD', '', null])('rejects label %j', (label) => {
    expect(JudgeResponseSchema.safeParse({ ...validResponse(), difficulty_label: label }).success).toBe(false);
  });

  it.each([0.9, 5.1])('rejects overall difficulty_score %f', (n) => {
    expect(JudgeResponseSchema.safeParse({ ...validResponse(), difficulty_score: n }).success).toBe(false);
  });

  it.each(['difficulty_score', 'scores', 'feedback', 'difficulty_label'])('rejects missing %s', (key) => {
    const r = validResponse() as any;
    delete r[key];
    expect(JudgeResponseSchema.safeParse(r).success).toBe(false);
  });

  it('rejects feedback missing is_valid or topic_mismatch', () => {
    expect(JudgeResponseSchema.safeParse({ ...validResponse(), feedback: { topic_mismatch: false } }).success).toBe(false);
    expect(JudgeResponseSchema.safeParse({ ...validResponse(), feedback: { is_valid: true } }).success).toBe(false);
  });
});
