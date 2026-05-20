import axiosInstance from '@/lib/axios'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

const VIDEO_ENDPOINT = '/videos'

export interface MultipartServerPart {
  PartNumber: number
  ETag: string
}

export async function multipartListParts(
  uploadId: string,
  key: string,
): Promise<MultipartServerPart[]> {
  const response = await axiosInstance.get<ApiDetailResponse<MultipartServerPart[]>>(
    `${VIDEO_ENDPOINT}/multipart/parts?uploadId=${encodeURIComponent(uploadId)}&key=${encodeURIComponent(key)}`,
  )
  return unwrapDetail(response.data)
}
