import axiosInstance from '@/lib/axios'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'
import type { VideoDto } from './createVideo'

const VIDEO_ENDPOINT = '/videos'

export interface GetVideoInput {
  id: string
}

export type GetVideoOutput = VideoDto

export async function getVideo(input: GetVideoInput): Promise<GetVideoOutput> {
  const response = await axiosInstance.get<ApiDetailResponse<GetVideoOutput>>(
    `${VIDEO_ENDPOINT}/${input.id}`,
  )
  return unwrapDetail(response.data)
}
