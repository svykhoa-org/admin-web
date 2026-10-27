import type { DoctorVerificationDetail } from '@/models/DoctorVerification'
import { getVerificationByUser } from '@/services/Verification'
import { getApiErrorMessage } from '@/utils/apiResponse'
import { App, Button, Card, Empty, Spin } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { VerificationReview } from '../../VerificationPage/components/VerificationReview'

interface Props {
  userId: string
  onChanged: () => void
}

// Doctor-verification submission of a learner/instructor, reviewable in place.
// Rendered only for viewers holding the `verification` permission.
export const UserVerificationCard = ({ userId, onChanged }: Props) => {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [data, setData] = useState<DoctorVerificationDetail | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setData(await getVerificationByUser({ userId }))
    } catch (error) {
      void message.error(getApiErrorMessage(error, 'Không thể tải hồ sơ xác minh'))
    } finally {
      setLoading(false)
    }
  }, [message, userId])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <Card
      title="Hồ sơ bác sĩ"
      extra={
        data && (
          <Button type="link" onClick={() => navigate(`/verifications/${data.verification.id}`)}>
            Mở trong trang Xác minh
          </Button>
        )
      }
    >
      <Spin spinning={loading}>
        {data ? (
          <VerificationReview
            data={data}
            showUser={false}
            onChanged={async () => {
              await load()
              onChanged()
            }}
          />
        ) : (
          !loading && (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="Người dùng chưa nộp hồ sơ xác minh"
            />
          )
        )}
      </Spin>
    </Card>
  )
}
