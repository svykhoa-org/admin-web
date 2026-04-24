import axiosInstance from '@/lib/axios'
import type { Course } from '@/models/Course'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

const COURSE_ENDPOINT = '/courses'

export interface GetCourseDetailInput {
  id: string
}

export type GetCourseDetailOutput = Course

export async function getCourseDetail(input: GetCourseDetailInput): Promise<GetCourseDetailOutput> {
  const response = await axiosInstance.get<ApiDetailResponse<GetCourseDetailOutput>>(
    `${COURSE_ENDPOINT}/${input.id}`,
  )

  return unwrapDetail(response.data)
}
