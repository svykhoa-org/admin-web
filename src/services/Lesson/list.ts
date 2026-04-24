import axiosInstance from '@/lib/axios'
import type { Lesson } from '@/models/Course'
import type { ApiListData, ApiListResponse } from '@/types/api'
import { unwrapList } from '@/utils/apiResponse'
import { buildQuery } from '@/utils/buildQuery'

const MODULE_ENDPOINT = '/modules'

export interface ListLessonInput {
  moduleId: string
  pageSize?: number
}

export type ListLessonOutput = ApiListData<Lesson>

export async function listLesson(input: ListLessonInput): Promise<ListLessonOutput> {
  const { moduleId, pageSize = 100 } = input

  const response = await axiosInstance.get<ApiListResponse<Lesson>>(
    `${MODULE_ENDPOINT}/${moduleId}/lessons`,
    {
      params: buildQuery({
        pageSize,
        sorter: { field: 'order', direction: 'asc' },
      }),
    },
  )

  return unwrapList(response.data)
}
