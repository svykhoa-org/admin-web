import axiosInstance from '@/lib/axios'
import type { CourseTag } from '@/models/CourseTag'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

const ENDPOINT = '/course-tags'

export async function listCourseTag(): Promise<CourseTag[]> {
  const response = await axiosInstance.get<ApiDetailResponse<CourseTag[]>>(ENDPOINT)
  return unwrapDetail(response.data)
}
