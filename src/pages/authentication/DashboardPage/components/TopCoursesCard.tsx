import { Card, List, Space, Tag, Typography } from 'antd'
import { useNavigate } from 'react-router-dom'
import type { TopCourseItem } from '@/models/AnalyticsDashboard'

interface TopCoursesCardProps {
  data: TopCourseItem[]
  loading: boolean
}

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
})

const numberFormatter = new Intl.NumberFormat('vi-VN')

export function TopCoursesCard({ data, loading }: TopCoursesCardProps) {
  const navigate = useNavigate()

  return (
    <Card title="Khoá học đăng ký nhiều nhất" loading={loading}>
      <List
        locale={{ emptyText: 'Chưa có dữ liệu' }}
        dataSource={data}
        renderItem={(item, index) => (
          <List.Item
            style={{ cursor: 'pointer' }}
            onClick={() => navigate(`/courses/${item.courseId}`)}
          >
            <Space className="w-full justify-between" align="center">
              <Space size={10}>
                <Tag color="orange">#{index + 1}</Tag>
                <Space direction="vertical" size={0}>
                  <Typography.Text strong>{item.title}</Typography.Text>
                  <Typography.Text type="secondary">
                    Đăng ký: {numberFormatter.format(item.enrollments)}
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
