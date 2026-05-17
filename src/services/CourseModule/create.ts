import axiosInstance from '@/lib/axios'
import type { CourseModule } from '@/models/Course'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

const COURSE_ENDPOINT = '/courses'

export interface CreateCourseModuleInput {
  courseId: string
  title: string
  description?: string
  order: number
  locked?: boolean
}

export type CreateCourseModuleOutput = CourseModule

export async function createCourseModule(
  input: CreateCourseModuleInput,
): Promise<CreateCourseModuleOutput> {
  const { courseId, ...payload } = input
  const response = await axiosInstance.post<ApiDetailResponse<CreateCourseModuleOutput>>(
    `${COURSE_ENDPOINT}/${courseId}/modules`,
    payload,
  )
  return unwrapDetail(response.data)
}
