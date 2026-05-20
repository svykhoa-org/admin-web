import axiosInstance from '@/lib/axios'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

const VIDEO_ENDPOINT = '/videos'

export interface MultipartInitInput {
  filename: string
  fileSize: number
  contentType: string
}

export interface MultipartPartInfo {
  partNumber: number
  url: string
}

export interface MultipartInitOutput {
  videoId: string
  uploadId: string
  key: string
  chunkSize: number
  totalParts: number
  parts: MultipartPartInfo[]
}

export async function multipartInit(input: MultipartInitInput): Promise<MultipartInitOutput> {
  const response = await axiosInstance.post<ApiDetailResponse<MultipartInitOutput>>(
    `${VIDEO_ENDPOINT}/multipart/init`,
    input,
  )
  return unwrapDetail(response.data)
}
