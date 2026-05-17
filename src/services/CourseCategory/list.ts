import axiosInstance from '@/lib/axios'
import type { CourseCategory } from '@/models/CourseCategory'
import type { ApiListResponse } from '@/types/api'
import { unwrapList } from '@/utils/apiResponse'

const ENDPOINT = '/course-categories'

export async function listCourseCategory(): Promise<CourseCategory[]> {
  const response = await axiosInstance.get<ApiListResponse<CourseCategory>>(ENDPOINT)
  return unwrapList(response.data).items
}
