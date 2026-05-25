import ENV from '@/constants/env'
import { FileVisibility, type FileResource } from '@/models/FileResource'
import type { AssetRecord } from '@/services/Asset'

export function mapAssetToFileResource(asset: AssetRecord, url?: string): FileResource {
  const visibility = asset.visibility === 'PUBLIC' ? FileVisibility.PUBLIC : FileVisibility.PRIVATE

  return {
    id: asset.id,
    originalName: asset.originalName,
    fileName: asset.originalName,
    mimeType: asset.mimetype,
    size: asset.size ?? undefined,
    key: asset.key ?? undefined,
    bucket: asset.bucket ?? undefined,
    visibility,
    metadata: asset.metadata,
    url,
  }
}

export function resolveUploadUrl(uploadUrl: string): string {
  console.log('Resolving upload URL:', uploadUrl)
  console.log('Base file URL from ENV:', ENV.API_FILE_URL)
  if (/^https?:\/\//i.test(uploadUrl)) return uploadUrl
  try {
    return new URL(uploadUrl, ENV.API_FILE_URL).toString()
  } catch {
    return `${ENV.API_FILE_URL}${uploadUrl}`
  }
}
