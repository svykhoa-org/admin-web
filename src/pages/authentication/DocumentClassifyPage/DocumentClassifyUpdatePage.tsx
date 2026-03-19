import { useParams } from 'react-router-dom'
import { DocumentClassifyForm } from './components/DocumentClassifyForm'

export const DocumentClassifyUpdatePage = () => {
  const { id } = useParams()

  return <DocumentClassifyForm id={id} />
}
