import { Typography } from 'antd'
import { useAuthStore } from '@/store/authStore'

const { Title, Paragraph } = Typography

export default function DashboardPage() {
  const user = useAuthStore(s => s.user)

  return (
    <div>
      <Title level={2}>Dashboard</Title>
      <Paragraph>Chào mừng trở lại, {user?.fullName ?? 'Admin'}!</Paragraph>
    </div>
  )
}
