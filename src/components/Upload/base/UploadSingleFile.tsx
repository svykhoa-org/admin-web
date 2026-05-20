import {
  CheckCircleOutlined,
  CloseOutlined,
  DownloadOutlined,
  ExclamationCircleOutlined,
  InboxOutlined,
  LoadingOutlined,
  StopOutlined,
} from '@ant-design/icons'
import { Button, Upload } from 'antd'
import cx from 'classnames'
import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import type { UploadFileFn } from '../types'
import { UploadStatus } from '../types'
import { formatBytes } from '../utils'
import '../upload.css'

export type { UploadFileFn }

// ─── Props ────────────────────────────────────────────────────────────────────

export interface UploadSingleFileProps<TResult = unknown> {
  uploadFn: UploadFileFn<TResult>
  onSuccess?: (result: TResult) => void
  /**
   * Custom done UI.
   * Receives: result, file, onReset handler, previewUrl (local object URL).
   * Overrides the default file row.
   */
  renderSuccess?: (
    result: TResult,
    file: File,
    onReset: () => void,
    previewUrl: string | undefined,
  ) => ReactNode
  /** Called when the user removes the uploaded file (resets to idle) */
  onRemove?: (result: TResult) => void
  /**
   * Fires whenever the local preview URL changes.
   * Receives the object URL when a file is selected, undefined when reset.
   * Useful for showing a thumbnail preview during upload in parent components.
   */
  onPreviewUrl?: (url: string | undefined) => void
  /** URL to download the file — shown as a button in done state */
  downloadUrl?: (result: TResult) => string | undefined
  accept?: string
  maxSizeMB?: number
  disabled?: boolean
  placeholder?: string
  hint?: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export function UploadSingleFile<TResult>({
  uploadFn,
  onSuccess,
  renderSuccess,
  onRemove,
  onPreviewUrl,
  downloadUrl,
  accept,
  maxSizeMB,
  disabled = false,
  placeholder = 'Kéo thả file vào đây hoặc bấm để chọn',
  hint,
}: UploadSingleFileProps<TResult>) {
  const [status, setStatus] = useState<UploadStatus>(UploadStatus.Idle)
  const [progress, setProgress] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')
  const [result, setResult] = useState<TResult | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | undefined>()
  const controllerRef = useRef<AbortController | null>(null)

  // Revoke old object URLs when previewUrl changes or on unmount
  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  function createPreviewUrl(incoming: File): void {
    const url = URL.createObjectURL(incoming)
    // useEffect cleanup will revoke the previous URL
    setPreviewUrl(url)
    onPreviewUrl?.(url)
  }

  function clearPreviewUrl() {
    // useEffect cleanup will revoke the current URL
    setPreviewUrl(undefined)
    onPreviewUrl?.(undefined)
  }

  function handleFile(incoming: File) {
    if (maxSizeMB && incoming.size > maxSizeMB * 1048576) {
      setStatus(UploadStatus.Error)
      setErrorMsg(`File không được vượt quá ${maxSizeMB} MB`)
      return
    }

    createPreviewUrl(incoming)

    const controller = new AbortController()
    controllerRef.current = controller
    setFile(incoming)
    setStatus(UploadStatus.Uploading)
    setProgress(0)
    setErrorMsg('')
    setResult(null)

    void uploadFn(incoming, controller.signal, (loaded, total) => {
      setProgress(Math.round((loaded / total) * 100))
    })
      .then(res => {
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

  function handleCancel() {
    controllerRef.current?.abort()
    setStatus(UploadStatus.Cancelled)
  }

  function handleReset() {
    if (status === UploadStatus.Done && result !== null) {
      onRemove?.(result)
    }
    clearPreviewUrl()
    setStatus(UploadStatus.Idle)
    setResult(null)
    setFile(null)
    setProgress(0)
    setErrorMsg('')
  }

  const showDropzone =
    status === UploadStatus.Idle ||
    status === UploadStatus.Error ||
    status === UploadStatus.Cancelled

  return (
    <div className="flex flex-col gap-2 w-full">
      {/* ── Dropzone (hidden when uploading or done) ── */}
      {showDropzone && (
        <Upload.Dragger
          accept={accept}
          multiple={false}
          maxCount={1}
          showUploadList={false}
          disabled={disabled}
          beforeUpload={incoming => {
            handleFile(incoming)
            return false
          }}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">{placeholder}</p>
          {hint && <p className="ant-upload-hint">{hint}</p>}
        </Upload.Dragger>
      )}

      {/* ── Uploading row ── */}
      {status === UploadStatus.Uploading && (
        <div className="upload-file-item">
          {/* Thumbnail if available, otherwise spinner */}
          {previewUrl ? (
            <div className="shrink-0 relative w-9 h-9 rounded overflow-hidden border border-gray-200 bg-gray-100">
              <img src={previewUrl} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <LoadingOutlined style={{ fontSize: 12, color: '#fff' }} spin />
              </div>
            </div>
          ) : (
            <LoadingOutlined className="text-primary shrink-0 text-base" spin />
          )}

          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-baseline mb-1.5">
              <span className="text-sm font-medium text-gray-900 truncate">{file?.name}</span>
              <span className="text-xs text-gray-400 shrink-0 ml-3">{progress}%</span>
            </div>
            <div className="upload-progress-track">
              <div className="upload-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            {file && file.size > 0 && (
              <span className="text-xs text-gray-400 mt-1 block">{formatBytes(file.size)}</span>
            )}
          </div>

          <Button
            type="text"
            size="small"
            icon={<StopOutlined />}
            onClick={handleCancel}
            className="shrink-0 text-gray-400"
          />
        </div>
      )}

      {/* ── Done row ── */}
      {status === UploadStatus.Done &&
        result !== null &&
        file &&
        (renderSuccess ? (
          renderSuccess(result, file, handleReset, previewUrl)
        ) : (
          <div className="upload-file-item">
            {/* Thumbnail if available, otherwise success icon */}
            {previewUrl ? (
              <div className="shrink-0 w-9 h-9 rounded overflow-hidden border border-gray-200">
                <img src={previewUrl} alt="" className="w-full h-full object-cover" />
              </div>
            ) : (
              <CheckCircleOutlined className="text-success shrink-0 text-base" />
            )}

            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-gray-900 truncate block">{file.name}</span>
              <span className="text-xs text-gray-400">{formatBytes(file.size)}</span>
            </div>

            {downloadUrl?.(result) && (
              <a
                href={downloadUrl(result)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
              >
                <Button
                  type="text"
                  size="small"
                  icon={<DownloadOutlined />}
                  className="shrink-0 text-gray-400"
                />
              </a>
            )}

            <Button
              type="text"
              size="small"
              icon={<CloseOutlined />}
              onClick={handleReset}
              className="shrink-0 text-gray-400"
            />
          </div>
        ))}

      {/* ── Error ── */}
      {status === UploadStatus.Error && errorMsg && (
        <div className={cx('upload-file-item upload-file-item--error', 'items-start gap-2')}>
          <ExclamationCircleOutlined className="text-danger shrink-0 mt-0.5" />
          <span className="text-sm text-danger">{errorMsg}</span>
        </div>
      )}

      {/* ── Cancelled ── */}
      {status === UploadStatus.Cancelled && (
        <span className="text-xs text-gray-400 px-1">
          Upload đã bị hủy — kéo thả hoặc bấm để thử lại.
        </span>
      )}
    </div>
  )
}
