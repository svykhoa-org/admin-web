import type { FileResource } from '@/models/FileResource'
import { getAssetAccessUrl, uploadSingleAsset } from '@/services/Asset'
import { Upload } from 'antd'
import { useRef, useState } from 'react'
import { mapAssetToFileResource } from './assetResource'
import { MediaCard } from './MediaCard'
import type { MediaCardSize } from './MediaCard'
import { UploadStatus } from './types'

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

// ─── Public types ─────────────────────────────────────────────────────────────

export interface UploadSingleImageProps {
  onSuccess?: (resource: FileResource) => void
  onRemove?: (resource: FileResource) => void
  maxSizeMB?: number
  disabled?: boolean
  /** Card size: 'full' = 400px wide (default), 'sm' = 140px wide */
  size?: MediaCardSize
}

// ─── Component ────────────────────────────────────────────────────────────────

export function UploadSingleImage({
  onSuccess,
  onRemove,
  maxSizeMB,
  disabled = false,
  size,
}: UploadSingleImageProps) {
  const [status, setStatus] = useState<UploadStatus>(UploadStatus.Idle)
  const [progress, setProgress] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')
  const [result, setResult] = useState<FileResource | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | undefined>()
  const controllerRef = useRef<AbortController | null>(null)
  const prevPreviewRef = useRef<string | undefined>(undefined)

  function revokePreview() {
    if (prevPreviewRef.current) {
      URL.revokeObjectURL(prevPreviewRef.current)
      prevPreviewRef.current = undefined
    }
  }

  function handleFile(file: File) {
    if (maxSizeMB && file.size > maxSizeMB * 1048576) {
      setStatus(UploadStatus.Error)
      setErrorMsg(`Ảnh không được vượt quá ${maxSizeMB} MB`)
      return
    }

    revokePreview()
    const objectUrl = URL.createObjectURL(file)
    prevPreviewRef.current = objectUrl
    setPreviewUrl(objectUrl)

    const controller = new AbortController()
    controllerRef.current = controller
    setStatus(UploadStatus.Uploading)
    setProgress(0)
    setErrorMsg('')
    setResult(null)

    void uploadImage(file, controller.signal, (loaded, total) => {
      setProgress(Math.round((loaded / total) * 100))
    })
      .then(res => {
        // Swap local preview for the remote URL if available
        if (res.url) {
          revokePreview()
          setPreviewUrl(res.url)
        }
        setStatus(UploadStatus.Done)
        setResult(res)
        onSuccess?.(res)
      })
      .catch(err => {
        if (controller.signal.aborted) return
        setStatus(UploadStatus.Error)
        setErrorMsg(err instanceof Error ? err.message : 'Upload thất bại. Vui lòng thử lại.')
      })
  }

  function handleRemove() {
    controllerRef.current?.abort()
    revokePreview()
    setPreviewUrl(undefined)
    setStatus(UploadStatus.Idle)
    setProgress(0)
    setErrorMsg('')
    if (result) {
      onRemove?.(result)
      setResult(null)
    }
  }

  function handlePreview() {
    const url = result?.url ?? previewUrl
    if (url) window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <Upload
      accept="image/*"
      showUploadList={false}
      disabled={disabled || status === UploadStatus.Uploading}
      beforeUpload={file => {
        handleFile(file)
        return false
      }}
    >
      <MediaCard
        status={status}
        progress={progress}
        mediaType="image"
        previewUrl={previewUrl}
        size={size}
        onRemove={handleRemove}
        onPreview={status === UploadStatus.Done ? handlePreview : undefined}
        errorMsg={errorMsg}
      />
    </Upload>
  )
}
