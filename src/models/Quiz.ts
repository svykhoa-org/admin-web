import type { AbstractModel } from './AbstractModel'

export enum QuestionType {
  SINGLE_CHOICE = 'single_choice',
  MULTIPLE_CHOICE = 'multiple_choice',
  TRUE_FALSE = 'true_false',
  SHORT_ANSWER = 'short_answer',
}

export interface AnswerOption extends AbstractModel {
  questionId: string
  content: string
  isCorrect: boolean
  order: number
}

export interface AcceptedAnswer extends AbstractModel {
  questionId: string
  value: string
}

export interface Question extends AbstractModel {
  quizId: string
  content: string
  type: QuestionType
  order: number
  points: number
  options: AnswerOption[]
  acceptedAnswers: AcceptedAnswer[]
}

export interface Quiz extends AbstractModel {
  title: string
  passingScore: number
  maxAttempts?: number | null
  timeLimit?: number | null
  questions: Question[]
}
