import { useParams } from 'react-router-dom'
import { BulletinForm } from './components/BulletinForm'

export const BulletinUpdatePage = () => {
  const { id } = useParams<{ id: string }>()
  return <BulletinForm id={id} />
}
