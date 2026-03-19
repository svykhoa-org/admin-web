import axiosInstance from '@/lib/axios'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

const DOCUMENT_ENDPOINT = '/documents'

export interface RemoveDocumentInput {
  id: string
}

export async function removeDocument(input: RemoveDocumentInput): Promise<void> {
  const response = await axiosInstance.delete<ApiDetailResponse<null>>(
    `${DOCUMENT_ENDPOINT}/${input.id}`,
  )

  unwrapDetail(response.data)
}
