import axiosInstance from '@/lib/axios'
import type { Permission } from '@/models/Permission'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

const USER_ENDPOINT = '/users'

export interface UpdateUserPermissionsInput {
  id: string
  permissions: Permission[]
}

export type UpdateUserPermissionsOutput = string[]

export async function updateUserPermissions(
  input: UpdateUserPermissionsInput,
): Promise<UpdateUserPermissionsOutput> {
  const response = await axiosInstance.put<ApiDetailResponse<UpdateUserPermissionsOutput>>(
    `${USER_ENDPOINT}/${input.id}/permissions`,
    { permissions: input.permissions },
  )

  return unwrapDetail(response.data)
}
