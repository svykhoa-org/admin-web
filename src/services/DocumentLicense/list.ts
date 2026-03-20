import axiosInstance from '@/lib/axios'
import type { DocumentLicense } from '@/models/DocumentLicense'
import type { ApiListData, ApiListResponse } from '@/types/api'
import { unwrapList } from '@/utils/apiResponse'
import { buildQuery, type QueryInput } from '@/utils/buildQuery'

const DOCUMENT_LICENSE_ENDPOINT = '/document-license'

type DocumentLicenseSearchFields = 'status' | 'userId' | 'documentId' | 'documentOrderId'
type DocumentLicenseSortFields = 'createdAt' | 'updatedAt' | 'revokedAt'

export type ListDocumentLicenseInput = QueryInput<
  DocumentLicenseSearchFields,
  DocumentLicenseSortFields
>
export type ListDocumentLicenseOutput = ApiListData<DocumentLicense>

export async function listDocumentLicense(
  input?: ListDocumentLicenseInput,
): Promise<ListDocumentLicenseOutput> {
  const response = await axiosInstance.get<ApiListResponse<DocumentLicense>>(
    DOCUMENT_LICENSE_ENDPOINT,
    {
      params: input ? buildQuery(input) : undefined,
    },
  )

  return unwrapList(response.data)
}
