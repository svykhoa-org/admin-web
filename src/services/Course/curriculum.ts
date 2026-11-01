import axiosInstance from '@/lib/axios'
import type { CourseModule, Lesson } from '@/models/Course'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

const COURSE_ENDPOINT = '/courses'

export type CurriculumModule = CourseModule & { lessons?: Lesson[] }

export async function getCourseCurriculum(courseId: string): Promise<CurriculumModule[]> {
  const response = await axiosInstance.get<ApiDetailResponse<{ curriculum: CurriculumModule[] }>>(
    `${COURSE_ENDPOINT}/${courseId}/curriculum`,
  )
  return unwrapDetail(response.data).curriculum
}
