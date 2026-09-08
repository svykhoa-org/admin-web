import axiosInstance from '@/lib/axios'
import type { Bulletin } from '@/models/Bulletin'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

const ADMIN_ENDPOINT = '/bulletins/admin'

export async function removeBulletin(id: string): Promise<Bulletin> {
  const response = await axiosInstance.delete<ApiDetailResponse<Bulletin>>(
    `${ADMIN_ENDPOINT}/${id}`,
  )
  return unwrapDetail(response.data)
}
