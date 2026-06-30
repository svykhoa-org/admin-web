import { DataTable } from '@/components/DataTable/DataTable'
import { ReportStatus, type ForumReport } from '@/models/Forum'
import { listReports, updateReportStatus } from '@/services/Forum'
import { isApiResponseError } from '@/utils/apiResponse'
import { App, Card, Select, Space } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useCallback, useEffect, useState } from 'react'

const STATUS_OPTIONS = [
  { label: 'Chờ xử lý', value: ReportStatus.Open },
  { label: 'Đã giải quyết', value: ReportStatus.Resolved },
  { label: 'Bỏ qua', value: ReportStatus.Dismissed },
]

export const ReportTable = () => {
  const { message } = App.useApp()
  const [items, setItems] = useState<ForumReport[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [filterStatus, setFilterStatus] = useState<ReportStatus | undefined>(ReportStatus.Open)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const PAGE_SIZE = 20

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await listReports({ status: filterStatus, page, limit: PAGE_SIZE })
      setItems(result.items)
      setTotal(result.total)
    } catch {
      void message.error('Không thể tải danh sách báo cáo')
    } finally {
      setIsLoading(false)
    }
  }, [message, filterStatus, page])

  useEffect(() => {
    void load()
  }, [load])

  const handleStatusChange = async (id: string, status: ReportStatus) => {
    try {
      await updateReportStatus(id, status)
      void message.success('Đã cập nhật trạng thái')
      void load()
    } catch (error) {
      void message.error(isApiResponseError(error) ? error.message : 'Có lỗi xảy ra')
    }
  }

  const columns: ColumnsType<ForumReport> = [
    {
      title: 'Người báo cáo',
      key: 'reporter',
      width: 160,
      render: (_, r) => r.reporter?.fullName ?? r.reporterId,
    },
    { title: 'Loại', dataIndex: 'targetType', key: 'targetType', width: 90 },
    { title: 'Lý do', dataIndex: 'reason', key: 'reason' },
    {
      title: 'Trạng thái',
      key: 'status',
      width: 160,
      render: (_, r) => (
        <Select
          size="small"
          value={r.status}
          style={{ width: 140 }}
          options={STATUS_OPTIONS}
          onChange={val => handleStatusChange(r.id, val)}
        />
      ),
    },
    {
      title: 'Ngày tạo',
      key: 'createdAt',
      width: 130,
      render: (_, r) => new Date(r.createdAt).toLocaleDateString('vi-VN'),
    },
  ]

  return (
    <Card>
      <Space className="mb-4">
        <Select
          placeholder="Lọc theo trạng thái"
          allowClear
          style={{ width: 160 }}
          value={filterStatus}
          options={[
            { label: 'Tất cả', value: undefined as unknown as ReportStatus },
            ...STATUS_OPTIONS,
          ]}
          onChange={val => {
            setFilterStatus(val)
            setPage(1)
          }}
        />
      </Space>
      <DataTable<ForumReport>
        title="Báo cáo vi phạm"
        columns={columns}
        dataSource={items}
        loading={isLoading}
        paginationAction={{
          showPagination: true,
          currentPage: page,
          pageSize: PAGE_SIZE,
          totalRecords: total,
          onPageChange: p => setPage(p),
        }}
      />
    </Card>
  )
}
