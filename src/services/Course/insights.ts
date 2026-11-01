import axiosInstance from '@/lib/axios'
import type { LessonType } from '@/models/Course'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

const COURSE_ENDPOINT = '/courses'

export interface CourseInsights {
  summary: {
    enrolled: number
    active: number
    completed: number
    expired: number
    notStarted: number
    inactive: number
    stalled: number
    started: number
    halfway: number
    certificates: number
    quizFailed: number
    revenue: number
  }
  enrollmentsByWeek: { weekStart: string; count: number }[]
  lessons: {
    id: string
    title: string
    moduleTitle: string
    type: LessonType
    isRequired: boolean
    completed: number
  }[]
  quizzes: {
    lessonId: string
    title: string
    attempted: number
    passed: number
    averageScore: number | null
  }[]
}

export async function getCourseInsights(courseId: string): Promise<CourseInsights> {
  const response = await axiosInstance.get<ApiDetailResponse<CourseInsights>>(
    `${COURSE_ENDPOINT}/${courseId}/insights`,
  )
  return unwrapDetail(response.data)
}
