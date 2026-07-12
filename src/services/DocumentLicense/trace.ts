import axiosInstance from '@/lib/axios'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

const DOCUMENT_LICENSE_ENDPOINT = '/document-license'

export interface TraceDocumentInput {
  file: File
}

export interface TraceDocumentLicense {
  id: string
  watermarkCode: string | null
  user: { id: string; fullName: string; email: string }
  document: { id: string; title: string }
  orderId: string | null
  createdAt: string
}

export interface TraceDocumentOutput {
  matched: boolean
  via: 'metadata' | 'microtext' | null
  license: TraceDocumentLicense | null
}

export async function traceDocument(input: TraceDocumentInput): Promise<TraceDocumentOutput> {
  const formData = new FormData()
  formData.append('file', input.file)

  const response = await axiosInstance.post<ApiDetailResponse<TraceDocumentOutput>>(
    `${DOCUMENT_LICENSE_ENDPOINT}/trace`,
    formData,
  )

  return unwrapDetail(response.data)
}
