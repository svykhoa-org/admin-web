import axiosInstance from '@/lib/axios'
import type { DocumentClassify } from '@/models/DocumentClassify'
import type { CreateDocumentClassifyInput } from './create'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

const DOCUMENT_CLASSIFY_ENDPOINT = '/document-classify'

export interface UpdateDocumentClassifyInput extends Partial<CreateDocumentClassifyInput> {
  id: string
}

export type UpdateDocumentClassifyOutput = DocumentClassify

export async function updateDocumentClassify(
  input: UpdateDocumentClassifyInput,
): Promise<UpdateDocumentClassifyOutput> {
  const { id, ...payload } = input

  const response = await axiosInstance.patch<ApiDetailResponse<UpdateDocumentClassifyOutput>>(
    `${DOCUMENT_CLASSIFY_ENDPOINT}/${id}`,
    payload,
  )

  return unwrapDetail(response.data)
}
