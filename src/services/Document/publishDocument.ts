import axiosInstance from '@/lib/axios'
import type { Document } from '@/models/Document'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

const DOCUMENT_ENDPOINT = '/documents'

export async function publishDocument({ id }: { id: string }): Promise<Document> {
  const response = await axiosInstance.patch<ApiDetailResponse<Document>>(
    `${DOCUMENT_ENDPOINT}/${id}/publish`,
  )
  return unwrapDetail(response.data)
}
