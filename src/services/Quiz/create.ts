import axiosInstance from '@/lib/axios'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

const QUIZ_ENDPOINT = '/quizzes'

export type QuestionType = 'single_choice' | 'multiple_choice' | 'short_answer'

export interface AnswerOptionInput {
  content: string
  isCorrect: boolean
  order: number
}

export interface AcceptedAnswerInput {
  value: string
}

export interface QuestionInput {
  content: string
  type: QuestionType
  order: number
  points: number
  options?: AnswerOptionInput[]
  acceptedAnswers?: AcceptedAnswerInput[]
}

export interface CreateQuizInput {
  title: string
  passingScore: number
  maxAttempts?: number
  timeLimit?: number
  questions: QuestionInput[]
}

export interface CreateQuizOutput {
  id: string
  title: string
  passingScore: number
  maxAttempts?: number
  timeLimit?: number
}

export async function createQuiz(input: CreateQuizInput): Promise<CreateQuizOutput> {
  const response = await axiosInstance.post<ApiDetailResponse<CreateQuizOutput>>(
    QUIZ_ENDPOINT,
    input,
  )

  return unwrapDetail(response.data)
}
