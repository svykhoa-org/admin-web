import axiosInstance from '@/lib/axios'
import type { DocumentClassify } from '@/models/DocumentClassify'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

const DOCUMENT_CLASSIFY_ENDPOINT = '/document-classify'

export interface CreateDocumentClassifyInput {
  name: string
  parentId?: string
}

export type CreateDocumentClassifyOutput = DocumentClassify

export async function createDocumentClassify(
  input: CreateDocumentClassifyInput,
): Promise<CreateDocumentClassifyOutput> {
  const response = await axiosInstance.post<ApiDetailResponse<CreateDocumentClassifyOutput>>(
    DOCUMENT_CLASSIFY_ENDPOINT,
    input,
  )

  return unwrapDetail(response.data)
}
