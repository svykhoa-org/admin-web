import axiosInstance from '@/lib/axios'
import type { Document, DocumentStatus } from '@/models/Document'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

const DOCUMENT_ENDPOINT = '/documents'

export interface CreateDocumentInput {
  title: string
  description?: string
  price: number
  categoryId?: string
  status: DocumentStatus
  fileId: string
}

export type CreateDocumentOutput = Document

export async function createDocument(input: CreateDocumentInput): Promise<CreateDocumentOutput> {
  const response = await axiosInstance.post<ApiDetailResponse<CreateDocumentOutput>>(
    DOCUMENT_ENDPOINT,
    input,
  )

  return unwrapDetail(response.data)
}
