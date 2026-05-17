import axiosInstance from '@/lib/axios'
import type { CourseTag } from '@/models/CourseTag'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

export async function getCourseTagDetail(input: { id: string }): Promise<CourseTag> {
  const response = await axiosInstance.get<ApiDetailResponse<CourseTag>>(
    `/course-tags/${input.id}`,
  )
  return unwrapDetail(response.data)
}
