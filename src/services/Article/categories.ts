import axiosInstance from '@/lib/axios'
import type { ArticleCategory } from '@/models/Article'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

const CATEGORY_ENDPOINT = '/article-categories'

export interface ArticleCategoryInput {
  name: string
  description?: string | null
  color?: string | null
}

export async function listArticleCategories(): Promise<ArticleCategory[]> {
  const response = await axiosInstance.get<ApiDetailResponse<ArticleCategory[]>>(CATEGORY_ENDPOINT)
  return unwrapDetail(response.data)
}

export async function createArticleCategory(input: ArticleCategoryInput): Promise<ArticleCategory> {
  const response = await axiosInstance.post<ApiDetailResponse<ArticleCategory>>(
    CATEGORY_ENDPOINT,
    input,
  )
  return unwrapDetail(response.data)
}

export async function updateArticleCategory(
  id: string,
  input: Partial<ArticleCategoryInput>,
): Promise<ArticleCategory> {
  const response = await axiosInstance.patch<ApiDetailResponse<ArticleCategory>>(
    `${CATEGORY_ENDPOINT}/${id}`,
    input,
  )
  return unwrapDetail(response.data)
}

export async function removeArticleCategory(id: string): Promise<void> {
  await axiosInstance.delete(`${CATEGORY_ENDPOINT}/${id}`)
}
