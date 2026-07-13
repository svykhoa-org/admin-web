import { DataTable } from '@/components/DataTable/DataTable'
import { useList } from '@/hooks'
import type { DoctorVerification } from '@/models/DoctorVerification'
import { VerificationStatus } from '@/models/DoctorVerification'
import { listVerification } from '@/services/Verification'
import { formatTimestamp } from '@/utils/time'
import { EyeOutlined } from '@ant-design/icons'
import { Avatar, Button, Card, Select, Space, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useNavigate } from 'react-router-dom'

const statusColors: Record<VerificationStatus, string> = {
  [VerificationStatus.PENDING]: 'gold',
  [VerificationStatus.VERIFIED]: 'green',
  [VerificationStatus.REJECTED]: 'red',
}

const statusLabels: Record<VerificationStatus, string> = {
  [VerificationStatus.PENDING]: 'Chờ duyệt',
  [VerificationStatus.VERIFIED]: 'Đã xác minh',
  [VerificationStatus.REJECTED]: 'Từ chối',
}

interface ListParams {
  page: number
  pageSize: number
  status?: VerificationStatus
}

export const VerificationTable = () => {
  const navigate = useNavigate()
  const {
    items,
    data: listData,
    isLoading,
    params,
    setParams,
  } = useList<DoctorVerification, ListParams>(
    currentParams => {
      const searcher: Record<string, { operator: string; value: string }> = {}
      if (currentParams.status) searcher.status = { operator: 'eq', value: currentParams.status }

      return listVerification({
        page: currentParams.page,
        pageSize: currentParams.pageSize,
        searcher: Object.keys(searcher).length > 0 ? (searcher as any) : undefined,
        sorter: { field: 'createdAt', direction: 'desc' },
      })
    },
    { initialParams: { page: 1, pageSize: 20 } },
  )

  const columns: ColumnsType<DoctorVerification> = [
    {
      title: 'STT',
      key: 'stt',
      width: 60,
      align: 'center',
      render: (_: unknown, __: DoctorVerification, index: number) =>
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
      title: 'Số giấy phép',
      dataIndex: 'licenseNumber',
      key: 'licenseNumber',
    },
    {
      title: 'Chuyên môn',
      dataIndex: 'scopeOfPractice',
      key: 'scopeOfPractice',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (v: VerificationStatus) => <Tag color={statusColors[v]}>{statusLabels[v]}</Tag>,
    },
    {
      title: 'Ngày nộp',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (v: string) => formatTimestamp(v),
    },
    {
      title: '',
      key: 'actions',
      width: 48,
      align: 'center',
      render: (_: unknown, record: DoctorVerification) => (
        <Button
          size="small"
          icon={<EyeOutlined />}
          onClick={() => navigate(`/verifications/${record.id}`)}
        />
      ),
    },
  ]

  return (
    <Card>
      <DataTable<DoctorVerification>
        title="Hồ sơ xác minh bác sĩ"
        columns={columns}
        dataSource={items}
        loading={isLoading}
        extraAction={{
          items: [
            <Select
              key="status"
              allowClear
              placeholder="Trạng thái"
              style={{ width: 160 }}
              value={params.status}
              onChange={v => setParams(p => ({ ...p, status: v || undefined, page: 1 }))}
              options={Object.values(VerificationStatus).map(s => ({
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
