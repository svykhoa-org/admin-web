import axiosInstance from '@/lib/axios'
import type { User } from '@/models/User'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

const USER_ENDPOINT = '/users'

export interface ActiveUserInput {
  id: string
}

export type ActiveUserOutput = User

export async function activeUser(input: ActiveUserInput): Promise<ActiveUserOutput> {
  const response = await axiosInstance.patch<ApiDetailResponse<ActiveUserOutput>>(
    `${USER_ENDPOINT}/${input.id}/active`,
  )

  return unwrapDetail(response.data)
}
