import { DownloadOutlined, FileTextOutlined, RiseOutlined, TeamOutlined } from '@ant-design/icons'
import { Badge, Card, Col, Row, Space, Typography } from 'antd'
import type { ReactNode } from 'react'

export interface DashboardSummaryData {
  totalRevenue: number
  totalUsers: number
  newUsers: number
  totalDocuments: number
  totalDownloads: number
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
      loading={false}
      style={{
        height: '100%',
        width: '100%',
        borderRadius: 12,
        border: '1px solid #f0f0f0',
        borderTop: `3px solid ${accentColor}`,
        boxShadow: '0 6px 18px rgba(15, 23, 42, 0.06)',
      }}
      styles={{
        body: {
          padding: 18,
        },
      }}
    >
      <Space direction="vertical" size={12} className="w-full">
        <Space align="start" className="w-full justify-between">
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
        </Space>

        <Typography.Title level={3} style={{ margin: 0, lineHeight: 1.1 }}>
          {value}
        </Typography.Title>

        {helper ? <div>{helper}</div> : null}
      </Space>
    </Card>
  )
}

export function DashboardSummaryCards({ data, loading }: DashboardSummaryCardsProps) {
  if (loading) {
    return (
      <Row gutter={[16, 16]} align="stretch">
        {Array.from({ length: 4 }).map((_, index) => (
          <Col key={index} xs={24} sm={12} xl={6} className="flex">
            <Card loading style={{ height: '100%', width: '100%', borderRadius: 12 }} />
          </Col>
        ))}
      </Row>
    )
  }

  return (
    <Row gutter={[16, 16]} align="stretch">
      <Col xs={24} sm={12} xl={6} className="flex">
        <MetricCard
          title="Tổng doanh thu"
          icon={<RiseOutlined />}
          accentColor="#1677ff"
          value={currencyFormatter.format(data?.totalRevenue ?? 0)}
          helper={
            <Typography.Text type="secondary">Tổng doanh thu trong kỳ đã chọn</Typography.Text>
          }
        />
      </Col>

      <Col xs={24} sm={12} xl={6} className="flex">
        <MetricCard
          title="Tổng người dùng"
          icon={<TeamOutlined />}
          accentColor="#52c41a"
          value={numberFormatter.format(data?.totalUsers ?? 0)}
          helper={
            <Space align="center" size={8}>
              <Typography.Text type="secondary">Người dùng mới</Typography.Text>
              <Badge
                count={`+${numberFormatter.format(data?.newUsers ?? 0)}`}
                color="#52c41a"
                showZero
              />
            </Space>
          }
        />
      </Col>

      <Col xs={24} sm={12} xl={6} className="flex">
        <MetricCard
          title="Tổng tài liệu"
          icon={<FileTextOutlined />}
          accentColor="#722ed1"
          value={numberFormatter.format(data?.totalDocuments ?? 0)}
          helper={
            <Typography.Text type="secondary">Số tài liệu hiện có trên hệ thống</Typography.Text>
          }
        />
      </Col>

      <Col xs={24} sm={12} xl={6} className="flex">
        <MetricCard
          title="Tổng lượt tải"
          icon={<DownloadOutlined />}
          accentColor="#13c2c2"
          value={numberFormatter.format(data?.totalDownloads ?? 0)}
          helper={
            <Typography.Text type="secondary">Lượt tải ghi nhận trong kỳ đã chọn</Typography.Text>
          }
        />
      </Col>
    </Row>
  )
}
