import { RoleStatusSelect, UserStatusSelect } from '@/components/SelectionVariants'
import { useList, useRequest } from '@/hooks'
import { UserRole, UserStatus, type User } from '@/models/User'
import { activeUser, blockUser, listUser } from '@/services/User'
import { isApiResponseError } from '@/utils/apiResponse'
import { formatTimestamp } from '@/utils/time'
import {
  CheckCircleOutlined,
  EllipsisOutlined,
  EyeOutlined,
  PlusOutlined,
  StopOutlined,
} from '@ant-design/icons'
import { App, Button, Card, Dropdown, Input, Space, Table, Tag, Typography } from 'antd'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface ListParams {
  page: number
  pageSize: number
  search?: string
  role?: UserRole
  status?: UserStatus
}

const roleLabelMap: Record<UserRole, string> = {
  [UserRole.Admin]: 'Admin',
  [UserRole.User]: 'User',
}

const resolvePlatform = (user: User) => {
  if (user.googleId) return 'GG'
  if (user.facebookId) return 'FB'
  return 'Web'
}

export const UserTable = () => {
  const navigate = useNavigate()
  const { message, modal } = App.useApp()

  const [searchValue, setSearchValue] = useState('')

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
          ...(currentParams.role
            ? {
                role: { operator: 'eq' as const, value: currentParams.role },
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
      initialParams: { page: 1, pageSize: 10, search: '', role: undefined, status: undefined },
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
      const errorMessage = isApiResponseError(error)
        ? error.message
        : 'Không thể cập nhật trạng thái. Vui lòng thử lại.'
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
      render: (value: string) => <Typography.Text strong>{value}</Typography.Text>,
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
      width: 120,
      render: (value: UserRole) => <Tag>{roleLabelMap[value]}</Tag>,
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
              record.status === UserStatus.Active
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
              <RoleStatusSelect
                value={params.role}
                onChange={value =>
                  setParams(current => ({
                    ...current,
                    role: value,
                    page: 1,
                  }))
                }
              />
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
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate('/users/create')}
              />
            </Space>
          </Space>

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
