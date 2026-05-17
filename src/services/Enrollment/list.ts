import axiosInstance from '@/lib/axios'
import type { Enrollment } from '@/models/Enrollment'
import type { ApiListData, ApiListResponse } from '@/types/api'
import { unwrapList } from '@/utils/apiResponse'
import { buildQuery, type QueryInput } from '@/utils/buildQuery'

const ENDPOINT = '/enrollments'

type EnrollmentSearchFields = 'userId' | 'courseId' | 'status'
type EnrollmentSortFields = 'enrolledAt' | 'createdAt'

export type ListEnrollmentInput = QueryInput<EnrollmentSearchFields, EnrollmentSortFields>
export type ListEnrollmentOutput = ApiListData<Enrollment>

export async function listEnrollment(input?: ListEnrollmentInput): Promise<ListEnrollmentOutput> {
  const response = await axiosInstance.get<ApiListResponse<Enrollment>>(ENDPOINT, {
    params: input ? buildQuery(input) : undefined,
  })
  return unwrapList(response.data)
}
