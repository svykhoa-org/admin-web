import type { FileResource } from '@/models/FileResource'
import { FileVisibility } from '@/models/FileResource'
import {
  completeMultipartUpload,
  confirmPresignedUpload,
  getAssetAccessUrl,
  initMultipartUpload,
  requestPresignedUpload,
} from '@/services/Asset'
import { CloseOutlined, DownloadOutlined, EyeOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import axios from 'axios'
import { resolveUploadUrl } from './assetResource'
import { UploadSingleFile } from './base/UploadSingleFile'
import type { UploadFileFn } from './base/UploadSingleFile'
import type { ExistingFileData } from './types'
import { getFileIconInfo } from './utils'

// ─── Constants ────────────────────────────────────────────────────────────────

const MULTIPART_THRESHOLD = 50 * 1024 * 1024 // 50 MB

// ─── Upload fn ────────────────────────────────────────────────────────────────

const uploadFn: UploadFileFn<FileResource> = async (file, signal, onProgress) => {
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
      onUploadProgress: e => onProgress(e.loaded, e.total ?? file.size),
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
      if (signal.aborted) throw new DOMException('Upload cancelled', 'AbortError')

      const start = (part.partNumber - 1) * session.chunkSize
      const end = Math.min(start + session.chunkSize, file.size)

      const response = await axios.put(resolveUploadUrl(part.url), file.slice(start, end), {
        signal,
        headers: { 'Content-Type': 'application/octet-stream' },
        onUploadProgress: e => onProgress(completedBytes + e.loaded, file.size),
      })

      const etag = (response.headers['etag'] as string | undefined) ?? ''
      completedParts.push({ partNumber: part.partNumber, etag })
      completedBytes += end - start
      onProgress(completedBytes, file.size)
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

// ─── Public types ─────────────────────────────────────────────────────────────

export interface UploadSingleDocumentProps {
  onSuccess?: (resource: FileResource) => void
  onRemove?: (resource: FileResource) => void
  maxSizeMB?: number
  disabled?: boolean
  existingFile?: ExistingFileData
  hideUploadOnFilled?: boolean
  onRemoveExisting?: () => void
  /** When provided, clicking the eye icon calls this instead of opening a new tab */
  onPreview?: (url: string) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function UploadSingleDocument({
  onSuccess,
  onRemove,
  maxSizeMB,
  disabled,
  existingFile,
  hideUploadOnFilled,
  onRemoveExisting,
  onPreview,
}: UploadSingleDocumentProps) {
  return (
    <UploadSingleFile<FileResource>
      uploadFn={uploadFn}
      onSuccess={onSuccess}
      onRemove={onRemove}
      accept=".pdf"
      maxSizeMB={maxSizeMB}
      disabled={disabled}
      placeholder="Kéo thả tài liệu PDF vào đây hoặc bấm để chọn"
      hint="Chỉ hỗ trợ tệp PDF"
      existingFile={existingFile}
      hideUploadOnFilled={hideUploadOnFilled}
      onRemoveExisting={onRemoveExisting}
      renderSuccess={(resource, file, onReset, _previewUrl) => {
        const name = resource.originalName ?? resource.fileName ?? file.name
        const { Icon, colorClass, label } = getFileIconInfo(name, resource.mimeType)
        const size = resource.size ?? file.size
        return (
          <div className="upload-file-item">
            <Icon style={{ fontSize: 26 }} className={`shrink-0 ${colorClass}`} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">{name}</div>
              <div className="text-xs text-gray-400 mt-0.5">
                {label}
                {size ? ` · ${(size / 1048576).toFixed(1)} MB` : ''}
              </div>
            </div>
            {resource.url && (
              <>
                {onPreview ? (
                  <Button
                    type="text"
                    size="small"
                    icon={<EyeOutlined />}
                    onClick={() => onPreview(resource.url!)}
                    className="shrink-0 text-gray-400"
                  />
                ) : (
                  <a href={resource.url} target="_blank" rel="noopener noreferrer">
                    <Button
                      type="text"
                      size="small"
                      icon={<EyeOutlined />}
                      className="shrink-0 text-gray-400"
                    />
                  </a>
                )}
                <a href={resource.url} download rel="noopener noreferrer">
                  <Button
                    type="text"
                    size="small"
                    icon={<DownloadOutlined />}
                    className="shrink-0 text-gray-400"
                  />
                </a>
              </>
            )}
            <Button
              type="text"
              size="small"
              icon={<CloseOutlined />}
              onClick={onReset}
              className="shrink-0 text-gray-400"
            />
          </div>
        )
      }}
    />
  )
}
