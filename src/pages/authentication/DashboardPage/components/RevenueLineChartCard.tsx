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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

interface RevenuePoint {
  date: string
  value: number
}

interface RevenueLineChartCardProps {
  data: RevenuePoint[]
  loading: boolean
}

const options: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false,
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
        label: 'Doanh thu theo ngày (VND)',
        data: data.map(item => item.value),
        borderColor: '#1677ff',
        backgroundColor: 'rgba(22,119,255,0.15)',
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
