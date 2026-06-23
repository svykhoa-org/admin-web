import axiosInstance from '@/lib/axios'

const VIDEO_ENDPOINT = '/videos'

export interface DeleteVideoInput {
  id: string
}

export async function deleteVideo(input: DeleteVideoInput): Promise<void> {
  await axiosInstance.delete(`${VIDEO_ENDPOINT}/${input.id}`)
}
