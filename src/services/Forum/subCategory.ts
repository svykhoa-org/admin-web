import axiosInstance from '@/lib/axios'
import type { ForumSubCategory } from '@/models/Forum'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

const BASE = '/forum/admin/sub-categories'

export async function listSubCategories(): Promise<ForumSubCategory[]> {
  const res = await axiosInstance.get<ApiDetailResponse<ForumSubCategory[]>>(BASE)
  return unwrapDetail(res.data)
}

export async function createSubCategory(data: {
  name: string
  description?: string
  groupId: string
  displayOrder: number
}): Promise<ForumSubCategory> {
  const res = await axiosInstance.post<ApiDetailResponse<ForumSubCategory>>(BASE, data)
  return unwrapDetail(res.data)
}

export async function updateSubCategory(
  id: string,
  data: { name?: string; description?: string; groupId?: string; displayOrder?: number },
): Promise<ForumSubCategory> {
  const res = await axiosInstance.patch<ApiDetailResponse<ForumSubCategory>>(`${BASE}/${id}`, data)
  return unwrapDetail(res.data)
}

export async function deleteSubCategory(id: string): Promise<void> {
  await axiosInstance.delete(`${BASE}/${id}`)
}
