import * as openai from '../clients/openai';
import { JUDGE_PROMPT_TEMPLATE } from './prompts';
import {
  JudgeQuestionInput,
  JudgeResponse,
  JudgeResponseSchema
} from './types';

/**
 * Judge a quiz question and return scores and feedback.
 * Uses the configured LLM provider (currently OpenAI, configurable in future).
 *
 * @param input - Question data to evaluate
 * @returns Judge response with scores and feedback
 */
export async function judgeQuestion(input: JudgeQuestionInput): Promise<JudgeResponse> {
  // Read provider from environment (future: support multiple providers)
  const provider = process.env.LLM_PROVIDER || 'openai';
  const model = process.env.LLM_JUDGE_MODEL || 'gpt-4.1';

  if (provider !== 'openai') {
    throw new Error(`Provider "${provider}" not yet supported. Currently only "openai" is available.`);
  }

  const { questionText, options, correctOption, topic, targetDifficultyLabel } = input;

  const formattedOptions = options.map(opt => `  ${opt}`).join('\n');

  const prompt = JUDGE_PROMPT_TEMPLATE.user
    .replace('{question_text}', questionText)
    .replace('{options}', formattedOptions)
    .replace('{correct_option}', correctOption)
    .replace('{topic}', topic)
    .replace('{target_difficulty_label}', targetDifficultyLabel);

  // Call provider
  const content = await openai.chat({
    model,
    messages: [
      {
        role: 'system',
        content: JUDGE_PROMPT_TEMPLATE.system,
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    maxTokens: 500,
    responseFormat: { type: 'json_object' },
  });

  // Parse and validate response
  const parsed = JSON.parse(content);
  const validated = JudgeResponseSchema.parse(parsed);

  return validated;
}

// Re-export types
export * from './types';
