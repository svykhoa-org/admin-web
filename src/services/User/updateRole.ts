import axiosInstance from '@/lib/axios'
import type { User, UserRole } from '@/models/User'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

const USER_ENDPOINT = '/users'

export interface UpdateUserRoleInput {
  id: string
  role: UserRole
}

export type UpdateUserRoleOutput = User

export async function updateUserRole(input: UpdateUserRoleInput): Promise<UpdateUserRoleOutput> {
  const response = await axiosInstance.patch<ApiDetailResponse<UpdateUserRoleOutput>>(
    `${USER_ENDPOINT}/${input.id}/role`,
    { role: input.role },
  )

  return unwrapDetail(response.data)
}
