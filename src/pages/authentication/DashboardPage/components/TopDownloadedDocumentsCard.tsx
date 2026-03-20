import { Card, List, Space, Tag, Typography } from 'antd'
import type { TopDocumentItem } from '@/models/AnalyticsDashboard'

interface TopDownloadedDocumentsCardProps {
  data: TopDocumentItem[]
  loading: boolean
}

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
})

const numberFormatter = new Intl.NumberFormat('vi-VN')

export function TopDownloadedDocumentsCard({ data, loading }: TopDownloadedDocumentsCardProps) {
  return (
    <Card title="Tài liệu tải nhiều nhất" loading={loading}>
      <List
        locale={{ emptyText: 'Chưa có dữ liệu' }}
        dataSource={data}
        renderItem={(item, index) => (
          <List.Item>
            <Space className="w-full justify-between" align="center">
              <Space size={10}>
                <Tag color="blue">#{index + 1}</Tag>
                <Space direction="vertical" size={0}>
                  <Typography.Text strong>{item.title}</Typography.Text>
                  <Typography.Text type="secondary">
                    Lượt tải: {numberFormatter.format(item.sales)}
                  </Typography.Text>
                </Space>
              </Space>
              <Typography.Text strong>{currencyFormatter.format(item.revenue)}</Typography.Text>
            </Space>
          </List.Item>
        )}
      />
    </Card>
  )
}
