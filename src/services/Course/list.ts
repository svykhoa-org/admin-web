import axiosInstance from '@/lib/axios'
import type { Course } from '@/models/Course'
import type { ApiListData, ApiListResponse } from '@/types/api'
import { unwrapList } from '@/utils/apiResponse'

const COURSE_ENDPOINT = '/courses'

// Course list API uses direct query params (not buildQuery format)
export interface ListCourseInput {
  page?: number
  pageSize?: number
  title?: string
  status?: string
  categoryId?: string
  tagId?: string
}

export type ListCourseOutput = ApiListData<Course>

export async function listCourse(input?: ListCourseInput): Promise<ListCourseOutput> {
  const params: Record<string, unknown> = {}
  if (input?.page !== undefined) params.page = input.page
  if (input?.pageSize !== undefined) params.limit = input.pageSize
  if (input?.title) params.title = input.title
  if (input?.status) params.status = input.status
  if (input?.categoryId) params.categoryId = input.categoryId
  if (input?.tagId) params.tagId = input.tagId

  const response = await axiosInstance.get<ApiListResponse<Course>>(COURSE_ENDPOINT, {
    params: Object.keys(params).length > 0 ? params : undefined,
  })

  return unwrapList(response.data)
}
