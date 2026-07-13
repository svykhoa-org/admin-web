import axiosInstance from '@/lib/axios'
import type { Course, CourseTagRef } from '@/models/Course'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

const COURSE_ENDPOINT = '/courses'

export interface UpdateCourseInput {
  id: string
  title?: string
  subTitle?: string
  description?: string
  thumbnail?: string
  price?: number
  shortCode?: string
  categoryId?: string
  tags?: Pick<CourseTagRef, 'id'>[]
  accessDurationDays?: number
  maxEnrollments?: number
  selfPaced?: boolean
  requiresVerification?: boolean
  objectives?: string[]
  requirements?: string[]
  suitableFor?: string[]
  instructorIds?: string[]
  cmeCredits?: number
  certifyingOrganization?: string
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
