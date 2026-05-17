import axiosInstance from '@/lib/axios'
import type { CourseTag } from '@/models/CourseTag'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

const ENDPOINT = '/course-tags'

export interface UpdateCourseTagInput {
  id: string
  name?: string
  description?: string
  color?: string
}

export async function updateCourseTag(input: UpdateCourseTagInput): Promise<CourseTag> {
  const { id, ...payload } = input
  const response = await axiosInstance.patch<ApiDetailResponse<CourseTag>>(
    `${ENDPOINT}/${id}`,
    payload,
  )
  return unwrapDetail(response.data)
}
