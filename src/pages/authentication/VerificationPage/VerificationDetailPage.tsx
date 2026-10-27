import type { DoctorVerificationDetail } from '@/models/DoctorVerification'
import { getVerificationDetail } from '@/services/Verification'
import { getApiErrorMessage } from '@/utils/apiResponse'
import { App, Button, Card, Space, Spin, Typography } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { VerificationReview } from './components/VerificationReview'

export const VerificationDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { message } = App.useApp()

  const [data, setData] = useState<DoctorVerificationDetail | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      setData(await getVerificationDetail({ id }))
    } catch (error) {
      void message.error(getApiErrorMessage(error, 'Không thể tải hồ sơ'))
    } finally {
      setLoading(false)
    }
  }, [id, message])

  useEffect(() => {
    void load()
  }, [load])

  if (loading && !data) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <Spin />
      </div>
    )
  }
  if (!data) return null

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card
        title={<Typography.Text strong>Hồ sơ xác minh bác sĩ</Typography.Text>}
        extra={
          <Space>
            <Button onClick={() => navigate(`/users/${data.verification.userId}`)}>
              Xem người dùng
            </Button>
            <Button onClick={() => navigate('/verifications')}>Quay lại</Button>
          </Space>
        }
      >
        <VerificationReview data={data} onChanged={load} />
      </Card>
    </Space>
  )
}
