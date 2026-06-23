import axiosInstance from '@/lib/axios'
import type { ApiListData, ApiListResponse } from '@/types/api'
import { unwrapList } from '@/utils/apiResponse'
import type { VideoDto } from './createVideo'

const VIDEO_ENDPOINT = '/videos'

export interface ListVideosInput {
  page?: number
  pageSize?: number
  search?: string
  authorId?: string
  tagId?: string
}

export type ListVideosOutput = ApiListData<VideoDto>

export async function listVideos(input?: ListVideosInput): Promise<ListVideosOutput> {
  const params: Record<string, unknown> = {}
  if (input?.page !== undefined) params.page = input.page
  if (input?.pageSize !== undefined) params.limit = input.pageSize
  if (input?.search) params.search = input.search
  if (input?.authorId) params.authorId = input.authorId
  if (input?.tagId) params.tagId = input.tagId

  const response = await axiosInstance.get<ApiListResponse<VideoDto>>(VIDEO_ENDPOINT, {
    params: Object.keys(params).length > 0 ? params : undefined,
  })

  return unwrapList(response.data)
}
