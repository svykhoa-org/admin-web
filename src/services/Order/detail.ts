import axiosInstance from '@/lib/axios'
import type { Order } from '@/models/Order'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

export async function getOrderDetail(input: { id: string }): Promise<Order> {
  const response = await axiosInstance.get<ApiDetailResponse<Order>>(`/orders/${input.id}`)
  return unwrapDetail(response.data)
}
