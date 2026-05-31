import { resolveUploadUrl } from '@/components/Upload/assetResource'
import { FileVisibility } from '@/models/FileResource'
import type { FileResource } from '@/models/FileResource'
import {
  completeMultipartUpload,
  confirmPresignedUpload,
  getAssetAccessUrl,
  initMultipartUpload,
  requestPresignedUpload,
} from '@/services/Asset'
import axios from 'axios'

const MULTIPART_THRESHOLD = 50 * 1024 * 1024 // 50 MB

export interface UploadDocumentFileInput {
  file: File
  signal?: AbortSignal
  onProgress?: (loaded: number, total: number) => void
}

export type UploadDocumentFileOutput = FileResource

export async function uploadDocumentFile({
  file,
  signal,
  onProgress,
}: UploadDocumentFileInput): Promise<UploadDocumentFileOutput> {
  const contentType = file.type || 'application/pdf'
  let assetId: string

  if (file.size < MULTIPART_THRESHOLD) {
    // ── Single presigned PUT ──
    const { assetId: id, uploadUrl } = await requestPresignedUpload({
      filename: file.name,
      contentType,
    })
    assetId = id

    await axios.put(resolveUploadUrl(uploadUrl), file, {
      signal,
      headers: { 'Content-Type': contentType },
      onUploadProgress: e => onProgress?.(e.loaded, e.total ?? file.size),
    })

    await confirmPresignedUpload(assetId)
  } else {
    // ── Multipart upload ──
    const session = await initMultipartUpload({
      filename: file.name,
      fileSize: file.size,
      contentType,
    })
    assetId = session.assetId

    const completedParts: { partNumber: number; etag: string }[] = []
    let completedBytes = 0

    for (const part of session.parts) {
      if (signal?.aborted) throw new DOMException('Upload cancelled', 'AbortError')

      const start = (part.partNumber - 1) * session.chunkSize
      const end = Math.min(start + session.chunkSize, file.size)

      const response = await axios.put(resolveUploadUrl(part.url), file.slice(start, end), {
        signal,
        headers: { 'Content-Type': 'application/octet-stream' },
        onUploadProgress: e => onProgress?.(completedBytes + e.loaded, file.size),
      })

      const etag = (response.headers['etag'] as string | undefined) ?? ''
      completedParts.push({ partNumber: part.partNumber, etag })
      completedBytes += end - start
      onProgress?.(completedBytes, file.size)
    }

    await completeMultipartUpload(assetId, completedParts)
  }

  const url = await getAssetAccessUrl(assetId).catch(() => undefined)

  return {
    id: assetId,
    originalName: file.name,
    fileName: file.name,
    mimeType: contentType,
    size: file.size,
    visibility: FileVisibility.PRIVATE,
    url,
  }
}
