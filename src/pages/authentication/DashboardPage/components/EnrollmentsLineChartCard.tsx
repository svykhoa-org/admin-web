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

interface EnrollmentPoint {
  date: string
  count: number
}

interface EnrollmentsLineChartCardProps {
  data: EnrollmentPoint[]
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
        stepSize: 1,
        callback: value => Math.floor(Number(value)).toString(),
      },
    },
  },
}

export function EnrollmentsLineChartCard({ data, loading }: EnrollmentsLineChartCardProps) {
  const chartData = {
    labels: data.map(item => item.date),
    datasets: [
      {
        label: 'Đăng ký mới',
        data: data.map(item => item.count),
        borderColor: '#f5a623',
        backgroundColor: 'rgba(245,166,35,0.15)',
        fill: true,
        tension: 0.35,
        pointRadius: 2,
      },
    ],
  }

  return (
    <Card title="Đăng ký khoá học" loading={loading} bodyStyle={{ height: 360 }}>
      {data.length === 0 ? (
        <Empty description="Không có dữ liệu" />
      ) : (
        <Line data={chartData} options={options} />
      )}
    </Card>
  )
}
