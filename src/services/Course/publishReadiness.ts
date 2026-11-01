import axiosInstance from '@/lib/axios'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

const COURSE_ENDPOINT = '/courses'

export interface PublishReadinessItem {
  key: string
  ok: boolean
  message: string
  lessonId?: string
}

export interface PublishReadiness {
  ready: boolean
  items: PublishReadinessItem[]
}

export async function getPublishReadiness(courseId: string): Promise<PublishReadiness> {
  const response = await axiosInstance.get<ApiDetailResponse<PublishReadiness>>(
    `${COURSE_ENDPOINT}/${courseId}/publish-readiness`,
  )
  return unwrapDetail(response.data)
}
