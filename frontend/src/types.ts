export interface Review {
  id: number
  difficultyScore: number
  difficultyLabel: string
  isValid: boolean
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
  reviews: Review[]
}
