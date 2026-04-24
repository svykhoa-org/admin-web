import axiosInstance from '@/lib/axios'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

const COURSE_ENDPOINT = '/courses'

export interface RemoveCourseInput {
  id: string
}

export async function removeCourse(input: RemoveCourseInput): Promise<void> {
  const response = await axiosInstance.delete<ApiDetailResponse<null>>(
    `${COURSE_ENDPOINT}/${input.id}`,
  )

  unwrapDetail(response.data)
}
