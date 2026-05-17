import axiosInstance from '@/lib/axios'
import type { CourseCategory } from '@/models/CourseCategory'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

const ENDPOINT = '/course-categories'

export async function listCourseCategory(): Promise<CourseCategory[]> {
  const response = await axiosInstance.get<ApiDetailResponse<CourseCategory[]>>(ENDPOINT)
  return unwrapDetail(response.data)
}
