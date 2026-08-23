import axiosInstance from '@/lib/axios'
import type { ForumComment, ForumThread, ThreadStatus } from '@/models/Forum'
import type { ApiDetailResponse, ApiListResponse } from '@/types/api'
import { unwrapDetail, unwrapList } from '@/utils/apiResponse'

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

export async function createAdminThread(data: {
  subCategoryId: string
  title: string
  content: string
  prefixTagId?: string
  isPinned?: boolean
}): Promise<ForumThread> {
  const res = await axiosInstance.post<ApiDetailResponse<ForumThread>>(BASE, data)
  return unwrapDetail(res.data)
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

// Detail + messages share the standard forum endpoints (same as client).
export async function getThread(id: string): Promise<ForumThread> {
  const res = await axiosInstance.get<ApiDetailResponse<ForumThread>>(`/forum/threads/${id}`)
  return unwrapDetail(res.data)
}

// Comments are returned as a flat array (not paginated) by the backend.
export async function listThreadComments(threadId: string): Promise<ForumComment[]> {
  const res = await axiosInstance.get<ApiDetailResponse<ForumComment[]>>(
    `/forum/threads/${threadId}/comments`,
  )
  return unwrapDetail(res.data) ?? []
}

export async function createComment(
  threadId: string,
  content: string,
  parentId?: string,
): Promise<ForumComment> {
  const res = await axiosInstance.post<ApiDetailResponse<ForumComment>>('/forum/comments', {
    threadId,
    content,
    parentId,
  })
  return unwrapDetail(res.data)
}

// Toggle a "like" reaction on the thread (article). Returns the new count + state.
export async function toggleThreadReaction(
  threadId: string,
): Promise<{ reacted: boolean; count: number }> {
  const res = await axiosInstance.post<ApiDetailResponse<{ reacted: boolean; count: number }>>(
    '/forum/reactions',
    { targetType: 'thread', targetId: threadId, reactionType: 'like' },
  )
  return unwrapDetail(res.data)
}
