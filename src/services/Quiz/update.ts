import axiosInstance from '@/lib/axios'
import type { Quiz } from '@/models/Quiz'
import type { QuestionInput } from './create'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

const QUIZ_ENDPOINT = '/quizzes'

export interface UpdateQuizInput {
  id: string
  title?: string
  passingScore?: number
  // null clears the limit; leaving the key out keeps the stored value.
  maxAttempts?: number | null
  timeLimit?: number | null
  questions?: QuestionInput[]
}

export type UpdateQuizOutput = Quiz

export async function updateQuiz(input: UpdateQuizInput): Promise<UpdateQuizOutput> {
  const { id, ...payload } = input
  const response = await axiosInstance.patch<ApiDetailResponse<UpdateQuizOutput>>(
    `${QUIZ_ENDPOINT}/${id}`,
    payload,
  )
  return unwrapDetail(response.data)
}
