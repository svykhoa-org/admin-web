import axiosInstance from '@/lib/axios'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'
import type { VideoDto, VideoTag } from './createVideo'

const VIDEO_ENDPOINT = '/videos'

export interface UpdateVideoInput {
  id: string
  title?: string
  description?: string
  authorId?: string
  tags?: Pick<VideoTag, 'id'>[]
  durationMinutes?: number
}

export type UpdateVideoOutput = VideoDto

export async function updateVideo(input: UpdateVideoInput): Promise<UpdateVideoOutput> {
  const { id, ...payload } = input
  const response = await axiosInstance.patch<ApiDetailResponse<UpdateVideoOutput>>(
    `${VIDEO_ENDPOINT}/${id}`,
    payload,
  )
  return unwrapDetail(response.data)
}
