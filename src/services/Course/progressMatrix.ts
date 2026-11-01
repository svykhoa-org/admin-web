import axiosInstance from '@/lib/axios'
import type { LessonType } from '@/models/Course'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

const COURSE_ENDPOINT = '/courses'

export type MatrixCellState = 'not_started' | 'in_progress' | 'done' | 'pending' | 'failed'
export type ProgressMatrixFilter = 'active' | 'completed' | 'inactive' | 'quiz_failed'

export interface MatrixCell {
  state: MatrixCellState
  percent: number | null
  score: number | null
  attempts: number
}

export interface ProgressMatrixColumn {
  moduleId: string
  moduleTitle: string
  lessons: { id: string; title: string; type: LessonType; isRequired: boolean }[]
}

export interface ProgressMatrixRow {
  enrollmentId: string
  userId: string
  fullName: string | null
  email: string | null
  status: string
  progress: number
  lastActivityAt: string | null
  certificateCode: string | null
  cells: Record<string, MatrixCell>
}

export interface ProgressMatrix {
  columns: ProgressMatrixColumn[]
  rows: ProgressMatrixRow[]
  total: number
}

export interface GetProgressMatrixInput {
  courseId: string
  page?: number
  pageSize?: number
  search?: string
  filter?: ProgressMatrixFilter
}

export async function getProgressMatrix({
  courseId,
  ...params
}: GetProgressMatrixInput): Promise<ProgressMatrix> {
  const response = await axiosInstance.get<ApiDetailResponse<ProgressMatrix>>(
    `${COURSE_ENDPOINT}/${courseId}/progress-matrix`,
    { params },
  )
  return unwrapDetail(response.data)
}
