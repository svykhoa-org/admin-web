import axiosInstance from '@/lib/axios'
import type { CourseTag } from '@/models/CourseTag'
import type { ApiListResponse } from '@/types/api'
import { unwrapList } from '@/utils/apiResponse'

const ENDPOINT = '/course-tags'

export async function listCourseTag(): Promise<CourseTag[]> {
  const response = await axiosInstance.get<ApiListResponse<CourseTag>>(ENDPOINT)
  return unwrapList(response.data).items
}
