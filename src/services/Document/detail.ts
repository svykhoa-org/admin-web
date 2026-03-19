import axiosInstance from '@/lib/axios'
import type { Document } from '@/models/Document'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

const DOCUMENT_ENDPOINT = '/documents'

export interface GetDocumentDetailInput {
  id: string
}

export type GetDocumentDetailOutput = Document

export async function getDocumentDetail(
  input: GetDocumentDetailInput,
): Promise<GetDocumentDetailOutput> {
  const response = await axiosInstance.get<ApiDetailResponse<GetDocumentDetailOutput>>(
    `${DOCUMENT_ENDPOINT}/${input.id}`,
  )

  return unwrapDetail(response.data)
}
