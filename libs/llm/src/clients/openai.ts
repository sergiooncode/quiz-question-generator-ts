import OpenAI from 'openai';

// Check for OPENAI_API_KEY
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
if (!OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY missing — add it to .env.local');
}

// Initialize OpenAI client
const openaiClient = new OpenAI({ apiKey: OPENAI_API_KEY });

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
