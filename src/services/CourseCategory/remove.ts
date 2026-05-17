import axiosInstance from '@/lib/axios'

const ENDPOINT = '/course-categories'

export async function removeCourseCategory(input: { id: string }): Promise<void> {
  await axiosInstance.delete(`${ENDPOINT}/${input.id}`)
}
