import axiosInstance from '@/lib/axios'
import type { ForumThread, ThreadStatus } from '@/models/Forum'
import type { ApiListResponse } from '@/types/api'
import { unwrapList } from '@/utils/apiResponse'

const BASE = '/forum/admin/threads'

export async function listAdminThreads(params?: {
  subCategoryId?: string
  status?: ThreadStatus
  page?: number
  limit?: number
}): Promise<{ items: ForumThread[]; total: number }> {
  const res = await axiosInstance.get<ApiListResponse<ForumThread>>(BASE, { params })
  const data = unwrapList(res.data)
  return { items: data.items ?? [], total: data.pagination.totalItems ?? 0 }
}

export async function setThreadStatus(id: string, status: ThreadStatus): Promise<void> {
  await axiosInstance.patch(`${BASE}/${id}/status`, { status })
}

export async function setThreadPin(id: string, isPinned: boolean): Promise<void> {
  await axiosInstance.patch(`${BASE}/${id}/pin`, { isPinned })
}

export async function setThreadLock(id: string, isLocked: boolean): Promise<void> {
  await axiosInstance.patch(`${BASE}/${id}/lock`, { isLocked })
}

export async function deleteThread(id: string): Promise<void> {
  await axiosInstance.delete(`${BASE}/${id}`)
}
