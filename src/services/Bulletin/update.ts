import axiosInstance from '@/lib/axios'
import { BulletinStatus, type Bulletin } from '@/models/Bulletin'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'
import type { BulletinWriteInput } from './create'

const ADMIN_ENDPOINT = '/bulletins/admin'

export async function updateBulletin(
  id: string,
  input: Partial<BulletinWriteInput>,
): Promise<Bulletin> {
  const response = await axiosInstance.patch<ApiDetailResponse<Bulletin>>(
    `${ADMIN_ENDPOINT}/${id}`,
    input,
  )
  return unwrapDetail(response.data)
}

export function publishBulletin(id: string): Promise<Bulletin> {
  return updateBulletin(id, { status: BulletinStatus.PUBLISHED })
}

export function unpublishBulletin(id: string): Promise<Bulletin> {
  return updateBulletin(id, { status: BulletinStatus.DRAFT })
}
