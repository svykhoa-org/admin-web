import axiosInstance from '@/lib/axios'
import type { Certificate } from '@/models/Certificate'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

export async function deliverCertificate(input: { id: string }): Promise<Certificate> {
  const response = await axiosInstance.patch<ApiDetailResponse<Certificate>>(
    `/certificates/${input.id}/deliver`,
  )
  return unwrapDetail(response.data)
}
