import axiosInstance from '@/lib/axios'
import type { Article } from '@/models/Article'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

const ADMIN_ENDPOINT = '/articles/admin'

export async function removeArticle(id: string): Promise<Article> {
  const response = await axiosInstance.delete<ApiDetailResponse<Article>>(`${ADMIN_ENDPOINT}/${id}`)
  return unwrapDetail(response.data)
}
