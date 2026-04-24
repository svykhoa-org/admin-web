import { useParams } from 'react-router-dom'
import { CourseForm } from './components/CourseForm'

export const CourseDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  if (!id) return null
  return <CourseForm id={id} />
}
