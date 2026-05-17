import { useParams } from 'react-router-dom'
import { CourseCategoryForm } from './components/CourseCategoryForm'

export const CourseCategoryDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  if (!id) return null
  return <CourseCategoryForm id={id} />
}
