import axiosInstance from '@/lib/axios'
import type { ForumPrefixTag } from '@/models/Forum'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

const BASE = '/forum/admin/prefix-tags'

export async function listPrefixTags(): Promise<ForumPrefixTag[]> {
  const res = await axiosInstance.get<ApiDetailResponse<ForumPrefixTag[]>>(BASE)
  return unwrapDetail(res.data)
}

export async function createPrefixTag(data: {
  name: string
  colorHex: string
}): Promise<ForumPrefixTag> {
  const res = await axiosInstance.post<ApiDetailResponse<ForumPrefixTag>>(BASE, data)
  return unwrapDetail(res.data)
}

export async function updatePrefixTag(
  id: string,
  data: { name?: string; colorHex?: string },
): Promise<ForumPrefixTag> {
  const res = await axiosInstance.patch<ApiDetailResponse<ForumPrefixTag>>(`${BASE}/${id}`, data)
  return unwrapDetail(res.data)
}

export async function deletePrefixTag(id: string): Promise<void> {
  await axiosInstance.delete(`${BASE}/${id}`)
}
