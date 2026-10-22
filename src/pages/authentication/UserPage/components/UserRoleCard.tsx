import { useRequest } from '@/hooks'
import { USER_ROLE_LABEL, UserRole, type User } from '@/models/User'
import { updateUserRole } from '@/services/User'
import { isApiResponseError } from '@/utils/apiResponse'
import { App, Card, Select, Space, Typography } from 'antd'

interface Props {
  user: User
  onChanged: () => void
}

// Learner-side roles only: promoting a user to staff is not offered from the UI.
const LEARNER_ROLES = [UserRole.User, UserRole.Instructor]
const roleOptions = LEARNER_ROLES.map(value => ({ label: USER_ROLE_LABEL[value], value }))

// Rendered for user/instructor targets, viewed by a super admin (the role
// endpoint is super-admin only).
export const UserRoleCard = ({ user, onChanged }: Props) => {
  const { message, modal } = App.useApp()
  const roleRequest = useRequest(updateUserRole)

  const confirmRoleChange = (role: UserRole) => {
    if (role === user.role) return
    modal.confirm({
      title: 'Xác nhận đổi vai trò',
      content: `Đổi vai trò của ${user.fullName || user.email} sang "${USER_ROLE_LABEL[role]}"?`,
      okText: 'Đổi vai trò',
      cancelText: 'Hủy',
      width: 500,
      onOk: async () => {
        try {
          await roleRequest.execute({ id: user.id, role })
          void message.success('Đã cập nhật vai trò')
          onChanged()
        } catch (error) {
          void message.error(
            isApiResponseError(error) ? error.message : 'Không thể đổi vai trò. Vui lòng thử lại.',
          )
        }
      },
    })
  }

  return (
    <Card title="Vai trò">
      <Space orientation="vertical" size={8}>
        <Select
          value={user.role}
          options={roleOptions}
          onChange={confirmRoleChange}
          loading={roleRequest.isLoading}
          style={{ minWidth: 200 }}
        />
        <Typography.Text type="secondary">
          Giảng viên có quyền như người dùng và được gán vào khoá học.
        </Typography.Text>
      </Space>
    </Card>
  )
}
