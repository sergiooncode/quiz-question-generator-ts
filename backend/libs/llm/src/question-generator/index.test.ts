import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('braintrust', () => ({ wrapTraced: <T>(fn: T) => fn }));
const chat = vi.fn();
vi.mock('../clients/openai', () => ({ chat: (...args: unknown[]) => chat(...args) }));

import { generate_question } from './index';

const goodJson = JSON.stringify({
  question: 'Capital of France?',
  options: ['a) Paris', 'b) Lyon', 'c) Nice', 'd) Lille'],
  correct_option: 'a',
  topic: 'European capitals',
  answer_explanation: 'Paris is the capital.',
  answer_sources: ['https://example.com'],
});

const userPrompt = () => chat.mock.calls[0][0].messages[1].content as string;

beforeEach(() => {
  chat.mockReset();
  chat.mockResolvedValue(goodJson);
  delete process.env.LLM_PROVIDER;
  delete process.env.LLM_MODEL;
  vi.spyOn(console, 'log').mockImplementation(() => {});
});
afterEach(() => {
  vi.restoreAllMocks();
  delete process.env.LLM_PROVIDER;
  delete process.env.LLM_MODEL;
});

describe('generate_question', () => {
  it('returns the validated question with a generated uuid', async () => {
    const q = await generate_question('EXPERT');
    expect(q.question).toBe('Capital of France?');
    expect(q.id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('gives each question a distinct id', async () => {
    const [a, b] = [await generate_question(), await generate_question()];
    expect(a.id).not.toBe(b.id);
  });

  it('substitutes the target difficulty in the prompt', async () => {
    await generate_question('ADVANCED');
    expect(userPrompt()).toContain('ADVANCED');
    expect(userPrompt()).not.toContain('{target_difficulty}');
  });

  it('defaults to INTERMEDIATE', async () => {
    await generate_question();
    expect(userPrompt()).toContain('INTERMEDIATE');
  });

  it('appends recent topics to avoid when provided', async () => {
    await generate_question('EXPERT', ['Nile', 'Alps']);
    expect(userPrompt()).toContain('RECENTLY USED TOPICS');
    expect(userPrompt()).toContain('Nile, Alps');
  });

  it.each([undefined, []])('omits the avoidance note when topics are %j', async (topics) => {
    await generate_question('EXPERT', topics);
    expect(userPrompt()).not.toContain('RECENTLY USED TOPICS');
  });

  it('uses the default model and JSON response format', async () => {
    await generate_question();
    expect(chat.mock.calls[0][0]).toMatchObject({
      model: 'gpt-4.1-mini',
      responseFormat: { type: 'json_object' },
    });
  });

  it('honours LLM_MODEL', async () => {
    process.env.LLM_MODEL = 'custom';
    await generate_question();
    expect(chat.mock.calls[0][0].model).toBe('custom');
  });

  it('rejects unsupported providers without calling the LLM', async () => {
    process.env.LLM_PROVIDER = 'other';
    await expect(generate_question()).rejects.toThrow(/not yet supported/);
    expect(chat).not.toHaveBeenCalled();
  });

  it('throws on non-JSON output', async () => {
    chat.mockResolvedValue('nope');
    await expect(generate_question()).rejects.toThrow();
  });

  it('throws when the LLM omits explanation/sources', async () => {
    const { answer_explanation, answer_sources, ...rest } = JSON.parse(goodJson);
    chat.mockResolvedValue(JSON.stringify(rest));
    await expect(generate_question()).rejects.toThrow();
  });
});
