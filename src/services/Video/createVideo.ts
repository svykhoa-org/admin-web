import axiosInstance from '@/lib/axios'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

const VIDEO_ENDPOINT = '/videos'

export interface VideoTag {
  id: string
  name: string
  color: string | null
}

export interface VideoDto {
  id: string
  authorId: string | null
  assetId: string
  title: string
  description: string | null
  tags: VideoTag[] | null
  durationMinutes: number
}

export interface CreateVideoInput {
  assetId: string
  authorId?: string
  title: string
  description?: string
  tags?: Pick<VideoTag, 'id'>[]
  durationMinutes?: number
}

export type CreateVideoOutput = VideoDto

export async function createVideo(input: CreateVideoInput): Promise<CreateVideoOutput> {
  const response = await axiosInstance.post<ApiDetailResponse<CreateVideoOutput>>(
    VIDEO_ENDPOINT,
    input,
  )
  return unwrapDetail(response.data)
}
