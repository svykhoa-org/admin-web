import axiosInstance from '@/lib/axios'
import type { DocumentOrder } from '@/models/DocumentOrder'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

const DOCUMENT_ORDER_ENDPOINT = '/document-orders'

export interface GetDocumentOrderDetailInput {
  id: string
}

export type GetDocumentOrderDetailOutput = DocumentOrder

export async function getDocumentOrderDetail(
  input: GetDocumentOrderDetailInput,
): Promise<GetDocumentOrderDetailOutput> {
  const response = await axiosInstance.get<ApiDetailResponse<GetDocumentOrderDetailOutput>>(
    `${DOCUMENT_ORDER_ENDPOINT}/${input.id}`,
  )

  return unwrapDetail(response.data)
}
