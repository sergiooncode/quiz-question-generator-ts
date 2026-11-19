import { describe, it, expect } from 'vitest';
import { QuestionResponseSchema } from './types';

const valid = () => ({
  question: 'Capital of France?',
  options: ['a) Paris', 'b) Lyon', 'c) Nice', 'd) Lille'],
  correct_option: 'a',
  topic: 'European capitals',
  answer_explanation: 'Paris is the capital.',
  answer_sources: ['https://example.com'],
});

describe('QuestionResponseSchema', () => {
  it('accepts a valid response', () => {
    expect(QuestionResponseSchema.safeParse(valid()).success).toBe(true);
  });

  it.each(['a', 'b', 'c', 'd'])('accepts correct_option %s', (c) => {
    expect(QuestionResponseSchema.safeParse({ ...valid(), correct_option: c }).success).toBe(true);
  });

  it.each(['e', 'A', 'ab', '', 1, null])('rejects correct_option %j', (c) => {
    expect(QuestionResponseSchema.safeParse({ ...valid(), correct_option: c }).success).toBe(false);
  });

  it.each(['question', 'options', 'correct_option', 'topic', 'answer_explanation', 'answer_sources'])(
    'rejects missing %s',
    (key) => {
      const r = valid() as any;
      delete r[key];
      expect(QuestionResponseSchema.safeParse(r).success).toBe(false);
    }
  );

  it('rejects non-string options and non-array sources', () => {
    expect(QuestionResponseSchema.safeParse({ ...valid(), options: ['a', 2] }).success).toBe(false);
    expect(QuestionResponseSchema.safeParse({ ...valid(), answer_sources: 'url' }).success).toBe(false);
  });

  // The schema does not enforce option count, so Stage 0 / mechanical gates must.
  it('does not enforce the number of options (left to mechanical gates)', () => {
    expect(QuestionResponseSchema.safeParse({ ...valid(), options: ['a) x'] }).success).toBe(true);
  });
});
