import { useParams } from 'react-router-dom'
import { ArticleForm } from './components/ArticleForm'

export const ArticleUpdatePage = () => {
  const { id } = useParams<{ id: string }>()
  return <ArticleForm id={id} />
}
