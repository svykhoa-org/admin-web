import axiosInstance from '@/lib/axios'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

const DOCUMENT_CLASSIFY_ENDPOINT = '/document-classify'

export interface RemoveDocumentClassifyInput {
  id: string
}

export type RemoveDocumentClassifyOutput = void

export async function removeDocumentClassify(input: RemoveDocumentClassifyInput): Promise<void> {
  const response = await axiosInstance.delete<ApiDetailResponse<null>>(
    `${DOCUMENT_CLASSIFY_ENDPOINT}/${input.id}`,
  )

  unwrapDetail(response.data)
}
