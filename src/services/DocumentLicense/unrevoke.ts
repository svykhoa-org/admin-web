import axiosInstance from '@/lib/axios'
import type { DocumentLicense } from '@/models/DocumentLicense'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

const DOCUMENT_LICENSE_ENDPOINT = '/document-license'

export interface UnrevokeDocumentLicenseInput {
  id: string
}

export type UnrevokeDocumentLicenseOutput = DocumentLicense

export async function unrevokeDocumentLicense(
  input: UnrevokeDocumentLicenseInput,
): Promise<UnrevokeDocumentLicenseOutput> {
  const response = await axiosInstance.patch<ApiDetailResponse<UnrevokeDocumentLicenseOutput>>(
    `${DOCUMENT_LICENSE_ENDPOINT}/${input.id}/unrevoke`,
  )

  return unwrapDetail(response.data)
}
