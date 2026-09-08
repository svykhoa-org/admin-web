import axiosInstance from '@/lib/axios'
import type { BulletinCategory } from '@/models/Bulletin'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

const CATEGORY_ENDPOINT = '/bulletin-categories'

export interface BulletinCategoryInput {
  name: string
  description?: string | null
  color?: string | null
}

export async function listBulletinCategories(): Promise<BulletinCategory[]> {
  const response = await axiosInstance.get<ApiDetailResponse<BulletinCategory[]>>(CATEGORY_ENDPOINT)
  return unwrapDetail(response.data)
}

export async function createBulletinCategory(
  input: BulletinCategoryInput,
): Promise<BulletinCategory> {
  const response = await axiosInstance.post<ApiDetailResponse<BulletinCategory>>(
    CATEGORY_ENDPOINT,
    input,
  )
  return unwrapDetail(response.data)
}

export async function updateBulletinCategory(
  id: string,
  input: Partial<BulletinCategoryInput>,
): Promise<BulletinCategory> {
  const response = await axiosInstance.patch<ApiDetailResponse<BulletinCategory>>(
    `${CATEGORY_ENDPOINT}/${id}`,
    input,
  )
  return unwrapDetail(response.data)
}

export async function removeBulletinCategory(id: string): Promise<void> {
  await axiosInstance.delete(`${CATEGORY_ENDPOINT}/${id}`)
}
