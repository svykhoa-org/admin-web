import axiosInstance from '@/lib/axios'
import { type Article, type ArticleStatus } from '@/models/Article'
import type { ApiListData, ApiListResponse } from '@/types/api'
import { unwrapList } from '@/utils/apiResponse'

const ADMIN_ENDPOINT = '/articles/admin'

// The articles list endpoint takes flat query params (page/limit/search/…),
// not the generic searcher/sorter payload — so no buildQuery here.
export interface ListArticleInput {
  page?: number
  limit?: number
  search?: string
  categoryId?: string
  status?: ArticleStatus
}

export type ListArticleOutput = ApiListData<Article>

export async function listArticle(input?: ListArticleInput): Promise<ListArticleOutput> {
  const response = await axiosInstance.get<ApiListResponse<Article>>(ADMIN_ENDPOINT, {
    params: input,
  })
  return unwrapList(response.data)
}
