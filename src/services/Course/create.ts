import axiosInstance from '@/lib/axios'
import type { Course } from '@/models/Course'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

const COURSE_ENDPOINT = '/courses'

export interface CreateCourseInput {
  title: string
  description?: string
  price: number
  shortCode: string
}

export type CreateCourseOutput = Course

export async function createCourse(input: CreateCourseInput): Promise<CreateCourseOutput> {
  // Delay 5s
  await new Promise(resolve => setTimeout(resolve, 5000))

  const response = await axiosInstance.post<ApiDetailResponse<CreateCourseOutput>>(
    COURSE_ENDPOINT,
    input,
  )

  return unwrapDetail(response.data)
}
