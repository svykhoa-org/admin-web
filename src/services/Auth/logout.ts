import axiosInstance from '@/lib/axios'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

export async function logout(): Promise<void> {
  const res = await axiosInstance.post<ApiDetailResponse<null>>('/auth/logout')
  unwrapDetail(res.data)
}
