import axiosInstance from '@/lib/axios'
import type { Course } from '@/models/Course'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

const COURSE_ENDPOINT = '/courses'

export interface PublishCourseInput {
  id: string
}

export async function publishCourse(input: PublishCourseInput): Promise<Course> {
  const response = await axiosInstance.post<ApiDetailResponse<Course>>(
    `${COURSE_ENDPOINT}/${input.id}/publish`,
  )

  return unwrapDetail(response.data)
}
