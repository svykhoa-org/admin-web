import axiosInstance from '@/lib/axios'
import type { User } from '@/models/User'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

const USER_ENDPOINT = '/users'

export interface GetUserDetailInput {
  id: string
}

export type GetUserDetailOutput = User

export async function getUserDetail(input: GetUserDetailInput): Promise<GetUserDetailOutput> {
  const response = await axiosInstance.get<ApiDetailResponse<GetUserDetailOutput>>(
    `${USER_ENDPOINT}/${input.id}`,
  )

  return unwrapDetail(response.data)
}
