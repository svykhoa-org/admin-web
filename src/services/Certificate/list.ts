import axiosInstance from '@/lib/axios'
import type { Certificate } from '@/models/Certificate'
import type { ApiListData, ApiListResponse } from '@/types/api'
import { unwrapList } from '@/utils/apiResponse'
import { buildQuery, type QueryInput } from '@/utils/buildQuery'

const ENDPOINT = '/certificates'

type CertSearchFields = 'userId' | 'courseId' | 'physicalStatus'
type CertSortFields = 'issuedAt' | 'createdAt'

export type ListCertificateInput = QueryInput<CertSearchFields, CertSortFields>
export type ListCertificateOutput = ApiListData<Certificate>

export async function listCertificate(input?: ListCertificateInput): Promise<ListCertificateOutput> {
  const response = await axiosInstance.get<ApiListResponse<Certificate>>(ENDPOINT, {
    params: input ? buildQuery(input) : undefined,
  })
  return unwrapList(response.data)
}
