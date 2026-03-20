import { useEffect, useMemo, useState } from 'react'
import { ReloadOutlined } from '@ant-design/icons'
import { Alert, Button, Col, Row, Segmented, Space, Typography } from 'antd'
import { useRequest } from '@/hooks'
import type { AnalyticsQueryDto } from '@/services/Analytics'
import { getAnalyticsDashboard } from '@/services/Analytics'
import { DashboardSummaryCards } from './components/DashboardSummaryCards'
import { RevenueLineChartCard } from './components/RevenueLineChartCard'
import { DownloadsBarChartCard } from './components/DownloadsBarChartCard'
import { TopDownloadedDocumentsCard } from './components/TopDownloadedDocumentsCard'

const { Title } = Typography

type DashboardRange = '1m' | '2w' | '1w'

interface TimeRange {
  start: Date
  end: Date
}

const rangeDays: Record<DashboardRange, number> = {
  '1m': 30,
  '2w': 14,
  '1w': 7,
}

function formatDateKey(date: Date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function getTimeRange(range: DashboardRange): TimeRange {
  const end = new Date()
  end.setHours(23, 59, 59, 999)

  const start = new Date(end)
  start.setDate(end.getDate() - (rangeDays[range] - 1))
  start.setHours(0, 0, 0, 0)

  return { start, end }
}

function fillDays(
  start: Date,
  end: Date,
  entries: Array<{ date: string; value: number }>,
): Array<{ date: string; value: number }> {
  const valueByDate = new Map(entries.map(item => [item.date, item.value]))
  const result: Array<{ date: string; value: number }> = []

  const cursor = new Date(start)
  while (cursor <= end) {
    const key = formatDateKey(cursor)
    result.push({
      date: key,
      value: valueByDate.get(key) ?? 0,
    })
    cursor.setDate(cursor.getDate() + 1)
  }

  return result
}

export default function DashboardPage() {
  const [range, setRange] = useState<DashboardRange>('1m')

  const { data, isLoading, error, execute } = useRequest(getAnalyticsDashboard)

  const timeRange = useMemo(() => getTimeRange(range), [range])
  const query = useMemo<AnalyticsQueryDto>(
    () => ({
      startDate: timeRange.start.toISOString(),
      endDate: timeRange.end.toISOString(),
    }),
    [timeRange.end, timeRange.start],
  )

  useEffect(() => {
    void execute(query)
  }, [execute, query])

  const revenueByDay = useMemo(() => {
    const source =
      data?.revenueByDay.map(item => ({
        date: item.date,
        value: item.total,
      })) ?? []
    return fillDays(timeRange.start, timeRange.end, source)
  }, [data?.revenueByDay, timeRange.end, timeRange.start])

  const downloadsByDay = useMemo(() => {
    const source =
      data?.downloadsByDay.map(item => ({
        date: item.date,
        value: item.count,
      })) ?? []
    return fillDays(timeRange.start, timeRange.end, source)
  }, [data?.downloadsByDay, timeRange.end, timeRange.start])

  return (
    <Space direction="vertical" size={16} className="w-full">
      <Space className="w-full justify-between items-center" wrap>
        <Title level={2} style={{ margin: 0 }}>
          Dashboard
        </Title>
        <Space>
          <Segmented<DashboardRange>
            value={range}
            onChange={value => setRange(value)}
            options={[
              { label: '1 tháng', value: '1m' },
              { label: '2 tuần', value: '2w' },
              { label: '1 tuần', value: '1w' },
            ]}
          />
          <Button icon={<ReloadOutlined />} loading={isLoading} onClick={() => void execute(query)}>
            Làm mới
          </Button>
        </Space>
      </Space>

      {error ? (
        <Alert
          type="error"
          showIcon
          message="Không thể tải dữ liệu dashboard"
          description="Vui lòng thử lại sau hoặc đổi khoảng thời gian khác."
        />
      ) : null}

      <DashboardSummaryCards
        loading={isLoading}
        data={
          data
            ? {
                totalRevenue: data.totalRevenue,
                totalUsers: data.totalUsers,
                newUsers: data.newUsers,
                totalDocuments: data.totalDocuments,
                totalDownloads: data.totalDownloads,
              }
            : null
        }
      />

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <RevenueLineChartCard loading={isLoading} data={revenueByDay} />
        </Col>
        <Col xs={24} lg={8}>
          <DownloadsBarChartCard loading={isLoading} data={downloadsByDay} />
        </Col>
      </Row>

      <TopDownloadedDocumentsCard loading={isLoading} data={data?.topDocuments ?? []} />
    </Space>
  )
}
