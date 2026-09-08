import axiosInstance from '@/lib/axios'
import type { Bulletin } from '@/models/Bulletin'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

const ADMIN_ENDPOINT = '/bulletins/admin'

export async function getBulletinDetail(id: string): Promise<Bulletin> {
  const response = await axiosInstance.get<ApiDetailResponse<Bulletin>>(`${ADMIN_ENDPOINT}/${id}`)
  return unwrapDetail(response.data)
}
