import axiosInstance from '@/lib/axios'
import type { QuizAttempt } from '@/models/EnrollmentProgress'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

export async function getQuizAttempts(quizId: string): Promise<QuizAttempt[]> {
  const response = await axiosInstance.get<ApiDetailResponse<QuizAttempt[]>>(
    `/quizzes/${quizId}/attempts`,
  )
  return unwrapDetail(response.data)
}
