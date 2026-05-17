import axiosInstance from '@/lib/axios'

export async function removeCourseTag(input: { id: string }): Promise<void> {
  await axiosInstance.delete(`/course-tags/${input.id}`)
}
