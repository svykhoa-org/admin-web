import axiosInstance from '@/lib/axios'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

const VIDEO_ENDPOINT = '/videos'

export interface ConfirmVideoUploadInput {
  id: string
}

export interface ConfirmVideoUploadOutput {
  id: string
  status: 'processing'
  originalKey: string
}

export async function confirmVideoUpload(
  input: ConfirmVideoUploadInput,
): Promise<ConfirmVideoUploadOutput> {
  const response = await axiosInstance.post<ApiDetailResponse<ConfirmVideoUploadOutput>>(
    `${VIDEO_ENDPOINT}/${input.id}/confirm`,
  )

  return unwrapDetail(response.data)
}
