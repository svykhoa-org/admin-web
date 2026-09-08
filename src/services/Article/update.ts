import axiosInstance from '@/lib/axios'
import { ArticleStatus, type Article } from '@/models/Article'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'
import type { ArticleWriteInput } from './create'

const ADMIN_ENDPOINT = '/articles/admin'

export async function updateArticle(
  id: string,
  input: Partial<ArticleWriteInput>,
): Promise<Article> {
  const response = await axiosInstance.patch<ApiDetailResponse<Article>>(
    `${ADMIN_ENDPOINT}/${id}`,
    input,
  )
  return unwrapDetail(response.data)
}

// Publish/unpublish are status transitions on the same update endpoint.
export function publishArticle(id: string): Promise<Article> {
  return updateArticle(id, { status: ArticleStatus.PUBLISHED })
}

export function unpublishArticle(id: string): Promise<Article> {
  return updateArticle(id, { status: ArticleStatus.DRAFT })
}
