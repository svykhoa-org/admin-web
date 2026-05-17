import axiosInstance from '@/lib/axios'
import type { CourseCategory } from '@/models/CourseCategory'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

const ENDPOINT = '/course-categories'

export async function getCourseCategoryDetail(input: { id: string }): Promise<CourseCategory> {
  const response = await axiosInstance.get<ApiDetailResponse<CourseCategory>>(
    `${ENDPOINT}/${input.id}`,
  )
  return unwrapDetail(response.data)
}
