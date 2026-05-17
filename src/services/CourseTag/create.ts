import axiosInstance from '@/lib/axios'
import type { CourseTag } from '@/models/CourseTag'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

const ENDPOINT = '/course-tags'

export interface CreateCourseTagInput {
  name: string
  description?: string
  color?: string
}

export async function createCourseTag(input: CreateCourseTagInput): Promise<CourseTag> {
  const response = await axiosInstance.post<ApiDetailResponse<CourseTag>>(ENDPOINT, input)
  return unwrapDetail(response.data)
}
