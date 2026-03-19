import axiosInstance from '@/lib/axios'
import type { DocumentClassify } from '@/models/DocumentClassify'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

const DOCUMENT_CLASSIFY_ENDPOINT = '/document-classify'

export interface GetDocumentClassifyDetailInput {
  id: string
}

export type GetDocumentClassifyDetailOutput = DocumentClassify

export async function getDocumentClassifyDetail(
  input: GetDocumentClassifyDetailInput,
): Promise<GetDocumentClassifyDetailOutput> {
  const response = await axiosInstance.get<ApiDetailResponse<GetDocumentClassifyDetailOutput>>(
    `${DOCUMENT_CLASSIFY_ENDPOINT}/${input.id}`,
  )

  return unwrapDetail(response.data)
}
