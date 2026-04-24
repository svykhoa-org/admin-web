import axiosInstance from '@/lib/axios'
import type { CourseModule } from '@/models/Course'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

const COURSE_ENDPOINT = '/courses'

export interface UpdateCourseModuleInput {
  courseId: string
  id: string
  title?: string
  order?: number
}

export type UpdateCourseModuleOutput = CourseModule

export async function updateCourseModule(
  input: UpdateCourseModuleInput,
): Promise<UpdateCourseModuleOutput> {
  const { courseId, id, ...payload } = input

  const response = await axiosInstance.patch<ApiDetailResponse<UpdateCourseModuleOutput>>(
    `${COURSE_ENDPOINT}/${courseId}/modules/${id}`,
    payload,
  )

  return unwrapDetail(response.data)
}
