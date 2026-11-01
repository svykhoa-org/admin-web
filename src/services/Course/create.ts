import axiosInstance from '@/lib/axios'
import type { Course, CourseTagRef } from '@/models/Course'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

const COURSE_ENDPOINT = '/courses'

export interface CreateCourseInput {
  title: string
  subTitle?: string
  description?: string
  thumbnail?: string
  price: number
  shortCode?: string
  categoryId?: string
  tags?: Pick<CourseTagRef, 'id'>[]
  maxEnrollments?: number
  requiresVerification?: boolean
  isScheduled?: boolean
  registrationStart?: string
  registrationEnd?: string
  startDate?: string
  endDate?: string
  objectives?: string[]
  requirements?: string[]
  suitableFor?: string[]
  instructorIds?: string[]
  totalDurationMinutes?: number
}

export type CreateCourseOutput = Course

export async function createCourse(input: CreateCourseInput): Promise<CreateCourseOutput> {
  const response = await axiosInstance.post<ApiDetailResponse<CreateCourseOutput>>(
    COURSE_ENDPOINT,
    input,
  )
  return unwrapDetail(response.data)
}
