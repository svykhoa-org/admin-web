import { useParams } from 'react-router-dom'
import { DocumentOrderDetail } from './components/DocumentOrderDetail'

export const DocumentOrderDetailPage = () => {
  const { id } = useParams()

  return <DocumentOrderDetail id={id} />
}
