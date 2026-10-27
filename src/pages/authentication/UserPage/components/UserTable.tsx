import { UserStatusSelect } from '@/components/SelectionVariants'
import { UserAvatar } from '@/components/UserAvatar'
import { useList, useRequest } from '@/hooks'
import {
  USER_ROLE_COLOR,
  USER_ROLE_LABEL,
  USER_VERIFICATION_STATUS,
  UserRole,
  UserStatus,
  UserVerificationStatus,
  isStaffRole,
  type User,
} from '@/models/User'
import { useAuthStore } from '@/store/authStore'
import { activeUser, blockUser, listUser } from '@/services/User'
import { getApiErrorMessage } from '@/utils/apiResponse'
import { formatTimestamp } from '@/utils/time'
import {
  CheckCircleOutlined,
  EllipsisOutlined,
  EyeOutlined,
  PlusOutlined,
  StopOutlined,
} from '@ant-design/icons'
import {
  App,
  Button,
  Card,
  Dropdown,
  Input,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
} from 'antd'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

type AccountTab = 'all' | 'admin' | 'instructor' | 'user'

interface ListParams {
  page: number
  pageSize: number
  search?: string
  tab: AccountTab
  status?: UserStatus
  verification?: UserVerificationStatus
}

const ACCOUNT_TABS: { key: AccountTab; label: string }[] = [
  { key: 'all', label: 'Tất cả' },
  { key: 'admin', label: 'Quản trị' },
  { key: 'instructor', label: 'Giảng viên' },
  { key: 'user', label: 'Người dùng' },
]

// "Quản trị" covers both staff roles.
const TAB_ROLE_FILTER: Record<AccountTab, object> = {
  all: {},
  admin: { role: { operator: 'in' as const, value: [UserRole.SuperAdmin, UserRole.Admin] } },
  instructor: { role: { operator: 'eq' as const, value: UserRole.Instructor } },
  user: { role: { operator: 'eq' as const, value: UserRole.User } },
}

const parseTab = (value: string | null): AccountTab =>
  ACCOUNT_TABS.some(tab => tab.key === value) ? (value as AccountTab) : 'all'

const resolvePlatform = (user: User) => {
  if (user.googleId) return 'GG'
  if (user.facebookId) return 'FB'
  return 'Web'
}

