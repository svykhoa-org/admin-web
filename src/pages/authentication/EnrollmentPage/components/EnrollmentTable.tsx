import { useList } from '@/hooks'
import { Enrollment, EnrollmentStatus } from '@/models/Enrollment'
import { listEnrollment } from '@/services/Enrollment'
import { formatTimestamp } from '@/utils/time'
import { Card, Input, Progress, Select, Space, Table, Tag, Typography } from 'antd'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import { useState } from 'react'

const statusColors: Record<EnrollmentStatus, string> = {
  [EnrollmentStatus.ACTIVE]: 'green',
  [EnrollmentStatus.COMPLETED]: 'blue',
  [EnrollmentStatus.EXPIRED]: 'red',
  [EnrollmentStatus.REFUNDED]: 'orange',
}

const statusLabels: Record<EnrollmentStatus, string> = {
  [EnrollmentStatus.ACTIVE]: 'Đang học',
  [EnrollmentStatus.COMPLETED]: 'Hoàn thành',
  [EnrollmentStatus.EXPIRED]: 'Hết hạn',
  [EnrollmentStatus.REFUNDED]: 'Đã hoàn tiền',
}

interface ListParams {
  page: number
  pageSize: number
  userId?: string
  courseId?: string
  status?: EnrollmentStatus
}

export const EnrollmentTable = () => {
  const [courseIdFilter, setCourseIdFilter] = useState<string>('')
  const [userIdFilter, setUserIdFilter] = useState<string>('')

  const {
    items,
    data: listData,
    isLoading,
    params,
    setParams,
  } = useList<Enrollment, ListParams>(
    currentParams => {
      const searcher: Record<string, { operator: string; value: string }> = {}
      if (currentParams.userId) {
        searcher.userId = { operator: 'eq', value: currentParams.userId }
      }
      if (currentParams.courseId) {
        searcher.courseId = { operator: 'eq', value: currentParams.courseId }
      }
      if (currentParams.status) {
        searcher.status = { operator: 'eq', value: currentParams.status }
      }

      return listEnrollment({
        page: currentParams.page,
        pageSize: currentParams.pageSize,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        searcher: Object.keys(searcher).length > 0 ? (searcher as any) : undefined,
        sorter: { field: 'enrolledAt', direction: 'desc' },
      })
    },
    { initialParams: { page: 1, pageSize: 20 } },
  )

  const columns: ColumnsType<Enrollment> = [
    {
      title: 'User ID',
      dataIndex: 'userId',
      key: 'userId',
      width: 180,
      render: (v: string) => (
        <Typography.Text code style={{ fontSize: 11 }}>
          {v.slice(0, 8)}...
        </Typography.Text>
      ),
    },
    {
      title: 'Course ID',
      dataIndex: 'courseId',
      key: 'courseId',
      width: 180,
      render: (v: string) => (
        <Typography.Text code style={{ fontSize: 11 }}>
          {v.slice(0, 8)}...
        </Typography.Text>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (v: EnrollmentStatus) => <Tag color={statusColors[v]}>{statusLabels[v]}</Tag>,
    },
    {
      title: 'Tiến độ',
      dataIndex: 'progress',
      key: 'progress',
      width: 120,
      render: (v: number) => <Progress percent={v} size="small" />,
    },
    {
      title: 'Giá đã trả',
      dataIndex: 'pricePaid',
      key: 'pricePaid',
      width: 130,
      align: 'right',
      render: (v: number) => v.toLocaleString('vi-VN'),
    },
    {
      title: 'Ngày đăng ký',
      dataIndex: 'enrolledAt',
      key: 'enrolledAt',
      width: 160,
      render: (v: string) => formatTimestamp(v),
    },
    {
      title: 'Hết hạn',
      dataIndex: 'expireAt',
      key: 'expireAt',
      width: 160,
      render: (v?: string | null) =>
        v ? (
          formatTimestamp(v)
        ) : (
          <Typography.Text type="secondary">Không giới hạn</Typography.Text>
        ),
    },
  ]

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
              Danh sách Enrollment
            </Typography.Title>
          </div>

          <Space wrap>
            <Input.Search
              placeholder="Lọc theo User ID (UUID)"
              value={userIdFilter}
              onChange={e => setUserIdFilter(e.target.value)}
              onSearch={val =>
                setParams(p => ({ ...p, userId: val || undefined, page: 1 }))
              }
              allowClear
              style={{ width: 280 }}
            />
            <Input.Search
              placeholder="Lọc theo Course ID (UUID)"
              value={courseIdFilter}
              onChange={e => setCourseIdFilter(e.target.value)}
              onSearch={val =>
                setParams(p => ({ ...p, courseId: val || undefined, page: 1 }))
              }
              allowClear
              style={{ width: 280 }}
            />
            <Select
              allowClear
              placeholder="Trạng thái"
              style={{ width: 140 }}
              onChange={v => setParams(p => ({ ...p, status: v || undefined, page: 1 }))}
              options={Object.values(EnrollmentStatus).map(s => ({
                label: statusLabels[s],
                value: s,
              }))}
            />
          </Space>
        </Space>

        <Table<Enrollment>
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
            pageSizeOptions: [20, 50, 100],
            onChange: handlePaginationChange,
            showTotal: total => `Tổng ${total} bản ghi`,
          }}
        />
      </Space>
    </Card>
  )
}
