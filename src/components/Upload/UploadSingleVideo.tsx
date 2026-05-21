import { hasResumeSession, useUploadStore, UPLOAD_SESSION_PREFIX } from '@/store/uploadStore'
import { getAssetAccessUrl } from '@/services/Asset'
import { CloseOutlined, WarningOutlined } from '@ant-design/icons'
import { Alert, Button, Modal, Upload } from 'antd'
import { useEffect, useRef, useState } from 'react'
import { MediaCard } from './MediaCard'
import { UploadStatus } from './types'

// ─── Props ────────────────────────────────────────────────────────────────────

export interface UploadSingleVideoProps {
  existingVideoId?: string
  /**
   * Pre-existing video to show as an inline player without re-uploading.
   * Used when you already have a direct URL (not an asset ID).
   * If both existingVideoId and existingFile are provided, existingVideoId takes precedence.
   */
  existingFile?: { url: string; name: string }
  /** Displayed in the upload tray — use the lesson title for context */
  label?: string
  onVideoReady: (videoId: string) => void
  /** Called when the user confirms removing the current video */
  onVideoRemoved?: () => void
  multipartThresholdMB?: number
  maxConcurrent?: number
  /**
   * When true (default), hide the upload zone while a video is loaded.
   * Set false to keep the upload zone visible alongside the player (allows replacement).
   */
  hideUploadOnFilled?: boolean
}

// ─── Component ────────────────────────────────────────────────────────────────

export function UploadSingleVideo({
  existingVideoId,
  existingFile,
  label,
  onVideoReady,
  onVideoRemoved,
  multipartThresholdMB = 50,
  maxConcurrent = 3,
  hideUploadOnFilled = true,
}: UploadSingleVideoProps) {
  const [taskId, setTaskId] = useState<string | null>(null)
  const [resumeBannerFile, setResumeBannerFile] = useState<File | null>(null)
  // Initialize from existingFile.url when no asset-ID fetch is needed
  const [previewUrl, setPreviewUrl] = useState<string | null>(() =>
    existingFile?.url && !existingVideoId ? existingFile.url : null,
  )

  // Track whether the user explicitly removed the video in this session
  // so auto-preview doesn't re-trigger after removal
  const removedRef = useRef(false)

  const enqueue = useUploadStore(s => s.enqueue)
  const cancel = useUploadStore(s => s.cancel)
  const retry = useUploadStore(s => s.retry)
  const task = useUploadStore(s => (taskId ? s.tasks[taskId] : null))

  // Map store status → UploadStatus enum for MediaCard
  const status: UploadStatus = !task
    ? UploadStatus.Idle
    : task.status === 'uploading'
      ? UploadStatus.Uploading
      : task.status === 'confirming'
        ? UploadStatus.Confirming
        : task.status === 'done'
          ? UploadStatus.Done
          : task.status === 'cancelled'
            ? UploadStatus.Cancelled
            : UploadStatus.Error

  const isUploading = status === UploadStatus.Uploading || status === UploadStatus.Confirming

  // ── Auto-preview ───────────────────────────────────────────────────────────

  // Auto-load preview for existing video (asset ID path)
  useEffect(() => {
    if (!existingVideoId || removedRef.current) return
    let cancelled = false
    getAssetAccessUrl(existingVideoId)
      .then(url => {
        if (!cancelled) setPreviewUrl(url)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [existingVideoId])

  // Auto-load preview after successful upload
  const doneAssetId = status === UploadStatus.Done ? task?.assetId : undefined
  useEffect(() => {
    if (!doneAssetId || removedRef.current) return
    let cancelled = false
    getAssetAccessUrl(doneAssetId)
      .then(url => {
        if (!cancelled) setPreviewUrl(url)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [doneAssetId])

  // ── Handlers ──────────────────────────────────────────────────────────────

  function handleConfirmRemove() {
    Modal.confirm({
      title: 'Xoá video',
      content: 'Bạn có chắc muốn xoá video không?',
      okText: 'Xoá',
      okType: 'danger',
      cancelText: 'Huỷ',
      onOk() {
        removedRef.current = true
        setPreviewUrl(null)
        setTaskId(null)
        onVideoRemoved?.()
      },
    })
  }

  function startEnqueue(file: File, isResume: boolean) {
    const id = enqueue(file, {
      label: label ?? file.name,
      isResume,
      multipartThresholdMB,
      maxConcurrent,
      onVideoReady,
    })
    removedRef.current = false
    setTaskId(id)
  }

  function handleFileSelected(file: File) {
    if (file.size >= multipartThresholdMB * 1048576 && hasResumeSession(file)) {
      setResumeBannerFile(file)
      return
    }
    startEnqueue(file, false)
  }

  function handleResume() {
    if (!resumeBannerFile) return
    const file = resumeBannerFile
    setResumeBannerFile(null)
    startEnqueue(file, true)
  }

  function handleDiscardResume() {
    if (!resumeBannerFile) return
    const key =
      UPLOAD_SESSION_PREFIX +
      encodeURIComponent(`${resumeBannerFile.name}::${resumeBannerFile.size}`)
    localStorage.removeItem(key)
    const file = resumeBannerFile
    setResumeBannerFile(null)
    startEnqueue(file, false)
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const showUploadZone = !previewUrl || !hideUploadOnFilled

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* ── Inline video player (when preview is available) ── */}
      {previewUrl && (
        <div className="relative rounded-lg overflow-hidden border border-gray-200 bg-black">
          <video src={previewUrl} controls className="w-full max-h-72 block" />
          <Button
            type="text"
            size="small"
            icon={<CloseOutlined style={{ color: '#fff', fontSize: 13 }} />}
            onClick={handleConfirmRemove}
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              background: 'rgba(0,0,0,0.5)',
              borderRadius: 4,
            }}
          />
        </div>
      )}

      {/* ── Upload zone (hidden when hideUploadOnFilled=true and video is loaded) ── */}
      {showUploadZone && (
        <>
          {/* ── Resume banner ── */}
          {resumeBannerFile && (
            <Alert
              type="warning"
              showIcon
              icon={<WarningOutlined />}
              description={`"${resumeBannerFile.name}" đã được upload một phần. Tiếp tục hay bắt đầu mới?`}
              action={
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button size="small" type="primary" onClick={handleResume}>
                    Tiếp tục
                  </Button>
                  <Button size="small" onClick={handleDiscardResume}>
                    Bắt đầu mới
                  </Button>
                </div>
              }
            />
          )}

          {/* ── Media card + file picker ── */}
          <Upload
            accept="video/*"
            showUploadList={false}
            disabled={isUploading}
            beforeUpload={file => {
              handleFileSelected(file)
              return false
            }}
          >
            <MediaCard
              status={status}
              progress={task?.progress ?? 0}
              mediaType="video"
              onRemove={isUploading ? () => taskId && void cancel(taskId) : undefined}
              errorMsg={task?.errorMsg}
            />
          </Upload>

          {/* ── Error with retry ── */}
          {status === UploadStatus.Error && task?.errorMsg && (
            <Alert
              type="error"
              showIcon
              description={task.errorMsg}
              action={
                task.failedPartsCount > 0 ? (
                  <Button size="small" onClick={() => taskId && void retry(taskId)}>
                    Retry
                  </Button>
                ) : undefined
              }
            />
          )}
        </>
      )}
    </div>
  )
}
