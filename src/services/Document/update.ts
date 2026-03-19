import axiosInstance from '@/lib/axios'
import type { Document } from '@/models/Document'
import type { CreateDocumentInput } from './create'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

const DOCUMENT_ENDPOINT = '/documents'

export interface UpdateDocumentInput extends Partial<CreateDocumentInput> {
  id: string
}

export type UpdateDocumentOutput = Document

export async function updateDocument(input: UpdateDocumentInput): Promise<UpdateDocumentOutput> {
  const { id, ...payload } = input

  const response = await axiosInstance.patch<ApiDetailResponse<UpdateDocumentOutput>>(
    `${DOCUMENT_ENDPOINT}/${id}`,
    payload,
  )

  return unwrapDetail(response.data)
}
