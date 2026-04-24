import axiosInstance from '@/lib/axios'
import type { Course } from '@/models/Course'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

const COURSE_ENDPOINT = '/courses'

export interface ArchiveCourseInput {
  id: string
}

export async function archiveCourse(input: ArchiveCourseInput): Promise<Course> {
  const response = await axiosInstance.post<ApiDetailResponse<Course>>(
    `${COURSE_ENDPOINT}/${input.id}/archive`,
  )

  return unwrapDetail(response.data)
}
