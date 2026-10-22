import axiosInstance from '@/lib/axios'
import type { DoctorVerificationDetail } from '@/models/DoctorVerification'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

export async function getVerificationDetail(input: {
  id: string
}): Promise<DoctorVerificationDetail> {
  const response = await axiosInstance.get<ApiDetailResponse<DoctorVerificationDetail>>(
    `/verification/admin/${input.id}`,
  )
  return unwrapDetail(response.data)
}

// Same payload keyed by user; `null` when the user never submitted.
export async function getVerificationByUser(input: {
  userId: string
}): Promise<DoctorVerificationDetail | null> {
  const response = await axiosInstance.get<ApiDetailResponse<DoctorVerificationDetail | null>>(
    `/verification/admin/by-user/${input.userId}`,
  )
  return unwrapDetail(response.data)
}
