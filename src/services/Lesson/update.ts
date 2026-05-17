import axiosInstance from '@/lib/axios'
import type { Lesson, LessonType } from '@/models/Course'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

const LESSON_ENDPOINT = '/lessons'

export interface UpdateLessonInput {
  id: string
  title?: string
  description?: string
  type?: LessonType
  order?: number
  contentId?: string
  durationMinutes?: number
  isRequired?: boolean
  isPreview?: boolean
  prerequisiteLessonId?: string
}

export type UpdateLessonOutput = Lesson

export async function updateLesson(input: UpdateLessonInput): Promise<UpdateLessonOutput> {
  const { id, ...payload } = input
  const response = await axiosInstance.patch<ApiDetailResponse<UpdateLessonOutput>>(
    `${LESSON_ENDPOINT}/${id}`,
    payload,
  )
  return unwrapDetail(response.data)
}
