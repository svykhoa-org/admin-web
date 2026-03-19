import axiosInstance from '@/lib/axios'
import type { DocumentClassify } from '@/models/DocumentClassify'
import type { ApiListData, ApiListResponse } from '@/types/api'
import { unwrapList } from '@/utils/apiResponse'
import { buildQuery, type QueryInput } from '@/utils/buildQuery'

const DOCUMENT_CLASSIFY_ENDPOINT = '/document-classify'

type DocumentClassifySearchFields = 'name' | 'parentId'
type DocumentClassifySortFields = 'name' | 'createdAt' | 'updatedAt'

export type ListDocumentClassifyInput = QueryInput<
  DocumentClassifySearchFields,
  DocumentClassifySortFields
>

export type ListDocumentClassifyOutput = ApiListData<DocumentClassify>

export async function listDocumentClassify(
  input?: ListDocumentClassifyInput,
): Promise<ListDocumentClassifyOutput> {
  const response = await axiosInstance.get<ApiListResponse<DocumentClassify>>(
    DOCUMENT_CLASSIFY_ENDPOINT,
    { params: input ? buildQuery(input) : undefined },
  )

  return unwrapList(response.data)
}
