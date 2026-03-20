import axiosInstance from '@/lib/axios'
import type { DocumentOrder } from '@/models/DocumentOrder'
import type { ApiListData, ApiListResponse } from '@/types/api'
import { unwrapList } from '@/utils/apiResponse'
import { buildQuery, type QueryInput } from '@/utils/buildQuery'

const DOCUMENT_ORDER_ENDPOINT = '/document-orders'

type DocumentOrderSearchFields = 'orderCode' | 'status' | 'paymentMethod' | 'userId' | 'documentId'
type DocumentOrderSortFields = 'createdAt' | 'updatedAt' | 'paidAt' | 'totalAmount'

export type ListDocumentOrderInput = QueryInput<DocumentOrderSearchFields, DocumentOrderSortFields>
export type ListDocumentOrderOutput = ApiListData<DocumentOrder>

export async function listDocumentOrder(
  input?: ListDocumentOrderInput,
): Promise<ListDocumentOrderOutput> {
  const response = await axiosInstance.get<ApiListResponse<DocumentOrder>>(
    DOCUMENT_ORDER_ENDPOINT,
    {
      params: input ? buildQuery(input) : undefined,
    },
  )

  return unwrapList(response.data)
}
