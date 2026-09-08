export enum BulletinStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export enum BulletinImportance {
  NORMAL = 'NORMAL',
  URGENT = 'URGENT',
}

export interface BulletinCategory {
  id: string
  name: string
  slug: string
  description?: string | null
  color?: string | null
  createdAt: string
  updatedAt: string
}

export interface BulletinAttachment {
  id: string
  assetId: string
  sortOrder: number
  url: string | null
  originalName: string | null
  mimetype: string | null
  size: number | null
}

export interface Bulletin {
  id: string
  title: string
  summary?: string | null
  content: string
  slug: string

  status: BulletinStatus
  publishedAt?: string | null

  thumbnail?: string | null
  thumbnailAssetId?: string | null

  categoryId?: string | null
  category?: BulletinCategory | null

  importance: BulletinImportance
  pinnedUntil?: string | null
  expiresAt?: string | null

  isFeatured: boolean
  featuredRank?: number | null

  viewCount: number
  attachments?: BulletinAttachment[]

  createdAt: string
  updatedAt: string
}
