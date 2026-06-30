import type { AbstractModel } from './AbstractModel'

export type ForumCategoryGroup = AbstractModel & {
  name: string
  displayOrder: number
}

export type ForumSubCategory = AbstractModel & {
  name: string
  description: string | null
  groupId: string
  group?: { id: string; name: string }
  displayOrder: number
  threadCount: number
  messageCount: number
  requiresModeration: boolean
}

export type ForumPrefixTag = AbstractModel & {
  name: string
  colorHex: string
}

export enum ThreadStatus {
  Pending = 'pending',
  Published = 'published',
  Hidden = 'hidden',
}

export type ForumThread = AbstractModel & {
  title: string
  content: string
  authorId: string
  author?: { id: string; fullName: string; avatar: string | null }
  subCategoryId: string
  subCategory?: { id: string; name: string }
  prefixTagId: string | null
  prefixTag?: ForumPrefixTag | null
  isPinned: boolean
  isLocked: boolean
  viewCount: number
  status: ThreadStatus
  lastReplyAt: string | null
}

export enum ReportStatus {
  Open = 'open',
  Resolved = 'resolved',
  Dismissed = 'dismissed',
}

export type ForumReport = AbstractModel & {
  reporterId: string
  reporter?: { id: string; fullName: string }
  targetType: string
  targetId: string
  reason: string
  status: ReportStatus
}
