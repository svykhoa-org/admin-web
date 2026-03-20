import axiosInstance from '@/lib/axios'
import type { DocumentLicense } from '@/models/DocumentLicense'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

const DOCUMENT_LICENSE_ENDPOINT = '/document-license'

export interface GetDocumentLicenseDetailInput {
  id: string
}

export type GetDocumentLicenseDetailOutput = DocumentLicense

export async function getDocumentLicenseDetail(
  input: GetDocumentLicenseDetailInput,
): Promise<GetDocumentLicenseDetailOutput> {
  const response = await axiosInstance.get<ApiDetailResponse<GetDocumentLicenseDetailOutput>>(
    `${DOCUMENT_LICENSE_ENDPOINT}/${input.id}`,
  )

  return unwrapDetail(response.data)
}
