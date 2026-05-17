import axiosInstance from '@/lib/axios'
import type { Quiz } from '@/models/Quiz'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

const QUIZ_ENDPOINT = '/quizzes'

export interface GetQuizDetailInput {
  id: string
}

export type GetQuizDetailOutput = Quiz

export async function getQuizDetail(input: GetQuizDetailInput): Promise<GetQuizDetailOutput> {
  const response = await axiosInstance.get<ApiDetailResponse<GetQuizDetailOutput>>(
    `${QUIZ_ENDPOINT}/${input.id}`,
  )
  return unwrapDetail(response.data)
}
