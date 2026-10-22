import { UserAvatar } from '@/components/UserAvatar'
import { useCan, useDetail, useRequest } from '@/hooks'
import { Permission } from '@/models/Permission'
import {
  USER_ROLE_COLOR,
  USER_ROLE_LABEL,
  UserRole,
  UserStatus,
  USER_VERIFICATION_STATUS,
  isStaffRole,
} from '@/models/User'
import { activeUser, blockUser, getUserDetail } from '@/services/User'
import { useAuthStore } from '@/store/authStore'
import { isApiResponseError } from '@/utils/apiResponse'
import { formatTimestamp } from '@/utils/time'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { App, Button, Card, Descriptions, Space, Spin, Tag, Typography } from 'antd'
import { useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserPermissionCard } from './UserPermissionCard'
import { UserRoleCard } from './UserRoleCard'
import { UserVerificationCard } from './UserVerificationCard'

interface Props {
  id?: string
}

const statusLabelMap: Record<UserStatus, string> = {
  [UserStatus.Active]: 'Đang hoạt động',
  [UserStatus.Blocked]: 'Đã khóa',
}

const statusColorMap: Record<UserStatus, string> = {
  [UserStatus.Active]: 'success',
  [UserStatus.Blocked]: 'error',
}

const resolvePlatform = (googleId: string | null, facebookId: string | null) => {
  if (googleId) return 'Google'
  if (facebookId) return 'Facebook'
  return 'Email & mật khẩu'
}

export const UserDetail = ({ id }: Props) => {
  const navigate = useNavigate()
  const { message, modal } = App.useApp()
  const viewer = useAuthStore(s => s.user)
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

  const isViewerSuperAdmin = viewer?.role === UserRole.SuperAdmin
  const canReviewVerification = useCan(Permission.Verification)
  const isSelf = !!detailData && detailData.id === viewer?.id
  // Mirrors the server rules: nobody changes themselves; staff accounts are
  // managed by super admins only.
  const canToggleStatus =
    !!detailData && !isSelf && (isViewerSuperAdmin || !isStaffRole(detailData.role))

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
    } catch (error) {
      void message.error(
        isApiResponseError(error)
          ? error.message
          : 'Không thể cập nhật trạng thái người dùng. Vui lòng thử lại.',
      )
    }
  }

  const openConfirmToggleStatus = () => {
    if (!detailData) return

    const isBlocking = detailData.status === UserStatus.Active

    modal.confirm({
      title: isBlocking ? 'Xác nhận khóa người dùng' : 'Xác nhận mở khóa người dùng',
      content: isBlocking
        ? `Bạn có chắc chắn muốn khóa người dùng ${detailData.fullName}? Phiên đăng nhập hiện tại sẽ bị thu hồi.`
        : `Bạn có chắc chắn muốn mở khóa người dùng ${detailData.fullName}?`,
      okText: isBlocking ? 'Khóa' : 'Mở khóa',
      okButtonProps: isBlocking ? { danger: true } : undefined,
      cancelText: 'Hủy',
      width: 500,
      onOk: () => handleToggleStatus(),
    })
  }

  const verification = detailData?.verificationStatus
    ? USER_VERIFICATION_STATUS[detailData.verificationStatus]
    : undefined

  return (
    <Space orientation="vertical" size={16} className="w-full">
      <div>
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate('/users', { replace: true })}
        >
          Danh sách người dùng
        </Button>
      </div>

      <Spin spinning={isDetailLoading}>
        {detailData && (
          <Space orientation="vertical" size={16} className="w-full">
            <Card>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex min-w-0 items-center gap-4">
                  <UserAvatar
                    fullName={detailData.fullName || detailData.email}
                    avatar={detailData.avatar}
                    size={80}
                  />
                  <div className="min-w-0">
                    <Typography.Title level={3} style={{ margin: 0 }}>
                      {detailData.fullName}
                    </Typography.Title>
                    <Typography.Text type="secondary" copyable>
                      {detailData.email}
                    </Typography.Text>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Tag color={USER_ROLE_COLOR[detailData.role]}>
                        {USER_ROLE_LABEL[detailData.role]}
                      </Tag>
                      <Tag color={statusColorMap[detailData.status]}>
                        {statusLabelMap[detailData.status]}
                      </Tag>
                      {isSelf && <Tag>Tài khoản của bạn</Tag>}
                    </div>
                  </div>
                </div>

                {canToggleStatus && (
                  <Button
                    danger={detailData.status === UserStatus.Active}
                    type={detailData.status === UserStatus.Active ? 'default' : 'primary'}
                    loading={blockRequest.isLoading || activeRequest.isLoading}
                    onClick={openConfirmToggleStatus}
                  >
                    {detailData.status === UserStatus.Active ? 'Khóa tài khoản' : 'Mở khóa'}
                  </Button>
                )}
              </div>
            </Card>

            <Card title="Thông tin tài khoản">
              <Descriptions column={{ xs: 1, md: 2 }} size="middle">
                <Descriptions.Item label="Đăng nhập bằng">
                  {resolvePlatform(detailData.googleId, detailData.facebookId)}
                </Descriptions.Item>
                <Descriptions.Item label="Xác minh bác sĩ">
                  {isStaffRole(detailData.role) ? (
                    <Typography.Text type="secondary">Không áp dụng</Typography.Text>
                  ) : verification ? (
                    <Tag color={verification.color}>{verification.label}</Tag>
                  ) : (
                    '—'
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Xác thực 2 lớp">
                  {detailData.isTwoFactorEnabled ? 'Đã bật' : 'Chưa bật'}
                </Descriptions.Item>
                <Descriptions.Item label="Ngày tạo">
                  {formatTimestamp(detailData.createdAt)}
                </Descriptions.Item>
                <Descriptions.Item label="Cập nhật lần cuối">
                  {formatTimestamp(detailData.updatedAt)}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card title="Giới thiệu">
              <Descriptions column={1} size="middle">
                <Descriptions.Item label="Chức danh">
                  {detailData.headline || (
                    <Typography.Text type="secondary">Chưa cập nhật</Typography.Text>
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Giới thiệu">
                  {detailData.bio ? (
                    <Typography.Paragraph style={{ whiteSpace: 'pre-line', marginBottom: 0 }}>
                      {detailData.bio}
                    </Typography.Paragraph>
                  ) : (
                    <Typography.Text type="secondary">Chưa cập nhật</Typography.Text>
                  )}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {canReviewVerification && !isStaffRole(detailData.role) && (
              <UserVerificationCard
                userId={detailData.id}
                onChanged={() => id && void executeDetail(id)}
              />
            )}

            {isViewerSuperAdmin && detailData.role === UserRole.Admin && (
              <UserPermissionCard user={detailData} />
            )}

            {isViewerSuperAdmin && !isStaffRole(detailData.role) && (
              <UserRoleCard user={detailData} onChanged={() => id && void executeDetail(id)} />
            )}
          </Space>
        )}
      </Spin>
    </Space>
  )
}
