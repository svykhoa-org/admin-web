import axiosInstance from '@/lib/axios'
import type { User } from '@/models/User'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

// Unlike the login response, the profile carries `permissions` for admins.
export async function getProfile(): Promise<User> {
  const res = await axiosInstance.get<ApiDetailResponse<User>>('/auth/profile')
  return unwrapDetail(res.data)
}
