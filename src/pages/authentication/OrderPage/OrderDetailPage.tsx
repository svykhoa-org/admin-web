import { useParams } from 'react-router-dom'
import { OrderDetail } from './components/OrderDetail'

export const OrderDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  return <OrderDetail id={id} />
}
