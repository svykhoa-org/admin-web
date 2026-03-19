import axiosInstance from '@/lib/axios'
import type { Document } from '@/models/Document'
import type { ApiListData, ApiListResponse } from '@/types/api'
import { unwrapList } from '@/utils/apiResponse'
import { buildQuery, type QueryInput } from '@/utils/buildQuery'

const DOCUMENT_ENDPOINT = '/documents'

type DocumentSearchFields = 'title' | 'slug' | 'status' | 'categoryId'
type DocumentSortFields = 'title' | 'price' | 'createdAt' | 'updatedAt'

export type ListDocumentInput = QueryInput<DocumentSearchFields, DocumentSortFields>
export type ListDocumentOutput = ApiListData<Document>

export async function listDocument(input?: ListDocumentInput): Promise<ListDocumentOutput> {
  const response = await axiosInstance.get<ApiListResponse<Document>>(DOCUMENT_ENDPOINT, {
    params: input ? buildQuery(input) : undefined,
  })

  return unwrapList(response.data)
}
