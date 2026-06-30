import axiosInstance from '@/lib/axios'
import type { ForumReport, ReportStatus } from '@/models/Forum'
import type { ApiListResponse } from '@/types/api'
import { unwrapList } from '@/utils/apiResponse'

const BASE = '/forum/admin/reports'

export async function listReports(params?: {
  status?: ReportStatus
  page?: number
  limit?: number
}): Promise<{ items: ForumReport[]; total: number }> {
  const res = await axiosInstance.get<ApiListResponse<ForumReport>>(BASE, { params })
  const data = unwrapList(res.data)
  return { items: data.items ?? [], total: data.pagination.totalItems ?? 0 }
}

export async function updateReportStatus(id: string, status: ReportStatus): Promise<void> {
  await axiosInstance.patch(`${BASE}/${id}/status`, { status })
}
