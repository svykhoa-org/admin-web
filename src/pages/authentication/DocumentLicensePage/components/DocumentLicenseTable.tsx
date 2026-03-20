import { DocumentSelect, UserSelect } from '@/components/SelectionVariants'
import { useList, useRequest } from '@/hooks'
import { DocumentLicenseStatus, type DocumentLicense } from '@/models/DocumentLicense'
import {
  listDocumentLicense,
  revokeDocumentLicense,
  unrevokeDocumentLicense,
} from '@/services/DocumentLicense'
import { isApiResponseError } from '@/utils/apiResponse'
import { formatTimestamp } from '@/utils/time'
import { CheckCircleOutlined, EllipsisOutlined, EyeOutlined, StopOutlined } from '@ant-design/icons'
import { App, Button, Card, Dropdown, Input, Select, Space, Table, Tag, Typography } from 'antd'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface ListParams {
  page: number
  pageSize: number
  search?: string
  userId?: string
  documentId?: string
  status?: DocumentLicenseStatus
}

const statusColorMap: Record<DocumentLicenseStatus, string> = {
  [DocumentLicenseStatus.ACTIVE]: 'success',
  [DocumentLicenseStatus.REVOKED]: 'error',
}

const statusLabelMap: Record<DocumentLicenseStatus, string> = {
  [DocumentLicenseStatus.ACTIVE]: 'Đang hiệu lực',
  [DocumentLicenseStatus.REVOKED]: 'Đã thu hồi',
}

const statusOptions = Object.values(DocumentLicenseStatus).map(status => ({
  label: statusLabelMap[status],
  value: status,
}))

