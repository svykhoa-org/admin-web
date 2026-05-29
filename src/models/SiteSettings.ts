export interface SiteSettings {
  siteName: string | null
  tagline: string | null
  logoId: string | null
  logoUrl: string | null
  faviconId: string | null
  faviconUrl: string | null
  contactEmail: string | null
  contactPhone: string | null
  contactAddress: string | null
  zaloUrl: string | null
  facebookUrl: string | null
  youtubeUrl: string | null
  tiktokUrl: string | null
  instagramUrl: string | null
}

export interface UpdateSiteSettingsInput {
  siteName?: string
  tagline?: string
  logoId?: string
  faviconId?: string
  contactEmail?: string
  contactPhone?: string
  contactAddress?: string
  zaloUrl?: string
  facebookUrl?: string
  youtubeUrl?: string
  tiktokUrl?: string
  instagramUrl?: string
}
