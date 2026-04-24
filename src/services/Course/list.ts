import axiosInstance from '@/lib/axios'
import type { Course } from '@/models/Course'
import type { ApiListData, ApiListResponse } from '@/types/api'
import { unwrapList } from '@/utils/apiResponse'
import { buildQuery, type QueryInput } from '@/utils/buildQuery'

const COURSE_ENDPOINT = '/courses'

type CourseSearchFields = 'title' | 'status' | 'shortCode'
type CourseSortFields = 'title' | 'price' | 'createdAt' | 'updatedAt'

export type ListCourseInput = QueryInput<CourseSearchFields, CourseSortFields>
export type ListCourseOutput = ApiListData<Course>

export async function listCourse(input?: ListCourseInput): Promise<ListCourseOutput> {
  const response = await axiosInstance.get<ApiListResponse<Course>>(COURSE_ENDPOINT, {
    params: input ? buildQuery(input) : undefined,
  })

  return unwrapList(response.data)
}
