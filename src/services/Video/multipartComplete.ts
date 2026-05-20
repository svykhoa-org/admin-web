import axiosInstance from '@/lib/axios'

const VIDEO_ENDPOINT = '/videos'

export interface MultipartCompleteInput {
  videoId: string
  uploadId: string
  key: string
  parts: { partNumber: number; etag: string }[]
}

export async function multipartComplete(input: MultipartCompleteInput): Promise<void> {
  await axiosInstance.post(`${VIDEO_ENDPOINT}/multipart/complete`, input)
}
