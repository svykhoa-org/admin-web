import { DataTable } from '@/components/DataTable/DataTable'
import { CourseSelect, UserSelect } from '@/components/SelectionVariants'
import { useList } from '@/hooks'
import type { Enrollment } from '@/models/Enrollment'
import { EnrollmentStatus } from '@/models/Enrollment'
import { listEnrollment } from '@/services/Enrollment'
import { formatTimestamp } from '@/utils/time'
import { EyeOutlined } from '@ant-design/icons'
import { Avatar, Button, Card, Progress, Select, Space, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useNavigate } from 'react-router-dom'

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
  const navigate = useNavigate()
  const {
    items,
    data: listData,
    isLoading,
    params,
    setParams,
  } = useList<Enrollment, ListParams>(
    currentParams => {
      const searcher: Record<string, { operator: string; value: string }> = {}
      if (currentParams.userId) searcher.userId = { operator: 'eq', value: currentParams.userId }
      if (currentParams.courseId)
        searcher.courseId = { operator: 'eq', value: currentParams.courseId }
      if (currentParams.status) searcher.status = { operator: 'eq', value: currentParams.status }

      return listEnrollment({
        page: currentParams.page,
        pageSize: currentParams.pageSize,
        searcher: Object.keys(searcher).length > 0 ? (searcher as any) : undefined,
        sorter: { field: 'enrolledAt', direction: 'desc' },
      })
    },
    { initialParams: { page: 1, pageSize: 20 } },
  )

  const columns: ColumnsType<Enrollment> = [
    {
      title: 'STT',
      key: 'stt',
      width: 60,
      align: 'center',
      render: (_: unknown, __: Enrollment, index: number) =>
        (params.page - 1) * params.pageSize + index + 1,
    },
    {
      title: 'Người dùng',
      key: 'user',
      render: (_, record) =>
        record.user ? (
          <Space>
            {record.user.avatar && <Avatar src={record.user.avatar} size="small" />}
            <div>
              <div>{record.user.fullName || '-'}</div>
              <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                {record.user.email}
              </Typography.Text>
            </div>
          </Space>
        ) : (
          <Typography.Text code style={{ fontSize: 11 }}>
            {record.userId.slice(0, 8)}...
          </Typography.Text>
        ),
    },
    {
      title: 'Khoá học',
      key: 'course',
      render: (_, record) => {
        const title = record.courseSnapshot?.title as string | undefined
        return title ? (
          <Typography.Text strong>{title}</Typography.Text>
        ) : (
          <Typography.Text code style={{ fontSize: 11 }}>
            {record.courseId.slice(0, 8)}...
          </Typography.Text>
        )
      },
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
        v ? formatTimestamp(v) : <Typography.Text type="secondary">Không giới hạn</Typography.Text>,
    },
    {
      title: '',
      key: 'actions',
      width: 48,
      align: 'center',
      render: (_: unknown, record: Enrollment) => (
        <Button
          size="small"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/enrollments/${record.id}`)}
        />
      ),
    },
  ]

  return (
    <Card>
      <DataTable<Enrollment>
        title="Danh sách đăng ký khoá học"
        columns={columns}
        dataSource={items}
        loading={isLoading}
        extraAction={{
          items: [
            <UserSelect
              key="user"
              placeholder="Lọc theo người dùng"
              value={params.userId}
              onChange={value => setParams(p => ({ ...p, userId: value, page: 1 }))}
            />,
            <CourseSelect
              key="course"
              placeholder="Lọc theo khoá học"
              value={params.courseId}
              onChange={value => setParams(p => ({ ...p, courseId: value, page: 1 }))}
            />,
            <Select
              key="status"
              allowClear
              placeholder="Trạng thái"
              style={{ width: 140 }}
              value={params.status}
              onChange={v => setParams(p => ({ ...p, status: v || undefined, page: 1 }))}
              options={Object.values(EnrollmentStatus).map(s => ({
                label: statusLabels[s],
                value: s,
              }))}
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
