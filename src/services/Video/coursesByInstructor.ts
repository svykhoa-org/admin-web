import axiosInstance from '@/lib/axios'
import type { Course } from '@/models/Course'
import type { ApiListData, ApiListResponse } from '@/types/api'
import { unwrapList } from '@/utils/apiResponse'

const VIDEO_ENDPOINT = '/videos'

export interface CoursesByInstructorInput {
  userId: string
}

export type CoursesByInstructorOutput = ApiListData<Course>

export async function coursesByInstructor(
  input: CoursesByInstructorInput,
): Promise<CoursesByInstructorOutput> {
  const response = await axiosInstance.get<ApiListResponse<Course>>(
    `${VIDEO_ENDPOINT}/by-instructor/${input.userId}/courses`,
  )
  return unwrapList(response.data)
}
