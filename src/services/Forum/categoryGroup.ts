import axiosInstance from '@/lib/axios'
import type { ForumCategoryGroup } from '@/models/Forum'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

const BASE = '/forum/admin/category-groups'

export async function listCategoryGroups(): Promise<ForumCategoryGroup[]> {
  const res = await axiosInstance.get<ApiDetailResponse<ForumCategoryGroup[]>>(BASE)
  return unwrapDetail(res.data)
}

export async function createCategoryGroup(data: {
  name: string
  displayOrder: number
  rank?: string
}): Promise<ForumCategoryGroup> {
  const res = await axiosInstance.post<ApiDetailResponse<ForumCategoryGroup>>(BASE, data)
  return unwrapDetail(res.data)
}

export async function updateCategoryGroup(
  id: string,
  data: { name?: string; displayOrder?: number },
): Promise<ForumCategoryGroup> {
  const res = await axiosInstance.patch<ApiDetailResponse<ForumCategoryGroup>>(
    `${BASE}/${id}`,
    data,
  )
  return unwrapDetail(res.data)
}

export async function deleteCategoryGroup(id: string, replacementGroupId?: string): Promise<void> {
  await axiosInstance.delete(`${BASE}/${id}`, {
    params: { replacementGroupId },
  })
}

export async function reorderCategoryGroup(id: string, direction: 'up' | 'down'): Promise<void> {
  await axiosInstance.patch(`${BASE}/${id}/reorder`, { direction })
}

export async function setGroupRank(id: string, rank: string): Promise<void> {
  await axiosInstance.patch(`${BASE}/${id}/rank`, { rank })
}
