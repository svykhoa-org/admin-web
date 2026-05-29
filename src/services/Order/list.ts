import axiosInstance from '@/lib/axios'
import type { Order } from '@/models/Order'
import type { ApiListData, ApiListResponse } from '@/types/api'
import { unwrapList } from '@/utils/apiResponse'
import { buildQuery, type QueryInput } from '@/utils/buildQuery'

const ENDPOINT = '/orders'

type OrderSearchFields = 'orderCode' | 'status' | 'productType' | 'userId' | 'productId'
type OrderSortFields = 'createdAt' | 'updatedAt' | 'paidAt' | 'totalAmount'

export type ListOrderInput = QueryInput<OrderSearchFields, OrderSortFields>
export type ListOrderOutput = ApiListData<Order>

export async function listOrder(input?: ListOrderInput): Promise<ListOrderOutput> {
  const response = await axiosInstance.get<ApiListResponse<Order>>(ENDPOINT, {
    params: input ? buildQuery(input) : undefined,
  })
  return unwrapList(response.data)
}
