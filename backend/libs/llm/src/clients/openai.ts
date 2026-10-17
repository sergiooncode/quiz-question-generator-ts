import OpenAI from 'openai';
import { initLogger, wrapOpenAI } from 'braintrust';

// Check for OPENAI_API_KEY
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY missing — add it to .env.local');
}

// Braintrust tracing is optional: only enabled when BRAINTRUST_API_KEY is set
if (process.env.BRAINTRUST_API_KEY) {
  initLogger({
    projectName: process.env.BRAINTRUST_PROJECT || 'quiz-question-generator',
    apiKey: process.env.BRAINTRUST_API_KEY,
  });
}

// Initialize OpenAI client (wrapped so every completion is logged to Braintrust)
const openaiClient = wrapOpenAI(new OpenAI({ apiKey: OPENAI_API_KEY }));

/**
 * Generic chat completion using OpenAI
 */
export async function chat(params: {
  model: string;
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  maxTokens?: number;
  responseFormat?: { type: 'json_object' | 'text' };
}): Promise<string> {
  const completion = await openaiClient.chat.completions.create({
    model: params.model,
    messages: params.messages,
    max_tokens: params.maxTokens || 500,
    response_format: params.responseFormat || { type: 'text' },
  });

  const content = completion.choices[0].message.content;
  if (!content) {
    throw new Error('No content in response from OpenAI');
  }

  return content;
}
