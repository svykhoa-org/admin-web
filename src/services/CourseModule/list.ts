import axiosInstance from '@/lib/axios'
import type { CourseModule } from '@/models/Course'
import type { ApiListData, ApiListResponse } from '@/types/api'
import { unwrapList } from '@/utils/apiResponse'
import { buildQuery } from '@/utils/buildQuery'

const COURSE_ENDPOINT = '/courses'

export interface ListCourseModuleInput {
  courseId: string
  pageSize?: number
}

export type ListCourseModuleOutput = ApiListData<CourseModule>

export async function listCourseModule(
  input: ListCourseModuleInput,
): Promise<ListCourseModuleOutput> {
  const { courseId, pageSize = 100 } = input

  const response = await axiosInstance.get<ApiListResponse<CourseModule>>(
    `${COURSE_ENDPOINT}/${courseId}/modules`,
    {
      params: buildQuery({
        pageSize,
        sorter: { field: 'order', direction: 'asc' },
      }),
    },
  )

  return unwrapList(response.data)
}
