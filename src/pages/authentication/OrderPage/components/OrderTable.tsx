import { DataTable } from '@/components/DataTable/DataTable'
import { UserSelect } from '@/components/SelectionVariants'
import { useList } from '@/hooks'
import type { Order } from '@/models/Order'
import {
  FulfillmentProjection,
  OrderPaymentMethod,
  OrderPaymentProjection,
  OrderProductType,
  OrderStatus,
} from '@/models/Order'
import { listOrder } from '@/services/Order'
import { formatOrderAmount } from '@/utils/formatOrderAmount'
import { formatTimestamp } from '@/utils/time'
import { EyeOutlined } from '@ant-design/icons'
import { Button, Card, Input, Select, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const statusColorMap: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'processing',
  [OrderStatus.COMPLETED]: 'success',
  [OrderStatus.CANCELLED]: 'error',
  [OrderStatus.REFUNDED]: 'warning',
}

const statusLabelMap: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'Chờ xử lý',
  [OrderStatus.COMPLETED]: 'Hoàn tất',
  [OrderStatus.CANCELLED]: 'Đã hủy',
  [OrderStatus.REFUNDED]: 'Hoàn tiền',
}

const productTypeLabelMap: Record<OrderProductType, string> = {
  [OrderProductType.COURSE]: 'Khoá học',
  [OrderProductType.DOCUMENT]: 'Tài liệu',
}

const productTypeColorMap: Record<OrderProductType, string> = {
  [OrderProductType.COURSE]: 'blue',
  [OrderProductType.DOCUMENT]: 'purple',
}

const paymentMethodLabelMap: Record<OrderPaymentMethod, string> = {
  [OrderPaymentMethod.SEPAY]: 'SePay',
  [OrderPaymentMethod.FREE]: 'Miễn phí',
}

interface ListParams {
  page: number
  pageSize: number
  search?: string
  productType?: OrderProductType
  status?: OrderStatus
  userId?: string
}

export const OrderTable = () => {
  const navigate = useNavigate()
  const [searchValue, setSearchValue] = useState('')

  const {
    items,
    data: listData,
    isLoading,
    params,
    setParams,
  } = useList<Order, ListParams>(
    currentParams => {
      const searcher = {
        ...(currentParams.search
          ? { orderCode: { operator: 'ilike' as const, value: currentParams.search } }
          : {}),
        ...(currentParams.productType
          ? { productType: { operator: 'eq' as const, value: currentParams.productType } }
          : {}),
        ...(currentParams.status
          ? { status: { operator: 'eq' as const, value: currentParams.status } }
          : {}),
        ...(currentParams.userId
          ? { userId: { operator: 'eq' as const, value: currentParams.userId } }
          : {}),
      }

      return listOrder({
        page: currentParams.page,
        pageSize: currentParams.pageSize,
        searcher: Object.keys(searcher).length > 0 ? searcher : undefined,
        sorter: { field: 'createdAt', direction: 'desc' },
      })
    },
    { initialParams: { page: 1, pageSize: 20 } },
  )

  const columns: ColumnsType<Order> = [
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
      title: 'Loại sản phẩm',
      dataIndex: 'productType',
      key: 'productType',
      width: 130,
      render: (value: OrderProductType) => (
        <Tag color={productTypeColorMap[value]}>{productTypeLabelMap[value]}</Tag>
      ),
    },
    {
      title: 'Tên sản phẩm',
      dataIndex: 'productName',
      key: 'productName',
    },
    {
      title: 'Thanh toán',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      width: 120,
      render: (value: OrderPaymentMethod) => <Tag>{paymentMethodLabelMap[value]}</Tag>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (value: OrderStatus) => (
        <Tag color={statusColorMap[value]}>{statusLabelMap[value]}</Tag>
      ),
    },
    {
      title: 'Payment domain',
      key: 'paymentDomain',
      width: 170,
      render: (_, record) =>
        record.paymentStatus ? (
          <div className="flex flex-col gap-1">
            <Tag
              color={
                record.paymentStatus === OrderPaymentProjection.PAID ? 'success' : 'processing'
              }
            >
              {record.paymentStatus}
            </Tag>
            {record.fulfillmentStatus && (
              <Tag
                color={
                  record.fulfillmentStatus === FulfillmentProjection.FULFILLED
                    ? 'success'
                    : 'processing'
                }
              >
                {record.fulfillmentStatus}
              </Tag>
            )}
          </div>
        ) : (
          <Typography.Text type="secondary">Legacy</Typography.Text>
        ),
    },
    {
      title: 'Tổng tiền',
      key: 'totalAmount',
      width: 160,
      align: 'right',
      render: (_, record) =>
        `${formatOrderAmount(record.totalMinor, record.totalAmount)} ${record.currency}`,
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
        <Button
          size="small"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/orders/${record.id}`)}
        />
      ),
    },
  ]

  const handleSearch = (value: string) => {
    const normalized = value.trim()
    setParams(current => ({ ...current, search: normalized || undefined, page: 1 }))
  }

  return (
    <Card>
      <DataTable<Order>
        title="Danh sách đơn hàng"
        columns={columns}
        dataSource={items}
        loading={isLoading}
        extraAction={{
          items: [
            <Input.Search
              key="search"
              allowClear
              placeholder="Tìm theo mã đơn"
              value={searchValue}
              onChange={event => setSearchValue(event.target.value)}
              onSearch={handleSearch}
              style={{ maxWidth: 280 }}
            />,
            <Select
              key="productType"
              allowClear
              placeholder="Loại sản phẩm"
              style={{ width: 160 }}
              value={params.productType}
              onChange={value =>
                setParams(current => ({ ...current, productType: value ?? undefined, page: 1 }))
              }
              options={Object.values(OrderProductType).map(t => ({
                label: productTypeLabelMap[t],
                value: t,
              }))}
            />,
            <Select
              key="status"
              allowClear
              placeholder="Trạng thái"
              style={{ width: 160 }}
              value={params.status}
              onChange={value =>
                setParams(current => ({ ...current, status: value ?? undefined, page: 1 }))
              }
              options={Object.values(OrderStatus).map(s => ({
                label: statusLabelMap[s],
                value: s,
              }))}
            />,
            <UserSelect
              key="user"
              placeholder="Lọc theo người dùng"
              value={params.userId}
              onChange={value => setParams(current => ({ ...current, userId: value, page: 1 }))}
            />,
          ],
        }}
        paginationAction={{
          showPagination: true,
          currentPage: listData?.pagination.page ?? params.page,
          pageSize: listData?.pagination.pageSize ?? params.pageSize,
          totalRecords: listData?.pagination.totalItems ?? 0,
          showSizeChanger: true,
          pageSizeOptions: [20, 50, 100],
          onPageChange(page, pageSize) {
            setParams(p => ({ ...p, page, pageSize }))
          },
        }}
      />
    </Card>
  )
}
