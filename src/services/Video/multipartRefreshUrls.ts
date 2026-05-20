import axiosInstance from '@/lib/axios'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

const VIDEO_ENDPOINT = '/videos'

export interface MultipartRefreshUrlsInput {
  uploadId: string
  key: string
  partNumbers: number[]
}

export interface MultipartRefreshUrlsOutput {
  parts: { partNumber: number; url: string }[]
}

export async function multipartRefreshUrls(
  input: MultipartRefreshUrlsInput,
): Promise<MultipartRefreshUrlsOutput> {
  const response = await axiosInstance.post<ApiDetailResponse<MultipartRefreshUrlsOutput>>(
    `${VIDEO_ENDPOINT}/multipart/refresh-urls`,
    input,
  )
  return unwrapDetail(response.data)
}
