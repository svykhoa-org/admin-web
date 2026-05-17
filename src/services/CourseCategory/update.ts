import axiosInstance from '@/lib/axios'
import type { CourseCategory } from '@/models/CourseCategory'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

const ENDPOINT = '/course-categories'

export interface UpdateCourseCategoryInput {
  id: string
  name?: string
  description?: string
  parentId?: string
  icon?: string
}

export async function updateCourseCategory(
  input: UpdateCourseCategoryInput,
): Promise<CourseCategory> {
  const { id, ...payload } = input
  const response = await axiosInstance.patch<ApiDetailResponse<CourseCategory>>(
    `${ENDPOINT}/${id}`,
    payload,
  )
  return unwrapDetail(response.data)
}
