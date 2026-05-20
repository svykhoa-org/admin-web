import { hasResumeSession, useUploadStore, UPLOAD_SESSION_PREFIX } from '@/store/uploadStore'
import { WarningOutlined } from '@ant-design/icons'
import { Alert, Button, Space, Upload } from 'antd'
import { useState } from 'react'
import { MediaCard } from './MediaCard'
import { UploadStatus } from './types'
import { formatBytes } from './utils'

// ─── Props ────────────────────────────────────────────────────────────────────

export interface UploadSingleVideoProps {
  existingVideoId?: string
  /** Displayed in the upload tray — use the lesson title for context */
  label?: string
  onVideoReady: (videoId: string) => void
  multipartThresholdMB?: number
  maxConcurrent?: number
}

// ─── Component ────────────────────────────────────────────────────────────────

export function UploadSingleVideo({
  existingVideoId,
  label,
  onVideoReady,
  multipartThresholdMB = 50,
  maxConcurrent = 3,
}: UploadSingleVideoProps) {
  const [taskId, setTaskId] = useState<string | null>(null)
  const [resumeBannerFile, setResumeBannerFile] = useState<File | null>(null)

  const enqueue = useUploadStore(s => s.enqueue)
  const cancel = useUploadStore(s => s.cancel)
  const retry = useUploadStore(s => s.retry)
  const task = useUploadStore(s => (taskId ? s.tasks[taskId] : null))

  function startEnqueue(file: File, isResume: boolean) {
    const id = enqueue(file, {
      label: label ?? file.name,
      isResume,
      multipartThresholdMB,
      maxConcurrent,
      onVideoReady,
    })
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

  return (
    <Space direction="vertical" size={12} style={{ width: '100%' }}>
      {/* ── Resume banner ── */}
      {resumeBannerFile && (
        <Alert
          type="warning"
          showIcon
          icon={<WarningOutlined />}
          message="Phát hiện session upload chưa hoàn thành"
          description={`"${resumeBannerFile.name}" đã được upload một phần. Tiếp tục hay bắt đầu mới?`}
          action={
            <Space>
              <Button size="small" type="primary" onClick={handleResume}>
                Tiếp tục
              </Button>
              <Button size="small" onClick={handleDiscardResume}>
                Bắt đầu mới
              </Button>
            </Space>
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
          doneContent={
            task?.assetId ? (
              <span className="break-all px-4 text-center text-xs text-white opacity-80">
                ID: {task.assetId}
              </span>
            ) : undefined
          }
        />
      </Upload>

      {/* ── Upload stats (multipart) ── */}
      {isUploading && task?.isMultipart && (
        <div className="flex flex-wrap gap-4 text-xs text-gray-500">
          <span>
            Parts:{' '}
            <strong className="text-gray-700">
              {task.completedParts}/{task.totalParts}
            </strong>
          </span>
          <span>
            Tốc độ: <strong className="text-gray-700">{task.speedText}</strong>
          </span>
          <span>
            Còn lại: <strong className="text-gray-700">{task.etaText}</strong>
          </span>
          <span className="text-primary font-medium">Đang chạy nền</span>
        </div>
      )}

      {/* ── Upload stats (single) ── */}
      {isUploading && !task?.isMultipart && task?.filename && (
        <div className="truncate text-xs text-gray-500">
          {task.filename} · {formatBytes(task.fileSize)}
        </div>
      )}

      {/* ── Error with retry ── */}
      {status === UploadStatus.Error && task?.errorMsg && (
        <Alert
          type="error"
          showIcon
          message={task.errorMsg}
          action={
            task.failedPartsCount > 0 ? (
              <Button size="small" onClick={() => taskId && void retry(taskId)}>
                Retry
              </Button>
            ) : undefined
          }
        />
      )}

      {/* ── Existing video info (idle state only) ── */}
      {existingVideoId && status === UploadStatus.Idle && (
        <div className="text-xs text-gray-500">
          Video hiện tại:{' '}
          <code className="rounded bg-gray-100 px-1 text-gray-700">{existingVideoId}</code>
        </div>
      )}
    </Space>
  )
}
