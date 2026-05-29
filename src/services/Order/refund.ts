import axiosInstance from '@/lib/axios'
import type { Order } from '@/models/Order'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

export async function refundOrder(input: { id: string }): Promise<Order> {
  const response = await axiosInstance.patch<ApiDetailResponse<Order>>(`/orders/${input.id}/refund`)
  return unwrapDetail(response.data)
}
