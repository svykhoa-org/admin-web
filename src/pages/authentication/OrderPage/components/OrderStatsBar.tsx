import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  RiseOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { Card, Typography } from 'antd'
import type { ReactNode } from 'react'
import type { OrderStats } from '@/services/Order'

interface OrderStatsBarProps {
  data: OrderStats | null
  loading: boolean
}

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
})

const numberFormatter = new Intl.NumberFormat('vi-VN')

interface StatCardProps {
  title: string
  value: string
  icon: ReactNode
  accentColor: string
}

function StatCard({ title, value, icon, accentColor }: StatCardProps) {
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
      </div>
    </Card>
  )
}

export function OrderStatsBar({ data, loading }: OrderStatsBarProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index} loading style={{ borderRadius: 12 }} />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Đơn chờ xử lý"
        icon={<ClockCircleOutlined />}
        accentColor="#ff4d4f"
        value={numberFormatter.format(data?.pendingOrders ?? 0)}
      />
      <StatCard
        title="Doanh thu tháng này"
        icon={<RiseOutlined />}
        accentColor="#1677ff"
        value={currencyFormatter.format(data?.revenueThisMonth ?? 0)}
      />
      <StatCard
        title="Đơn hoàn tất tháng này"
        icon={<CheckCircleOutlined />}
        accentColor="#52c41a"
        value={numberFormatter.format(data?.completedThisMonth ?? 0)}
      />
      <StatCard
        title="Đơn hoàn tiền"
        icon={<WarningOutlined />}
        accentColor="#f5a623"
        value={numberFormatter.format(data?.refundedOrders ?? 0)}
      />
    </div>
  )
}
