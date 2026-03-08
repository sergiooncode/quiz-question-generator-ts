import { z } from 'zod';

// Zod schema for difficulty dimension scores
export const DifficultyScoresSchema = z.object({
  AK: z.number().int().min(1).max(5).describe('Accessibility of Knowledge score (1-5)'),
  CL: z.number().int().min(1).max(5).describe('Cognitive Load score (1-5)'),
  OD: z.number().int().min(1).max(5).describe('Obscurity of Distractors score (1-5)'),
  TS: z.number().int().min(1).max(5).describe('Topic Specialization score (1-5)'),
});

export type DifficultyScores = z.infer<typeof DifficultyScoresSchema>;

// Zod schema for judge feedback
export const JudgeFeedbackSchema = z.object({
  is_valid: z.boolean().describe('Whether the question is valid and suitable for use'),
  reasons: z.array(z.string()).default([]).describe('List of reasons for validation decision'),
  style_violations: z.array(z.string()).default([]).describe('List of style violations found'),
  factual_concerns: z.array(z.string()).default([]).describe('List of factual accuracy concerns'),
  topic_mismatch: z.boolean().describe('Whether the question topic matches the expected geography theme'),
});

export type JudgeFeedback = z.infer<typeof JudgeFeedbackSchema>;

// Difficulty label enum
export const DifficultyLabelSchema = z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']);
export type DifficultyLabel = z.infer<typeof DifficultyLabelSchema>;

// Complete judge response schema
export const JudgeResponseSchema = z.object({
  scores: DifficultyScoresSchema.describe('Individual difficulty dimension scores'),
  difficulty_score: z.number().min(1).max(5).describe('Overall difficulty score (average of AK, CL, OD, TS)'),
  difficulty_label: DifficultyLabelSchema.describe('Difficulty label based on overall score'),
  feedback: JudgeFeedbackSchema.describe('Judge feedback on question validity'),
});

export type JudgeResponse = z.infer<typeof JudgeResponseSchema>;

// Input for judge function
export interface JudgeQuestionInput {
  questionText: string;
  options: string[];
  correctOption: string;
  topic: string;
  targetDifficultyLabel: string;
}
