import { useDetail, useRequest } from '@/hooks'
import { UserRole, UserStatus } from '@/models/User'
import { activeUser, blockUser, getUserDetail } from '@/services/User'
import { App, Avatar, Button, Card, Descriptions, Space, Spin, Tag, Typography } from 'antd'
import { useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

interface Props {
  id?: string
}

const roleLabelMap: Record<UserRole, string> = {
  [UserRole.Admin]: 'Admin',
  [UserRole.User]: 'User',
}

const statusLabelMap: Record<UserStatus, string> = {
  [UserStatus.Active]: 'Active',
  [UserStatus.Blocked]: 'Blocked',
}

const statusColorMap: Record<UserStatus, string> = {
  [UserStatus.Active]: 'success',
  [UserStatus.Blocked]: 'error',
}

const resolvePlatform = (googleId: string | null, facebookId: string | null) => {
  if (googleId) return 'GG'
  if (facebookId) return 'FB'
  return 'Web'
}

export const UserDetail = ({ id }: Props) => {
  const navigate = useNavigate()
  const { message, modal } = App.useApp()
  const fetchUserDetail = useCallback((detailId: string) => getUserDetail({ id: detailId }), [])

  const detailRequest = useDetail(fetchUserDetail)
  const blockRequest = useRequest((userId: string) => blockUser({ id: userId }))
  const activeRequest = useRequest((userId: string) => activeUser({ id: userId }))
  const { execute: executeDetail, data: detailData, isLoading: isDetailLoading } = detailRequest

  useEffect(() => {
    if (!id) return

    void executeDetail(id)
  }, [executeDetail, id])

  useEffect(() => {
    if (detailRequest.error) {
      void message.error('Không thể tải chi tiết người dùng. Vui lòng thử lại.')
    }
  }, [detailRequest.error, message])

  const handleToggleStatus = async () => {
    if (!detailData || !id) return

    try {
      if (detailData.status === UserStatus.Active) {
        await blockRequest.execute(id)
        void message.success(`Đã khóa người dùng ${detailData.fullName}`)
      } else {
        await activeRequest.execute(id)
        void message.success(`Đã mở khóa người dùng ${detailData.fullName}`)
      }

      await executeDetail(id)
    } catch {
      void message.error('Không thể cập nhật trạng thái người dùng. Vui lòng thử lại.')
    }
  }

  const openConfirmToggleStatus = () => {
    if (!detailData) return

    const isBlocking = detailData.status === UserStatus.Active

    modal.confirm({
      title: isBlocking ? 'Xác nhận khóa người dùng' : 'Xác nhận mở khóa người dùng',
      content: isBlocking
        ? `Bạn có chắc chắn muốn khóa người dùng ${detailData.fullName}?`
        : `Bạn có chắc chắn muốn mở khóa người dùng ${detailData.fullName}?`,
      okText: isBlocking ? 'Khóa' : 'Mở khóa',
      okButtonProps: isBlocking ? { danger: true } : undefined,
      cancelText: 'Hủy',
      width: 500,
      onOk: () => handleToggleStatus(),
    })
  }

  return (
    <Card>
      <Space orientation="vertical" size={20} style={{ width: '100%' }}>
        <div>
          <Typography.Title level={3} style={{ marginBottom: 4 }}>
            Chi tiết người dùng
          </Typography.Title>
        </div>

        {detailData && (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Space align="center" size={12}>
              <Avatar size={64} src={detailData.avatar || undefined}>
                {detailData.fullName?.charAt(0).toUpperCase()}
              </Avatar>
              <div>
                <Typography.Title level={4} style={{ margin: 0 }}>
                  {detailData.fullName}
                </Typography.Title>
                <Typography.Text type="secondary">{detailData.email}</Typography.Text>
              </div>
            </Space>

            <Spin spinning={isDetailLoading}>
              <Descriptions bordered column={1} size="middle">
                <Descriptions.Item label="Họ tên">{detailData.fullName}</Descriptions.Item>
                <Descriptions.Item label="Email">{detailData.email}</Descriptions.Item>
                <Descriptions.Item label="Vai trò">
                  {roleLabelMap[detailData.role]}
                </Descriptions.Item>
                <Descriptions.Item label="Trạng thái">
                  <Tag color={statusColorMap[detailData.status]}>
                    {statusLabelMap[detailData.status]}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Nền tảng">
                  {resolvePlatform(detailData.googleId, detailData.facebookId)}
                </Descriptions.Item>
              </Descriptions>
            </Spin>
          </Space>
        )}

        <Space>
          {detailData && (
            <Button
              danger={detailData.status === UserStatus.Active}
              type={detailData.status === UserStatus.Active ? 'default' : 'primary'}
              loading={blockRequest.isLoading || activeRequest.isLoading}
              onClick={openConfirmToggleStatus}
            >
              {detailData.status === UserStatus.Active ? 'Khóa' : 'Mở khóa'}
            </Button>
          )}
          <Button onClick={() => navigate('/users', { replace: true })}>Quay lại</Button>
        </Space>
      </Space>
    </Card>
  )
}
