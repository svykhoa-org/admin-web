import axiosInstance from '@/lib/axios'
import { type Bulletin, type BulletinImportance, type BulletinStatus } from '@/models/Bulletin'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

const ADMIN_ENDPOINT = '/bulletins/admin'

export interface BulletinWriteInput {
  title: string
  summary?: string | null
  content: string
  thumbnailAssetId?: string | null
  categoryId?: string | null
  importance?: BulletinImportance
  pinnedUntil?: string | null
  expiresAt?: string | null
  isFeatured?: boolean
  featuredRank?: number | null
  attachmentAssetIds?: string[]
  status?: BulletinStatus
}

export async function createBulletin(input: BulletinWriteInput): Promise<Bulletin> {
  const response = await axiosInstance.post<ApiDetailResponse<Bulletin>>(ADMIN_ENDPOINT, input)
  return unwrapDetail(response.data)
}
