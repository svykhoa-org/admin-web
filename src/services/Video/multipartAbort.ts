import axiosInstance from '@/lib/axios'

const VIDEO_ENDPOINT = '/videos'

export interface MultipartAbortInput {
  videoId: string
  uploadId: string
  key: string
}

export async function multipartAbort(input: MultipartAbortInput): Promise<void> {
  await axiosInstance.post(`${VIDEO_ENDPOINT}/multipart/abort`, input)
}
