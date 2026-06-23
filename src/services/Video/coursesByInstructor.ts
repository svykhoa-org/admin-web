import axiosInstance from '@/lib/axios'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'
import type { VideoDto } from './createVideo'

const VIDEO_ENDPOINT = '/videos'

export interface CourseRef {
  id: string
  title: string
}

export interface CourseWithVideos {
  course: CourseRef
  videos: VideoDto[]
}

export interface CoursesByInstructorInput {
  userId: string
}

export type CoursesByInstructorOutput = CourseWithVideos[]

export async function coursesByInstructor(
  input: CoursesByInstructorInput,
): Promise<CoursesByInstructorOutput> {
  const response = await axiosInstance.get<ApiDetailResponse<CoursesByInstructorOutput>>(
    `${VIDEO_ENDPOINT}/by-instructor/${input.userId}/courses`,
  )
  return unwrapDetail(response.data)
}
