import axiosInstance from '@/lib/axios'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

const ADMIN_ENDPOINT = '/bulletins/admin'

export interface UploadBulletinImageOutput {
  url: string
  assetId: string
}

export async function uploadBulletinImage(file: File): Promise<UploadBulletinImageOutput> {
  const form = new FormData()
  form.append('file', file)
  const response = await axiosInstance.post<ApiDetailResponse<UploadBulletinImageOutput>>(
    `${ADMIN_ENDPOINT}/uploads/image`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  )
  return unwrapDetail(response.data)
}
