import axiosInstance from '@/lib/axios'
import type { Course, CourseTagRef } from '@/models/Course'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

const COURSE_ENDPOINT = '/courses'

// null clears a nullable field; undefined leaves it unchanged.
export interface UpdateCourseInput {
  id: string
  title?: string
  subTitle?: string | null
  description?: string | null
  thumbnail?: string | null
  price?: number
  shortCode?: string
  categoryId?: string | null
  tags?: Pick<CourseTagRef, 'id'>[]
  maxEnrollments?: number | null
  requiresVerification?: boolean
  isScheduled?: boolean
  registrationStart?: string | null
  registrationEnd?: string | null
  startDate?: string | null
  endDate?: string | null
  objectives?: string[]
  requirements?: string[]
  suitableFor?: string[]
  instructorIds?: string[]
  totalDurationMinutes?: number
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
