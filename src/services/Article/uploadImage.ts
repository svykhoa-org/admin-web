import axiosInstance from '@/lib/axios'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

const ADMIN_ENDPOINT = '/articles/admin'

export interface UploadArticleImageOutput {
  url: string
  assetId: string
}

// Upload an inline editor image → returns the public URL to embed in the HTML.
export async function uploadArticleImage(file: File): Promise<UploadArticleImageOutput> {
  const form = new FormData()
  form.append('file', file)
  const response = await axiosInstance.post<ApiDetailResponse<UploadArticleImageOutput>>(
    `${ADMIN_ENDPOINT}/uploads/image`,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  )
  return unwrapDetail(response.data)
}
