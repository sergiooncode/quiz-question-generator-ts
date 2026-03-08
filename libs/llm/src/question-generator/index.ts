import { randomUUID } from 'crypto';
import * as openai from '../clients/openai';
import { QUESTION_GENERATOR_PROMPT_TEMPLATE } from './prompts';
import { GeneratedQuestion, QuestionResponse, QuestionResponseSchema } from './types';

/**
 * Generate a quiz question with the specified target difficulty.
 * Uses the configured LLM provider (currently OpenAI, configurable in future).
 *
 * @param target_difficulty - Target difficulty level (BEGINNER, INTERMEDIATE, ADVANCED, EXPERT)
 * @param recentTopics - Optional array of recently used topics to avoid repetition
 * @returns Generated question with id
 */
export async function generate_question(
  target_difficulty: string = 'INTERMEDIATE',
  recentTopics?: string[]
): Promise<GeneratedQuestion> {
  // Read provider from environment (future: support multiple providers)
  const provider = process.env.LLM_PROVIDER || 'openai';
  const model = process.env.LLM_MODEL || 'gpt-4.1-mini';

  if (provider !== 'openai') {
    throw new Error(`Provider "${provider}" not yet supported. Currently only "openai" is available.`);
  }

  // Prepare prompt
  let prompt = QUESTION_GENERATOR_PROMPT_TEMPLATE.user.replace(
    /{target_difficulty}/g,
    target_difficulty
  );

  // Add recent topics context if provided
  if (recentTopics && recentTopics.length > 0) {
    const topicsText = recentTopics.join(', ');
    const avoidanceNote = `\n\nRECENTLY USED TOPICS (STRONGLY AVOID THESE - pick something different):\n${topicsText}\n\nYou MUST choose a topic that is NOT in the list above to ensure variety.`;
    prompt = prompt + avoidanceNote;
  }

  // Call provider
  const content = await openai.chat({
    model,
    messages: [
      {
        role: 'system',
        content: QUESTION_GENERATOR_PROMPT_TEMPLATE.system,
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    maxTokens: 300,
    responseFormat: { type: 'json_object' },
  });

  // Parse and validate response
  const parsed = JSON.parse(content) as QuestionResponse;
  const validated = QuestionResponseSchema.parse(parsed);

  // Add id to the response
  const result: GeneratedQuestion = {
    ...validated,
    id: randomUUID(),
  };

  return result;
}

// Re-export types
export * from './types';
