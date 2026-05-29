import {
  CheckCircleOutlined,
  FileTextOutlined,
  ReadOutlined,
  RiseOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import { Card, Typography } from 'antd'
import type { ReactNode } from 'react'

export interface DashboardSummaryData {
  totalRevenue: number
  totalCompletedOrders: number
  totalUsers: number
  totalDocuments: number
  totalPublishedCourses: number
}

interface DashboardSummaryCardsProps {
  data: DashboardSummaryData | null
  loading: boolean
}

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
})

const numberFormatter = new Intl.NumberFormat('vi-VN')

interface MetricCardProps {
  title: string
  value: string
  icon: ReactNode
  accentColor: string
  helper?: ReactNode
}

function MetricCard({ title, value, icon, accentColor, helper }: MetricCardProps) {
  return (
    <Card
      style={{
        height: '100%',
        width: '100%',
        borderRadius: 12,
        border: '1px solid #f0f0f0',
        borderTop: `3px solid ${accentColor}`,
        boxShadow: '0 6px 18px rgba(15, 23, 42, 0.06)',
      }}
      styles={{ body: { padding: 18 } }}
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <Typography.Text type="secondary">{title}</Typography.Text>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              display: 'grid',
              placeItems: 'center',
              background: `${accentColor}1a`,
              color: accentColor,
            }}
          >
            {icon}
          </div>
        </div>
        <Typography.Title level={3} style={{ margin: 0, lineHeight: 1.1 }}>
          {value}
        </Typography.Title>
        {helper ? <div>{helper}</div> : null}
      </div>
    </Card>
  )
}

export function DashboardSummaryCards({ data, loading }: DashboardSummaryCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <Card key={index} loading style={{ borderRadius: 12 }} />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      <MetricCard
        title="Tổng doanh thu"
        icon={<RiseOutlined />}
        accentColor="#1677ff"
        value={currencyFormatter.format(data?.totalRevenue ?? 0)}
        helper={<Typography.Text type="secondary">Doanh thu trong kỳ đã chọn</Typography.Text>}
      />

      <MetricCard
        title="Tổng đơn hàng"
        icon={<CheckCircleOutlined />}
        accentColor="#52c41a"
        value={numberFormatter.format(data?.totalCompletedOrders ?? 0)}
        helper={<Typography.Text type="secondary">Đơn hàng đã hoàn tất</Typography.Text>}
      />

      <MetricCard
        title="Tổng người dùng"
        icon={<TeamOutlined />}
        accentColor="#1890ff"
        value={numberFormatter.format(data?.totalUsers ?? 0)}
        helper={<Typography.Text type="secondary">Người dùng đã đăng ký</Typography.Text>}
      />

      <MetricCard
        title="Tài liệu đang bán"
        icon={<FileTextOutlined />}
        accentColor="#722ed1"
        value={numberFormatter.format(data?.totalDocuments ?? 0)}
        helper={<Typography.Text type="secondary">Tài liệu đang published</Typography.Text>}
      />

      <MetricCard
        title="Khoá học đang bán"
        icon={<ReadOutlined />}
        accentColor="#f5a623"
        value={numberFormatter.format(data?.totalPublishedCourses ?? 0)}
        helper={<Typography.Text type="secondary">Khoá học đang published</Typography.Text>}
      />
    </div>
  )
}
