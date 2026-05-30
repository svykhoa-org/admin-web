import axiosInstance from '@/lib/axios'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

export interface OrderStats {
  pendingOrders: number
  revenueThisMonth: number
  completedThisMonth: number
  refundedOrders: number
}

export async function getOrderStats(): Promise<OrderStats> {
  const response = await axiosInstance.get<ApiDetailResponse<OrderStats>>('/orders/stats')
  return unwrapDetail(response.data)
}
