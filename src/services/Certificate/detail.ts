import axiosInstance from '@/lib/axios'
import type { Certificate } from '@/models/Certificate'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

export async function getCertificateDetail(input: { id: string }): Promise<Certificate> {
  const response = await axiosInstance.get<ApiDetailResponse<Certificate>>(
    `/certificates/${input.id}`,
  )
  return unwrapDetail(response.data)
}
