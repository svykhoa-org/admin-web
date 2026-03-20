import axiosInstance from '@/lib/axios'
import { type User } from '@/models/User'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

export interface CreateAdminInput {
  email: string
  fullName: string
  password: string
}

export type CreateAdminOutput = User

export async function createAdmin(input: CreateAdminInput): Promise<CreateAdminOutput> {
  const response = await axiosInstance.post<ApiDetailResponse<CreateAdminOutput>>(
    '/users/admin',
    input,
  )

  return unwrapDetail(response.data)
}
