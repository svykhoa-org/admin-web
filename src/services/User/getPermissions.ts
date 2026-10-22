import axiosInstance from '@/lib/axios'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

const USER_ENDPOINT = '/users'

export interface GetUserPermissionsInput {
  id: string
}

export type GetUserPermissionsOutput = string[]

export async function getUserPermissions(
  input: GetUserPermissionsInput,
): Promise<GetUserPermissionsOutput> {
  const response = await axiosInstance.get<ApiDetailResponse<GetUserPermissionsOutput>>(
    `${USER_ENDPOINT}/${input.id}/permissions`,
  )

  return unwrapDetail(response.data)
}
