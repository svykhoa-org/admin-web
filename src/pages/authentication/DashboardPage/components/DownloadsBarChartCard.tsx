import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
  type ChartOptions,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { Card, Empty } from 'antd'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

interface DownloadPoint {
  date: string
  value: number
}

interface DownloadsBarChartCardProps {
  data: DownloadPoint[]
  loading: boolean
}

const options: ChartOptions<'bar'> = {
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
      },
    },
  },
}

export function DownloadsBarChartCard({ data, loading }: DownloadsBarChartCardProps) {
  const chartData = {
    labels: data.map(item => item.date),
    datasets: [
      {
        label: 'Lượt tải theo ngày',
        data: data.map(item => item.value),
        backgroundColor: '#13c2c2',
        borderRadius: 6,
      },
    ],
  }

  return (
    <Card title="Biểu đồ lượt tải" loading={loading} bodyStyle={{ height: 360 }}>
      {data.length === 0 ? (
        <Empty description="Không có dữ liệu" />
      ) : (
        <Bar data={chartData} options={options} />
      )}
    </Card>
  )
}
