import axiosInstance from '@/lib/axios'
import type { Lesson, LessonType } from '@/models/Course'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

const MODULE_ENDPOINT = '/modules'

export interface CreateLessonInput {
  moduleId: string
  title: string
  type: LessonType
  order: number
  contentId?: string
  isFinal?: boolean
}

export type CreateLessonOutput = Lesson

export async function createLesson(input: CreateLessonInput): Promise<CreateLessonOutput> {
  const { moduleId, ...payload } = input

  const response = await axiosInstance.post<ApiDetailResponse<CreateLessonOutput>>(
    `${MODULE_ENDPOINT}/${moduleId}/lessons`,
    payload,
  )

  return unwrapDetail(response.data)
}
