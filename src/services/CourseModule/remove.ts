import axiosInstance from '@/lib/axios'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

const COURSE_ENDPOINT = '/courses'

export interface RemoveCourseModuleInput {
  courseId: string
  id: string
}

export async function removeCourseModule(input: RemoveCourseModuleInput): Promise<void> {
  const response = await axiosInstance.delete<ApiDetailResponse<null>>(
    `${COURSE_ENDPOINT}/${input.courseId}/modules/${input.id}`,
  )

  unwrapDetail(response.data)
}
