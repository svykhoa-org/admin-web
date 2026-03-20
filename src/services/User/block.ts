import axiosInstance from '@/lib/axios'
import type { User } from '@/models/User'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

const USER_ENDPOINT = '/users'

export interface BlockUserInput {
  id: string
}

export type BlockUserOutput = User

export async function blockUser(input: BlockUserInput): Promise<BlockUserOutput> {
  const response = await axiosInstance.patch<ApiDetailResponse<BlockUserOutput>>(
    `${USER_ENDPOINT}/${input.id}/block`,
  )

  return unwrapDetail(response.data)
}
