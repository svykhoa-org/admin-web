import axiosInstance from '@/lib/axios'
import type { AnalyticsDashboard } from '@/models/AnalyticsDashboard'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

const ANALYTICS_DASHBOARD_ENDPOINT = '/analytics/dashboard'

export interface AnalyticsQueryDto {
  startDate?: string
  endDate?: string
}

export async function getAnalyticsDashboard(
  params?: AnalyticsQueryDto,
): Promise<AnalyticsDashboard> {
  const response = await axiosInstance.get<ApiDetailResponse<AnalyticsDashboard>>(
    ANALYTICS_DASHBOARD_ENDPOINT,
    {
      params,
    },
  )

  return unwrapDetail(response.data)
}
