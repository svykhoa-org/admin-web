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
  shortCode: string
  categoryId?: string
  tags?: Pick<CourseTagRef, 'id'>[]
  accessDurationDays?: number
  maxEnrollments?: number
  selfPaced?: boolean
  objectives?: string[]
  requirements?: string[]
  suitableFor?: string[]
  instructorIds?: string[]
  cmeCredits?: number
  certifyingOrganization?: string
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
