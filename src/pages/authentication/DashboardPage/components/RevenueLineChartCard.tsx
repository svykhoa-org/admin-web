import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
  type ChartOptions,
} from 'chart.js'
import { Card, Empty } from 'antd'
import { Line } from 'react-chartjs-2'
import type { RevenueByDayItem } from '@/models/AnalyticsDashboard'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

interface RevenueLineChartCardProps {
  data: RevenueByDayItem[]
  loading: boolean
}

const options: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      position: 'top',
    },
    tooltip: {
      callbacks: {
        label: ctx => `${ctx.dataset.label}: ${Number(ctx.raw).toLocaleString('vi-VN')} VND`,
      },
    },
  },
  scales: {
    x: {
      ticks: {
        font: {
          style: 'italic',
        },
      },
      grid: {
        display: false,
      },
    },
    y: {
      beginAtZero: true,
      ticks: {
        callback: value => Number(value).toLocaleString('vi-VN'),
      },
    },
  },
}

export function RevenueLineChartCard({ data, loading }: RevenueLineChartCardProps) {
  const chartData = {
    labels: data.map(item => item.date),
    datasets: [
      {
        label: 'Khoá học',
        data: data.map(item => item.courseRevenue),
        borderColor: '#1677ff',
        backgroundColor: 'rgba(22,119,255,0.10)',
        fill: true,
        tension: 0.35,
        pointRadius: 2,
      },
      {
        label: 'Tài liệu',
        data: data.map(item => item.documentRevenue),
        borderColor: '#722ed1',
        backgroundColor: 'rgba(114,46,209,0.10)',
        fill: true,
        tension: 0.35,
        pointRadius: 2,
      },
    ],
  }

  return (
    <Card title="Biểu đồ doanh thu" loading={loading} bodyStyle={{ height: 360 }}>
      {data.length === 0 ? (
        <Empty description="Không có dữ liệu" />
      ) : (
        <Line data={chartData} options={options} />
      )}
    </Card>
  )
}
