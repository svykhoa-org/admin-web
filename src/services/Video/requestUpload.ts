import axiosInstance from '@/lib/axios'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

const VIDEO_ENDPOINT = '/videos'

export interface RequestVideoUploadInput {
  filename: string
}

export interface RequestVideoUploadOutput {
  videoId: string
  uploadUrl: string
  key: string
}

export async function requestVideoUpload(
  input: RequestVideoUploadInput,
): Promise<RequestVideoUploadOutput> {
  const response = await axiosInstance.post<ApiDetailResponse<RequestVideoUploadOutput>>(
    `${VIDEO_ENDPOINT}/request-upload`,
    input,
  )

  return unwrapDetail(response.data)
}
