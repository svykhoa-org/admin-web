import axiosInstance from '@/lib/axios'
import type { SiteSettings, UpdateSiteSettingsInput } from '@/models/SiteSettings'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

const ENDPOINT = '/site-settings'

export async function getSiteSettings(): Promise<SiteSettings> {
  const response = await axiosInstance.get<ApiDetailResponse<SiteSettings>>(ENDPOINT)
  return unwrapDetail(response.data)
}

export async function updateSiteSettings(input: UpdateSiteSettingsInput): Promise<SiteSettings> {
  const response = await axiosInstance.patch<ApiDetailResponse<SiteSettings>>(ENDPOINT, input)
  return unwrapDetail(response.data)
}
