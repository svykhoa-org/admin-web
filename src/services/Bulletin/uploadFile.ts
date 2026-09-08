import axiosInstance from '@/lib/axios'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

const ADMIN_ENDPOINT = '/bulletins/admin'

export interface UploadBulletinFileOutput {
  assetId: string
  url: string
  originalName: string
  mimetype: string
  size: number
}

// Upload a downloadable attachment (any file type) → returns asset info.
export async function uploadBulletinFile(file: File): Promise<UploadBulletinFileOutput> {
  const form = new FormData()
  form.append('file', file)
  const response = await axiosInstance.post<ApiDetailResponse<UploadBulletinFileOutput>>(
    `${ADMIN_ENDPOINT}/uploads/file`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  )
  return unwrapDetail(response.data)
}
