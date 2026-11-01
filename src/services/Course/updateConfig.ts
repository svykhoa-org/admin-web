import axiosInstance from '@/lib/axios'
import type { Course, CourseConfig } from '@/models/Course'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

const COURSE_ENDPOINT = '/courses'

// Each group is merged over the stored config, so send only the groups being edited.
export type UpdateCourseConfigInput = {
  id: string
  access?: Partial<CourseConfig['access']>
  progression?: Partial<CourseConfig['progression']>
  completion?: Partial<CourseConfig['completion']>
  proctoring?: CourseConfig['proctoring']
  certificate?: Partial<CourseConfig['certificate']>
}

export async function updateCourseConfig(input: UpdateCourseConfigInput): Promise<Course> {
  const { id, ...payload } = input
  const response = await axiosInstance.patch<ApiDetailResponse<Course>>(
    `${COURSE_ENDPOINT}/${id}/config`,
    payload,
  )
  return unwrapDetail(response.data)
}
