import axiosInstance from '@/lib/axios'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

const LESSON_ENDPOINT = '/lessons'

export interface RemoveLessonInput {
  id: string
}

export async function removeLesson(input: RemoveLessonInput): Promise<void> {
  const response = await axiosInstance.delete<ApiDetailResponse<null>>(
    `${LESSON_ENDPOINT}/${input.id}`,
  )

  unwrapDetail(response.data)
}
