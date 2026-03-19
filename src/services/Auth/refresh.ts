import axiosInstance from '@/lib/axios'
import type { ApiDetailResponse } from '@/types/api'
import type { AuthTokens } from '@/models/AuthTokens'
import { unwrapDetail } from '@/utils/apiResponse'

export interface RefreshInput {
  refreshToken: string
}

export type RefreshOutput = AuthTokens

export async function refresh(input: RefreshInput): Promise<RefreshOutput> {
  const res = await axiosInstance.post<ApiDetailResponse<RefreshOutput>>('/auth/refresh', input)
  return unwrapDetail(res.data)
}
