import { useParams } from 'react-router-dom'
import { QuizEditor } from './components/QuizEditor'

export const QuizDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  if (!id) return null
  return <QuizEditor quizId={id} />
}
