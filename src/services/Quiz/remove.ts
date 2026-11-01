import axiosInstance from '@/lib/axios'

const QUIZ_ENDPOINT = '/quizzes'

export async function removeQuiz(input: { id: string }): Promise<void> {
  await axiosInstance.delete(`${QUIZ_ENDPOINT}/${input.id}`)
}
