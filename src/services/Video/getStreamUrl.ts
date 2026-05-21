import axiosInstance from '@/lib/axios'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

const FILE_BASE_URL = import.meta.env.VITE_API_FILE_URL as string | undefined

function resolveFileUrl(url: string): string {
  if (!FILE_BASE_URL || url.startsWith('http://') || url.startsWith('https://')) return url
  return `${FILE_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`
}

export async function getVideoStreamUrl(videoId: string): Promise<string> {
  const response = await axiosInstance.get<ApiDetailResponse<{ url: string }>>(
    `/videos/${videoId}/stream-url`,
  )
  return resolveFileUrl(unwrapDetail(response.data).url)
}
