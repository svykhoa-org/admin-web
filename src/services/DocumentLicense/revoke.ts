import axiosInstance from '@/lib/axios'
import type { DocumentLicense } from '@/models/DocumentLicense'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

const DOCUMENT_LICENSE_ENDPOINT = '/document-license'

export interface RevokeDocumentLicenseInput {
  id: string
  reason: string
}

export type RevokeDocumentLicenseOutput = DocumentLicense

export async function revokeDocumentLicense(
  input: RevokeDocumentLicenseInput,
): Promise<RevokeDocumentLicenseOutput> {
  const response = await axiosInstance.patch<ApiDetailResponse<RevokeDocumentLicenseOutput>>(
    `${DOCUMENT_LICENSE_ENDPOINT}/${input.id}/revoke`,
    { reason: input.reason },
  )

  return unwrapDetail(response.data)
}