export const UserTable = () => {
  const navigate = useNavigate()
  const { message, modal } = App.useApp()

  const [searchValue, setSearchValue] = useState('')
  const [searchParams, setSearchParams] = useSearchParams()
  const isSuperAdmin = useAuthStore(s => s.user?.role === UserRole.SuperAdmin)

  const {
    items,
    data: listData,
    isLoading: isListLoading,
    params,
    setParams,
  } = useList<User, ListParams>(
    currentParams => {
      return listUser({
        page: currentParams.page,
        pageSize: currentParams.pageSize,
        searcher: {
          ...(currentParams.search
            ? {
                fullName: { operator: 'ilike' as const, value: currentParams.search },
              }
            : {}),
          ...TAB_ROLE_FILTER[currentParams.tab],
          // Verification does not apply to staff, so the filter is ignored there.
          ...(currentParams.verification && currentParams.tab !== 'admin'
            ? {
                verificationStatus: {
                  operator: 'eq' as const,
                  value: currentParams.verification,
                },
              }
            : {}),
          ...(currentParams.status
            ? {
                status: { operator: 'eq' as const, value: currentParams.status },
              }
            : {}),
        },
        sorter: {
          field: 'updatedAt',
          direction: 'desc',
        },
      })
    },
    {
      initialParams: {
        page: 1,
        pageSize: 10,
        search: '',
        tab: parseTab(searchParams.get('tab')),
        status: undefined,
        verification: undefined,
      },
    },
  )

  const blockRequest = useRequest((id: string) => blockUser({ id }))
  const activeRequest = useRequest((id: string) => activeUser({ id }))

  const handleUpdateStatus = async (user: User, status: UserStatus) => {
    try {
      if (status === UserStatus.Blocked) {
        await blockRequest.execute(user.id)
      } else {
        await activeRequest.execute(user.id)
      }

      void message.success(
        status === UserStatus.Blocked
          ? `Đã khóa người dùng ${user.fullName}`
          : `Đã mở khóa người dùng ${user.fullName}`,
      )
      setParams(current => ({ ...current }))
    } catch (error) {
      const errorMessage = getApiErrorMessage(
        error,
        'Không thể cập nhật trạng thái. Vui lòng thử lại.',
      )
      void message.error(errorMessage)
    }
  }

  const openConfirmUpdateStatus = (user: User, status: UserStatus) => {
    const isBlocking = status === UserStatus.Blocked

    modal.confirm({
      title: isBlocking ? 'Xác nhận khóa người dùng' : 'Xác nhận mở khóa người dùng',
      content: isBlocking
        ? `Bạn có chắc chắn muốn khóa người dùng ${user.fullName}?`
        : `Bạn có chắc chắn muốn mở khóa người dùng ${user.fullName}?`,
      okText: isBlocking ? 'Khóa' : 'Mở khóa',
      okButtonProps: isBlocking ? { danger: true } : undefined,
      cancelText: 'Hủy',
      width: 500,
      onOk: () => handleUpdateStatus(user, status),
    })
  }

  const columns: ColumnsType<User> = [
    {
      title: 'Họ tên',
      dataIndex: 'fullName',
      key: 'fullName',
      fixed: 'left',
      render: (value: string, record) => (
        <Space size={8}>
          <UserAvatar fullName={value || record.email} avatar={record.avatar} size={24} />
          <Typography.Link strong onClick={() => navigate(`/users/${record.id}`)}>
            {value}
          </Typography.Link>
        </Space>
      ),
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Vai trò',
      dataIndex: 'role',
      key: 'role',
      width: 130,
      render: (value: UserRole) => (
        <Tag color={USER_ROLE_COLOR[value]}>{USER_ROLE_LABEL[value]}</Tag>
      ),
    },
    {
      title: 'Xác minh',
      dataIndex: 'verificationStatus',
      key: 'verificationStatus',
      width: 130,
      render: (value: UserVerificationStatus | undefined, record) => {
        if (isStaffRole(record.role)) {
          return (
            <Tooltip title="Không áp dụng cho tài khoản quản trị">
              <Typography.Text type="secondary">—</Typography.Text>
            </Tooltip>
          )
        }
        const status = USER_VERIFICATION_STATUS[value ?? UserVerificationStatus.None]
        return <Tag color={status.color}>{status.label}</Tag>
      },
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (value: UserStatus) => (
        <Tag color={value === UserStatus.Active ? 'success' : 'error'}>
          {value === UserStatus.Active ? 'Active' : 'Blocked'}
        </Tag>
      ),
    },
    {
      title: 'Nền tảng',
      key: 'platform',
      width: 120,
      render: (_, record) => <Tag>{resolvePlatform(record)}</Tag>,
    },
    {
      title: 'Cập nhật',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 180,
      render: (value: string | number) => formatTimestamp(value),
    },
    {
      title: '',
      key: 'actions',
      width: 48,
      fixed: 'right',
      render: (_, record) => (
        <Dropdown
          trigger={['click']}
          menu={{
            items: [
              {
                key: 'detail',
                label: 'Xem chi tiết',
                icon: <EyeOutlined />,
              },
              // Only a super admin may block/unblock staff accounts (server-enforced).
              isStaffRole(record.role) && !isSuperAdmin
                ? null
                : record.status === UserStatus.Active
                  ? {
                      key: 'block',
                      label: 'Khóa',
                      icon: <StopOutlined />,
                      danger: true,
                    }
                  : {
                      key: 'unblock',
                      label: 'Mở khóa',
                      icon: <CheckCircleOutlined />,
                    },
            ],
            onClick: ({ key }) => {
              if (key === 'detail') navigate(`/users/${record.id}`)
              if (key === 'block') openConfirmUpdateStatus(record, UserStatus.Blocked)
              if (key === 'unblock') openConfirmUpdateStatus(record, UserStatus.Active)
            },
          }}
        >
          <Button size="small" icon={<EllipsisOutlined />} />
        </Dropdown>
      ),
    },
  ]

  const handleSearch = (value: string) => {
    const normalized = value.trim()
    setParams(current => ({
      ...current,
      search: normalized || undefined,
      page: 1,
    }))
  }

  const handleTabChange = (key: string) => {
    const tab = parseTab(key)
    setSearchParams(tab === 'all' ? {} : { tab }, { replace: true })
    setParams(current => ({ ...current, tab, page: 1 }))
  }

  const handlePaginationChange = (pagination: TablePaginationConfig) => {
    setParams(current => ({
      ...current,
      page: pagination.current ?? current.page,
      pageSize: pagination.pageSize ?? current.pageSize,
    }))
  }

  return (
    <>
      <Card>
        <Space vertical size={16} className="w-full">
          <Space className="w-full justify-between items-center">
            <div>
              <Typography.Title level={3} style={{ marginBottom: 4 }}>
                Danh sách người dùng
              </Typography.Title>
            </div>

            <Space>
              <Input.Search
                allowClear
                placeholder="Tìm theo họ tên"
                value={searchValue}
                onChange={event => setSearchValue(event.target.value)}
                onSearch={handleSearch}
                style={{ maxWidth: 420 }}
              />
              {params.tab !== 'admin' && (
                <Select
                  allowClear
                  placeholder="Lọc theo xác minh"
                  value={params.verification}
                  options={Object.values(UserVerificationStatus).map(value => ({
                    value,
                    label: USER_VERIFICATION_STATUS[value].label,
                  }))}
                  onChange={(value?: UserVerificationStatus) =>
                    setParams(current => ({ ...current, verification: value, page: 1 }))
                  }
                  style={{ minWidth: 170 }}
                />
              )}
              <UserStatusSelect
                value={params.status}
                onChange={value =>
                  setParams(current => ({
                    ...current,
                    status: value,
                    page: 1,
                  }))
                }
              />
              {isSuperAdmin && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => navigate('/users/create')}
                />
              )}
            </Space>
          </Space>

          <Tabs activeKey={params.tab} items={ACCOUNT_TABS} onChange={handleTabChange} />

          <Table<User>
            rowKey="id"
            columns={columns}
            dataSource={items}
            loading={isListLoading || blockRequest.isLoading || activeRequest.isLoading}
            scroll={{ x: 'max-content' }}
            pagination={{
              current: listData?.pagination.page ?? params.page,
              pageSize: listData?.pagination.pageSize ?? params.pageSize,
              total: listData?.pagination.totalItems ?? 0,
              showSizeChanger: true,
              showTotal: total => `Tổng ${total} bản ghi`,
            }}
            onChange={handlePaginationChange}
          />
        </Space>
      </Card>
    </>
  )
}
