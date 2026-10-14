import axiosInstance from '@/lib/axios'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'
import type { TraceDocumentOutput } from './trace'

const DOCUMENT_LICENSE_ENDPOINT = '/document-license'

export interface TraceByCodeInput {
  code: string
}

// Video documents are traced by the code burnt into the player overlay.
export async function traceByCode(input: TraceByCodeInput): Promise<TraceDocumentOutput> {
  const response = await axiosInstance.get<ApiDetailResponse<TraceDocumentOutput>>(
    `${DOCUMENT_LICENSE_ENDPOINT}/by-code/${encodeURIComponent(input.code.trim())}`,
  )

  return unwrapDetail(response.data)
}
