import { Space } from 'antd'
import { useEffect } from 'react'
import { useRequest } from '@/hooks'
import { getOrderStats } from '@/services/Order'
import { OrderStatsBar } from './components/OrderStatsBar'
import { OrderTable } from './components/OrderTable'

export const OrderListPage = () => {
  const { data, isLoading, execute } = useRequest(getOrderStats)

  useEffect(() => {
    void execute()
  }, [execute])

  return (
    <Space direction="vertical" size={16} className="w-full">
      <OrderStatsBar data={data ?? null} loading={isLoading} />
      <OrderTable />
    </Space>
  )
}
