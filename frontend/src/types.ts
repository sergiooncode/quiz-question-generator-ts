export interface Review {
  id: number
  ak: number
  cl: number
  od: number
  ts: number
  difficultyScore: number
  difficultyLabel: string
  isValid: boolean
  topicMismatch: boolean
  styleViolations: string[]
  factualConcerns: string[]
  rawJudgeOutput: Record<string, unknown> | null
}

export interface Question {
  id: number
  uuid: string
  questionText: string
  options: string[]
  correctOption: string
  topic: string
  targetDifficultyLabel: string
  answerExplanation: string | null
  answerSources: string[]
  createdAt: string
  reviews: Review[]
}
