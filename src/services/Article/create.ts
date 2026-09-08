import axiosInstance from '@/lib/axios'
import { type Article, type ArticleStatus } from '@/models/Article'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

const ADMIN_ENDPOINT = '/articles/admin'

// Shared write payload for create + update (update sends a partial subset).
export interface ArticleWriteInput {
  title: string
  summary: string
  content: string
  thumbnailAssetId?: string | null
  categoryId?: string | null
  authorUserId?: string | null
  authorName?: string
  authorTitle?: string | null
  authorAvatarUrl?: string | null
  reviewedByUserId?: string | null
  reviewedAt?: string | null
  isFeatured?: boolean
  featuredRank?: number | null
  metaTitle?: string | null
  metaDescription?: string | null
  canonicalUrl?: string | null
  ogImageAssetId?: string | null
  status?: ArticleStatus
}

export async function createArticle(input: ArticleWriteInput): Promise<Article> {
  const response = await axiosInstance.post<ApiDetailResponse<Article>>(ADMIN_ENDPOINT, input)
  return unwrapDetail(response.data)
}
