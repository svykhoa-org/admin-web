import axiosInstance from '@/lib/axios'
import type { FileResource } from '@/models/FileResource'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

const DOCUMENT_UPLOAD_ENDPOINT = '/resources/upload'

export interface UploadResourceInput {
  file: File
}

export type UploadResourceOutput = FileResource

type UploadResourceRawOutput = UploadResourceOutput & {
  filename?: string | null
  mimetype?: string | null
  fileName?: string | null
  mimeType?: string | null
  url?: string | null
}

export async function uploadResource(input: UploadResourceInput): Promise<UploadResourceOutput> {
  const formData = new FormData()
  formData.append('file', input.file)

  const response = await axiosInstance.post<ApiDetailResponse<UploadResourceRawOutput>>(
    DOCUMENT_UPLOAD_ENDPOINT,
    formData,
  )

  const rawResource = unwrapDetail(response.data)

  return {
    ...rawResource,
    fileName: rawResource.fileName ?? rawResource.filename ?? undefined,
    mimeType: rawResource.mimeType ?? rawResource.mimetype ?? undefined,
    url: rawResource.url ?? undefined,
  }
}
