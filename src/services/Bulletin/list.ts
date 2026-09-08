import axiosInstance from '@/lib/axios'
import { type Bulletin, type BulletinStatus } from '@/models/Bulletin'
import type { ApiListData, ApiListResponse } from '@/types/api'
import { unwrapList } from '@/utils/apiResponse'

const ADMIN_ENDPOINT = '/bulletins/admin'

export interface ListBulletinInput {
  page?: number
  limit?: number
  search?: string
  categoryId?: string
  status?: BulletinStatus
}

export type ListBulletinOutput = ApiListData<Bulletin>

export async function listBulletin(input?: ListBulletinInput): Promise<ListBulletinOutput> {
  const response = await axiosInstance.get<ApiListResponse<Bulletin>>(ADMIN_ENDPOINT, {
    params: input,
  })
  return unwrapList(response.data)
}
