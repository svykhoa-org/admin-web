import { useParams } from 'react-router-dom'
import { DocumentForm } from './components/DocumentForm'

export const DocumentUpdatePage = () => {
  const { id } = useParams()

  return <DocumentForm id={id} />
}
