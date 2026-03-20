import { useParams } from 'react-router-dom'
import { UserDetail } from './components/UserDetail'

export const UserDetailPage = () => {
  const { id } = useParams()

  return <UserDetail id={id} />
}
