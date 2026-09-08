export enum ArticleStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export interface ArticleCategory {
  id: string
  name: string
  slug: string
  description?: string | null
  color?: string | null
  createdAt: string
  updatedAt: string
}

export interface ArticleReviewer {
  id: string
  fullName?: string
  avatarUrl?: string | null
}

export interface Article {
  id: string
  title: string
  summary: string
  content: string
  slug: string
  wordCount?: number | null

  status: ArticleStatus
  publishedAt?: string | null

  // Serialized public url of the cover asset + the raw asset id (for the form).
  thumbnail?: string | null
  thumbnailAssetId?: string | null

  categoryId?: string | null
  category?: ArticleCategory | null

  authorUserId?: string | null
  authorName: string
  authorTitle?: string | null
  authorAvatarUrl?: string | null

  reviewedByUserId?: string | null
  reviewedByUser?: ArticleReviewer | null
  reviewedAt?: string | null

  isFeatured: boolean
  featuredRank?: number | null

  metaTitle?: string | null
  metaDescription?: string | null
  canonicalUrl?: string | null
  ogImage?: string | null
  ogImageAssetId?: string | null

  viewCount: number
  createdAt: string
  updatedAt: string
}
