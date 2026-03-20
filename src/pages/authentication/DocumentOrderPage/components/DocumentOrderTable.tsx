import { useList } from '@/hooks'
import {
  DocumentPaymentMethod,
  DocumentOrderStatus,
  type DocumentOrder,
} from '@/models/DocumentOrder'
import { listDocumentOrder } from '@/services/DocumentOrder'
import { formatTimestamp } from '@/utils/time'
import { EllipsisOutlined, EyeOutlined } from '@ant-design/icons'
import { Button, Card, Dropdown, Input, Select, Space, Table, Tag, Typography } from 'antd'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface ListParams {
  page: number
  pageSize: number
  search?: string
  status?: DocumentOrderStatus
  paymentMethod?: DocumentPaymentMethod
}

const statusColorMap: Record<DocumentOrderStatus, string> = {
  [DocumentOrderStatus.PENDING]: 'processing',
  [DocumentOrderStatus.COMPLETED]: 'success',
  [DocumentOrderStatus.CANCELLED]: 'error',
  [DocumentOrderStatus.REFUNDED]: 'warning',
}

const statusLabelMap: Record<DocumentOrderStatus, string> = {
  [DocumentOrderStatus.PENDING]: 'Chờ xử lý',
  [DocumentOrderStatus.COMPLETED]: 'Hoàn tất',
  [DocumentOrderStatus.CANCELLED]: 'Đã hủy',
  [DocumentOrderStatus.REFUNDED]: 'Hoàn tiền',
}

const paymentMethodLabelMap: Record<DocumentPaymentMethod, string> = {
  [DocumentPaymentMethod.SEPAY]: 'SePay',
}

const statusOptions = Object.values(DocumentOrderStatus).map(status => ({
  label: statusLabelMap[status],
  value: status,
}))

const paymentMethodOptions = (Object.values(DocumentPaymentMethod) as DocumentPaymentMethod[]).map(
  method => ({
    label: paymentMethodLabelMap[method],
    value: method,
  }),
)

export const DocumentOrderTable = () => {
  const navigate = useNavigate()
  const [searchValue, setSearchValue] = useState('')

  const {
    items,
    data: listData,
    isLoading,
    params,
    setParams,
  } = useList<DocumentOrder, ListParams>(
    currentParams => {
      const searcher = {
        ...(currentParams.search
          ? {
              orderCode: { operator: 'ilike' as const, value: currentParams.search },
            }
          : {}),
        ...(currentParams.status
          ? {
              status: { operator: 'eq' as const, value: currentParams.status },
            }
          : {}),
        ...(currentParams.paymentMethod
          ? {
              paymentMethod: { operator: 'eq' as const, value: currentParams.paymentMethod },
            }
          : {}),
      }

      return listDocumentOrder({
        page: currentParams.page,
        pageSize: currentParams.pageSize,
        searcher: Object.keys(searcher).length > 0 ? searcher : undefined,
        sorter: {
          field: 'createdAt',
          direction: 'desc',
        },
      })
    },
    {
      initialParams: {
        page: 1,
        pageSize: 10,
        search: '',
        status: undefined,
        paymentMethod: undefined,
      },
    },
  )

  const columns: ColumnsType<DocumentOrder> = [
    {
      title: 'Mã đơn',
      dataIndex: 'orderCode',
      key: 'orderCode',
      fixed: 'left',
      render: (value: string) => <Typography.Text strong>{value}</Typography.Text>,
    },
    {
      title: 'Khách hàng',
      key: 'user',
      render: (_, record) => record.user?.email || record.userId,
    },
    {
      title: 'Tài liệu',
      key: 'document',
      render: (_, record) => record.document?.title || record.documentId,
    },
    {
      title: 'Thanh toán',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      width: 130,
      render: (value: DocumentPaymentMethod) => <Tag>{paymentMethodLabelMap[value]}</Tag>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (value: DocumentOrderStatus) => (
        <Tag color={statusColorMap[value]}>{statusLabelMap[value]}</Tag>
      ),
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 150,
      align: 'right',
      render: (value: number, record) => `${value.toLocaleString('vi-VN')} ${record.currency}`,
    },
    {
      title: 'Thanh toán lúc',
      dataIndex: 'paidAt',
      key: 'paidAt',
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
            ],
            onClick: ({ key }) => {
              if (key === 'detail') navigate(`/document-orders/${record.id}`)
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
              Danh sách đơn hàng tài liệu
            </Typography.Title>
          </div>

          <Space>
            <Input.Search
              allowClear
              placeholder="Tìm theo mã đơn"
              value={searchValue}
              onChange={event => setSearchValue(event.target.value)}
              onSearch={handleSearch}
              style={{ maxWidth: 280 }}
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
            <Select
              allowClear
              showSearch
              style={{ width: 180 }}
              placeholder="Phương thức"
              options={paymentMethodOptions}
              value={params.paymentMethod}
              onChange={value =>
                setParams(current => ({ ...current, paymentMethod: value ?? undefined, page: 1 }))
              }
            />
          </Space>
        </Space>

        <Table<DocumentOrder>
          rowKey="id"
          columns={columns}
          dataSource={items}
          loading={isLoading}
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
