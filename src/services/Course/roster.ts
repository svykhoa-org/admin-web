import axiosInstance from '@/lib/axios'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

const COURSE_ENDPOINT = '/courses'

export interface RosterLearner {
  userId: string
  fullName: string | null
  email: string | null
  status: string
  progress: number
  enrolledAt: string
  completedAt: string | null
  certificateCode: string | null
  // Present only for verified-only (requiresVerification) courses.
  licenseFullName?: string | null
  licenseNumber?: string | null
  verificationStatus?: string | null
}

export interface CourseRoster {
  course: {
    id: string
    title: string
    isScheduled: boolean
    requiresVerification: boolean
    startDate: string | null
    endDate: string | null
    maxEnrollments: number | null
    currentEnrollments: number
  }
  instructors: Array<{
    id: string
    fullName: string
    avatar: string | null
    source: 'auto' | 'manual'
  }>
  learners: RosterLearner[]
}

export async function getCourseRoster(courseId: string): Promise<CourseRoster> {
  const response = await axiosInstance.get<ApiDetailResponse<CourseRoster>>(
    `${COURSE_ENDPOINT}/${courseId}/roster`,
  )
  return unwrapDetail(response.data)
}
