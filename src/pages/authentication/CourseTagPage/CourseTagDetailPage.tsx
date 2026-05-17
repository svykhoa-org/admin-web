import { useParams } from 'react-router-dom'
import { CourseTagForm } from './components/CourseTagForm'
export const CourseTagDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  if (!id) return null
  return <CourseTagForm id={id} />
}
