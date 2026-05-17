import axiosInstance from '@/lib/axios'
import type { CourseCategory } from '@/models/CourseCategory'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

const ENDPOINT = '/course-categories'

export interface CreateCourseCategoryInput {
  name: string
  description?: string
  parentId?: string
  icon?: string
}

export async function createCourseCategory(
  input: CreateCourseCategoryInput,
): Promise<CourseCategory> {
  const response = await axiosInstance.post<ApiDetailResponse<CourseCategory>>(ENDPOINT, input)
  return unwrapDetail(response.data)
}
