import axiosInstance from '@/lib/axios'
import type { Document } from '@/models/Document'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

const DOCUMENT_ENDPOINT = '/documents'

export async function unpublishDocument({ id }: { id: string }): Promise<Document> {
  const response = await axiosInstance.patch<ApiDetailResponse<Document>>(
    `${DOCUMENT_ENDPOINT}/${id}/unpublish`,
  )
  return unwrapDetail(response.data)
}
