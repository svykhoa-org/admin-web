import ENV from '@/constants/env'

export function getUrlFileResource(fileUrl?: string | null): string {
  if (!fileUrl) return ''

  if (/^https?:\/\//i.test(fileUrl)) {
    return fileUrl
  }

  try {
    return new URL(fileUrl, ENV.API_BASE_URL).toString()
  } catch {
    return fileUrl
  }
}
