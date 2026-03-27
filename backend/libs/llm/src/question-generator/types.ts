import { z } from 'zod';

// Zod schema for question response (equivalent to Pydantic BaseModel)
export const QuestionResponseSchema = z.object({
  question: z.string().describe('The question text'),
  options: z.array(z.string()).describe('List of answer options (e.g., ["a) ...", "b) ...", "c) ...", "d) ..."])'),
  correct_option: z.enum(['a', 'b', 'c', 'd']).describe('The correct option letter'),
  topic: z.string().describe('The topic or category of the question'),
});

export type QuestionResponse = z.infer<typeof QuestionResponseSchema>;

// Type for generated question (includes id)
export type GeneratedQuestion = QuestionResponse & {
  id: string;
};
