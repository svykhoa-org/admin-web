import axiosInstance from '@/lib/axios'
import type { Enrollment } from '@/models/Enrollment'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

export async function getEnrollmentDetail(input: { id: string }): Promise<Enrollment> {
  const response = await axiosInstance.get<ApiDetailResponse<Enrollment>>(
    `/enrollments/${input.id}`,
  )
  return unwrapDetail(response.data)
}