export const DocumentLicenseTable = () => {
  const navigate = useNavigate()
  const { message, modal } = App.useApp()
  const [searchValue, setSearchValue] = useState('')

  const {
    items,
    data: listData,
    isLoading,
    params,
    setParams,
  } = useList<DocumentLicense, ListParams>(
    currentParams => {
      const searcher = {
        ...(currentParams.search
          ? {
              documentOrderId: { operator: 'ilike' as const, value: currentParams.search },
            }
          : {}),
        ...(currentParams.userId
          ? {
              userId: { operator: 'eq' as const, value: currentParams.userId },
            }
          : {}),
        ...(currentParams.documentId
          ? {
              documentId: { operator: 'eq' as const, value: currentParams.documentId },
            }
          : {}),
        ...(currentParams.status
          ? {
              status: { operator: 'eq' as const, value: currentParams.status },
            }
          : {}),
      }

      return listDocumentLicense({
        page: currentParams.page,
        pageSize: currentParams.pageSize,
        searcher: Object.keys(searcher).length > 0 ? searcher : undefined,
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
        userId: undefined,
        documentId: undefined,
        status: undefined,
      },
    },
  )

  const revokeRequest = useRequest((id: string, reason: string) =>
    revokeDocumentLicense({ id, reason }),
  )
  const unrevokeRequest = useRequest((id: string) => unrevokeDocumentLicense({ id }))

  const handleRevoke = async (license: DocumentLicense, reason: string) => {
    try {
      await revokeRequest.execute(license.id, reason)
      void message.success('Thu hồi license thành công')
      setParams(current => ({ ...current }))
    } catch (error) {
      const errorMessage = isApiResponseError(error)
        ? error.message
        : 'Không thể thu hồi license. Vui lòng thử lại.'
      void message.error(errorMessage)
    }
  }

  const handleUnrevoke = async (license: DocumentLicense) => {
    try {
      await unrevokeRequest.execute(license.id)
      void message.success('Hủy thu hồi license thành công')
      setParams(current => ({ ...current }))
    } catch (error) {
      const errorMessage = isApiResponseError(error)
        ? error.message
        : 'Không thể hủy thu hồi license. Vui lòng thử lại.'
      void message.error(errorMessage)
    }
  }

  const openRevokeModal = (license: DocumentLicense) => {
    let reasonValue = ''

    modal.confirm({
      title: 'Thu hồi license',
      content: (
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <Typography.Text>Nhập lý do thu hồi license:</Typography.Text>
          <Input.TextArea
            rows={4}
            placeholder="Ví dụ: Vi phạm điều khoản sử dụng"
            onChange={event => {
              reasonValue = event.target.value
            }}
          />
        </Space>
      ),
      okText: 'Thu hồi',
      okButtonProps: { danger: true },
      cancelText: 'Hủy',
      width: 560,
      onOk: async () => {
        const reason = reasonValue.trim()
        if (!reason) {
          void message.error('Vui lòng nhập lý do thu hồi')
          return Promise.reject(new Error('Reason is required'))
        }
        await handleRevoke(license, reason)
      },
    })
  }

  const columns: ColumnsType<DocumentLicense> = [
    {
      title: 'Khách hàng',
      key: 'user',
      fixed: 'left',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{record.user?.fullName || '-'}</Typography.Text>
          <Typography.Text type="secondary">{record.user?.email || record.userId}</Typography.Text>
        </Space>
      ),
    },
    {
      title: 'Tài liệu',
      key: 'document',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Typography.Text>{record.document?.title || record.documentId}</Typography.Text>
          {record.document?.slug && (
            <Typography.Text type="secondary">{record.document.slug}</Typography.Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Order ID',
      dataIndex: 'documentOrderId',
      key: 'documentOrderId',
      width: 160,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (value: DocumentLicenseStatus) => (
        <Tag color={statusColorMap[value]}>{statusLabelMap[value]}</Tag>
      ),
    },
    {
      title: 'Thu hồi lúc',
      dataIndex: 'revokedAt',
      key: 'revokedAt',
      width: 180,
      render: (value: number | null) =>
        value ? formatTimestamp(value) : <Typography.Text type="secondary">-</Typography.Text>,
    },
    {
      title: 'Tạo lúc',
      dataIndex: 'createdAt',
      key: 'createdAt',
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
              ...(record.status === DocumentLicenseStatus.ACTIVE
                ? [
                    {
                      key: 'revoke',
                      label: 'Thu hồi',
                      icon: <StopOutlined />,
                      danger: true,
                    },
                  ]
                : [
                    {
                      key: 'unrevoke',
                      label: 'Hủy thu hồi',
                      icon: <CheckCircleOutlined />,
                    },
                  ]),
            ],
            onClick: ({ key }) => {
              if (key === 'detail') navigate(`/document-licenses/${record.id}`)
              if (key === 'revoke') openRevokeModal(record)
              if (key === 'unrevoke') void handleUnrevoke(record)
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
    <Card>
      <Space vertical size={16} className="w-full">
        <Space className="w-full justify-between items-center">
          <div>
            <Typography.Title level={3} style={{ marginBottom: 4 }}>
              Danh sách license tài liệu
            </Typography.Title>
          </div>

          <Space>
            <Input.Search
              allowClear
              placeholder="Tìm theo Order ID"
              value={searchValue}
              onChange={event => setSearchValue(event.target.value)}
              onSearch={handleSearch}
              style={{ maxWidth: 260 }}
            />
            <UserSelect
              value={params.userId}
              onChange={value => setParams(current => ({ ...current, userId: value, page: 1 }))}
              placeholder="Lọc theo người dùng"
            />
            <DocumentSelect
              value={params.documentId}
              onChange={value => setParams(current => ({ ...current, documentId: value, page: 1 }))}
              placeholder="Lọc theo tài liệu"
            />
            <Select
              allowClear
              showSearch
              style={{ width: 180 }}
              placeholder="Lọc trạng thái"
              options={statusOptions}
              value={params.status}
              onChange={value =>
                setParams(current => ({ ...current, status: value ?? undefined, page: 1 }))
              }
            />
          </Space>
        </Space>

        <Table<DocumentLicense>
          rowKey="id"
          columns={columns}
          dataSource={items}
          loading={isLoading || revokeRequest.isLoading || unrevokeRequest.isLoading}
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
  )
}
