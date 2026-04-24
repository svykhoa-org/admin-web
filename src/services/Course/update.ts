import axiosInstance from '@/lib/axios'
import type { Course } from '@/models/Course'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

const COURSE_ENDPOINT = '/courses'

export interface UpdateCourseInput {
  id: string
  title?: string
  description?: string
  price?: number
  shortCode?: string
}

export type UpdateCourseOutput = Course

export async function updateCourse(input: UpdateCourseInput): Promise<UpdateCourseOutput> {
  const { id, ...payload } = input

  const response = await axiosInstance.patch<ApiDetailResponse<UpdateCourseOutput>>(
    `${COURSE_ENDPOINT}/${id}`,
    payload,
  )

  return unwrapDetail(response.data)
}
