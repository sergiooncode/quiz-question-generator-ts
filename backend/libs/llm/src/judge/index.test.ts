import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('braintrust', () => ({ wrapTraced: <T>(fn: T) => fn }));
const chat = vi.fn();
vi.mock('../clients/openai', () => ({ chat: (...args: unknown[]) => chat(...args) }));

import { judgeQuestion } from './index';

const input = {
  questionText: 'Which river flows through Cairo?',
  options: ['a) Nile', 'b) Congo', 'c) Niger', 'd) Zambezi'],
  correctOption: 'a',
  topic: 'African rivers',
  targetDifficultyLabel: 'BEGINNER',
};

const goodJson = JSON.stringify({
  scores: { AK: 1, CL: 1, OD: 2, TS: 1 },
  difficulty_score: 1.25,
  difficulty_label: 'BEGINNER',
  feedback: { is_valid: true, topic_mismatch: false },
});

const userPrompt = () => chat.mock.calls[0][0].messages[1].content as string;

beforeEach(() => {
  chat.mockReset();
  chat.mockResolvedValue(goodJson);
  delete process.env.LLM_PROVIDER;
  delete process.env.LLM_JUDGE_MODEL;
});
afterEach(() => {
  delete process.env.LLM_PROVIDER;
  delete process.env.LLM_JUDGE_MODEL;
});

describe('judgeQuestion', () => {
  it('returns the validated response', async () => {
    const result = await judgeQuestion(input);
    expect(result.difficulty_label).toBe('BEGINNER');
    expect(result.feedback.style_violations).toEqual([]);
  });

  it('fills every placeholder in the prompt', async () => {
    await judgeQuestion(input);
    const prompt = userPrompt();
    expect(prompt).toContain('Which river flows through Cairo?');
    expect(prompt).toContain('  a) Nile\n  b) Congo\n  c) Niger\n  d) Zambezi');
    expect(prompt).toContain('African rivers');
    expect(prompt).toContain('BEGINNER');
    expect(prompt).not.toMatch(/\{(question_text|options|correct_option|topic|target_difficulty_label)\}/);
  });

  it('uses the default model and requests JSON output', async () => {
    await judgeQuestion(input);
    expect(chat.mock.calls[0][0]).toMatchObject({
      model: 'gpt-4.1',
      responseFormat: { type: 'json_object' },
    });
  });

  it('honours LLM_JUDGE_MODEL', async () => {
    process.env.LLM_JUDGE_MODEL = 'custom-model';
    await judgeQuestion(input);
    expect(chat.mock.calls[0][0].model).toBe('custom-model');
  });

  it('rejects unsupported providers before calling the LLM', async () => {
    process.env.LLM_PROVIDER = 'anthropic';
    await expect(judgeQuestion(input)).rejects.toThrow(/not yet supported/);
    expect(chat).not.toHaveBeenCalled();
  });

  it('throws on non-JSON output', async () => {
    chat.mockResolvedValue('not json');
    await expect(judgeQuestion(input)).rejects.toThrow();
  });

  it('throws on JSON that fails schema validation', async () => {
    chat.mockResolvedValue(JSON.stringify({ scores: { AK: 9, CL: 1, OD: 1, TS: 1 } }));
    await expect(judgeQuestion(input)).rejects.toThrow();
  });

  it('propagates LLM client errors', async () => {
    chat.mockRejectedValue(new Error('rate limited'));
    await expect(judgeQuestion(input)).rejects.toThrow('rate limited');
  });

  describe('prompt-injection / replacement-pattern hazards', () => {
    // String.replace treats "$&", "$1" etc. in the replacement as patterns.
    it.fails('inserts question text containing "$&" literally', async () => {
      await judgeQuestion({ ...input, questionText: 'Costs $& more?' });
      expect(userPrompt()).toContain('Costs $& more?');
    });

    // Placeholders are substituted sequentially, so user content can be re-expanded.
    it.fails('does not expand placeholders that appear inside question text', async () => {
      await judgeQuestion({ ...input, questionText: 'What does {topic} mean?' });
      expect(userPrompt()).toContain('What does {topic} mean?');
    });
  });
});
