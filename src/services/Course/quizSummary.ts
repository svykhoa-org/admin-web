import axiosInstance from '@/lib/axios'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

const COURSE_ENDPOINT = '/courses'

export interface LinkedQuizLesson {
  id: string
  title: string
  moduleTitle: string
  modulePosition: number
  lessonPosition: number
}

export interface CourseQuizSummaryItem {
  quizId: string
  title: string
  linkedLesson: LinkedQuizLesson | null
  passingScore: number
  questionCount: number
  attempted: number
  passed: number
  averageScore: number | null
}

export async function getCourseQuizSummary(courseId: string): Promise<CourseQuizSummaryItem[]> {
  const response = await axiosInstance.get<ApiDetailResponse<CourseQuizSummaryItem[]>>(
    `${COURSE_ENDPOINT}/${courseId}/quiz-summary`,
  )
  return unwrapDetail(response.data)
}
