import type { FileResource } from '@/models/FileResource'
import { getAssetAccessUrl, uploadSingleAsset } from '@/services/Asset'
import { InboxOutlined } from '@ant-design/icons'
import { Upload } from 'antd'
import { useRef, useState } from 'react'
import { mapAssetToFileResource } from './assetResource'
import { MediaCard } from './MediaCard'
import { FileItemStatus, UploadStatus } from './types'
import { makeUid } from './utils'

// ─── Upload fn ────────────────────────────────────────────────────────────────

function uploadImage(
  file: File,
  signal: AbortSignal,
  onProgress: (loaded: number, total: number) => void,
): Promise<FileResource> {
  return uploadSingleAsset(file, 'PUBLIC', signal, onProgress).then(async asset => {
    const url = await getAssetAccessUrl(asset.id).catch(() => undefined)
    return mapAssetToFileResource(asset, url)
  })
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ImageItem {
  uid: string
  file: File
  status: FileItemStatus
  progress: number
  result?: FileResource
  previewUrl?: string
  error?: string
}

// ─── Public types ─────────────────────────────────────────────────────────────

export interface UploadMultipleImageProps {
  onChange?: (resources: FileResource[]) => void
  maxSizeMB?: number
  maxCount?: number
  disabled?: boolean
}

// ─── Component ────────────────────────────────────────────────────────────────

export function UploadMultipleImage({
  onChange,
  maxSizeMB,
  maxCount,
  disabled = false,
}: UploadMultipleImageProps) {
  const [items, setItems] = useState<ImageItem[]>([])
  const controllersRef = useRef<Map<string, AbortController>>(new Map())
  const previewUrlsRef = useRef<Map<string, string>>(new Map())

  function notifyChange(current: ImageItem[]) {
    const results = current
      .filter(it => it.status === FileItemStatus.Done && it.result)
      .map(it => it.result!)
    onChange?.(results)
  }

  function updateItem(uid: string, patch: Partial<ImageItem>) {
    setItems(prev => {
      const next = prev.map(it => (it.uid === uid ? { ...it, ...patch } : it))
      notifyChange(next)
      return next
    })
  }

  function handleFile(file: File) {
    if (maxCount !== undefined && items.length >= maxCount) return

    if (maxSizeMB && file.size > maxSizeMB * 1048576) {
      setItems(prev => [
        ...prev,
        {
          uid: makeUid(),
          file,
          status: FileItemStatus.Error,
          progress: 0,
          error: `Ảnh không được vượt quá ${maxSizeMB} MB`,
        },
      ])
      return
    }

    const uid = makeUid()
    const objectUrl = URL.createObjectURL(file)
    previewUrlsRef.current.set(uid, objectUrl)
    const controller = new AbortController()

    setItems(prev => [
      ...prev,
      { uid, file, status: FileItemStatus.Uploading, progress: 0, previewUrl: objectUrl },
    ])

    queueMicrotask(() => {
      controllersRef.current.set(uid, controller)

      void uploadImage(file, controller.signal, (loaded, total) => {
        updateItem(uid, { progress: Math.round((loaded / total) * 100) })
      })
        .then(result => {
          controllersRef.current.delete(uid)
          // Swap local preview for remote URL
          const preview = result.url ?? previewUrlsRef.current.get(uid)
          if (result.url) {
            URL.revokeObjectURL(previewUrlsRef.current.get(uid) ?? '')
            previewUrlsRef.current.set(uid, result.url)
          }
          updateItem(uid, {
            status: FileItemStatus.Done,
            progress: 100,
            result,
            previewUrl: preview,
          })
        })
        .catch(err => {
          if (controller.signal.aborted) return
          controllersRef.current.delete(uid)
          updateItem(uid, {
            status: FileItemStatus.Error,
            error: err instanceof Error ? err.message : 'Upload thất bại',
          })
        })
    })
  }

  function removeItem(uid: string) {
    controllersRef.current.get(uid)?.abort()
    controllersRef.current.delete(uid)
    const objectUrl = previewUrlsRef.current.get(uid)
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl)
      previewUrlsRef.current.delete(uid)
    }
    setItems(prev => {
      const next = prev.filter(it => it.uid !== uid)
      notifyChange(next)
      return next
    })
  }

  function handlePreview(item: ImageItem) {
    const url = item.result?.url ?? item.previewUrl
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
  }

  function toUploadStatus(s: FileItemStatus): UploadStatus {
    if (s === FileItemStatus.Uploading) return UploadStatus.Uploading
    if (s === FileItemStatus.Done) return UploadStatus.Done
    return UploadStatus.Error
  }

  const isMaxReached = maxCount !== undefined && items.length >= maxCount

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* ── Grid of image tiles ── */}
      {items.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {items.map(item => (
            <MediaCard
              key={item.uid}
              status={toUploadStatus(item.status)}
              progress={item.progress}
              mediaType="image"
              previewUrl={item.previewUrl}
              size="sm"
              onRemove={() => removeItem(item.uid)}
              onPreview={
                item.status === FileItemStatus.Done ? () => handlePreview(item) : undefined
              }
              errorMsg={item.error}
            />
          ))}
        </div>
      )}

      {/* ── Dragger — always visible unless max reached ── */}
      {!isMaxReached && (
        <Upload
          accept="image/*"
          multiple
          showUploadList={false}
          disabled={disabled}
          beforeUpload={file => {
            handleFile(file)
            return false
          }}
        >
          <div className="upload-media-card upload-media-card--sm flex items-center justify-center cursor-pointer">
            <div className="flex flex-col items-center gap-1 text-gray-400">
              <InboxOutlined style={{ fontSize: 20 }} />
              <span className="text-xs text-center px-2">Thêm ảnh</span>
            </div>
          </div>
        </Upload>
      )}
    </div>
  )
}
