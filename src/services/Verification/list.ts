import axiosInstance from '@/lib/axios'
import type { DoctorVerification } from '@/models/DoctorVerification'
import type { ApiListData, ApiListResponse } from '@/types/api'
import { unwrapList } from '@/utils/apiResponse'
import { buildQuery, type QueryInput } from '@/utils/buildQuery'

const ENDPOINT = '/verification/admin'

type VerificationSearchFields = 'status' | 'userId'
type VerificationSortFields = 'createdAt' | 'updatedAt' | 'reviewedAt'

export type ListVerificationInput = QueryInput<VerificationSearchFields, VerificationSortFields>
export type ListVerificationOutput = ApiListData<DoctorVerification>

export async function listVerification(
  input?: ListVerificationInput,
): Promise<ListVerificationOutput> {
  const response = await axiosInstance.get<ApiListResponse<DoctorVerification>>(ENDPOINT, {
    params: input ? buildQuery(input) : undefined,
  })
  return unwrapList(response.data)
}
