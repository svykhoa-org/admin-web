import axiosInstance from '@/lib/axios'
import type { EnrollmentProgress } from '@/models/EnrollmentProgress'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

export async function getEnrollmentProgress(input: { id: string }): Promise<EnrollmentProgress> {
  const response = await axiosInstance.get<ApiDetailResponse<EnrollmentProgress>>(
    `/enrollments/${input.id}/progress`,
  )
  return unwrapDetail(response.data)
}
