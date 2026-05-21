import {
  CheckCircleOutlined,
  CloseOutlined,
  DownloadOutlined,
  ExclamationCircleOutlined,
  InboxOutlined,
  LoadingOutlined,
} from '@ant-design/icons'
import { Button, Image, Upload } from 'antd'
import cx from 'classnames'
import type { CSSProperties, ReactNode } from 'react'
import { useRef, useState } from 'react'
import type { ExistingFileData, FileItemRenderProps, FileUploadItem, UploadFileFn } from '../types'
import { FileItemStatus } from '../types'
import { formatBytes, getFileIconInfo, makeUid } from '../utils'
import '../upload.css'

export type { UploadFileFn, FileUploadItem, FileItemRenderProps }

// ─── Props ────────────────────────────────────────────────────────────────────

export interface UploadMultipleFileProps<TResult = unknown> {
  uploadFn: UploadFileFn<TResult>
  onChange?: (results: TResult[]) => void
  renderFileItem?: (props: FileItemRenderProps<TResult>) => ReactNode
  /** Derive download URL from a completed item's result */
  downloadUrl?: (result: TResult) => string | undefined
  accept?: string
  maxSizeMB?: number
  maxCount?: number
  disabled?: boolean
  hint?: string
  /** Style applied to the items list container */
  itemsContainerStyle?: CSSProperties
  itemsContainerClassName?: string
  /**
   * Pre-existing files to display before any new uploads.
   * Useful for Update forms that already have files saved.
   */
  existingFiles?: ExistingFileData[]
  /** Called when the user removes one of the existing files */
  onRemoveExisting?: (file: ExistingFileData) => void
}

// ─── Default file item ────────────────────────────────────────────────────────

function DefaultFileItem<TResult>({
  item,
  onRemove,
  downloadUrl,
}: FileItemRenderProps<TResult> & { downloadUrl?: (result: TResult) => string | undefined }) {
  const url =
    item.status === FileItemStatus.Done && item.result !== undefined
      ? downloadUrl?.(item.result)
      : undefined

  return (
    <div
      className={cx('upload-file-item', {
        'upload-file-item--error': item.status === FileItemStatus.Error,
      })}
    >
      {/* Status icon */}
      <div className="shrink-0 w-4 flex justify-center">
        {item.status === FileItemStatus.Uploading && (
          <LoadingOutlined className="text-primary text-sm" spin />
        )}
        {item.status === FileItemStatus.Done && (
          <CheckCircleOutlined className="text-success text-sm" />
        )}
        {item.status === FileItemStatus.Error && (
          <ExclamationCircleOutlined className="text-danger text-sm" />
        )}
      </div>

      {/* File info */}
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-gray-900 truncate block">{item.file.name}</span>

        {item.status === FileItemStatus.Uploading && (
          <div className="flex items-center gap-2 mt-1">
            <div className="upload-progress-track flex-1">
              <div className="upload-progress-fill" style={{ width: `${item.progress}%` }} />
            </div>
            <span className="text-xs text-gray-400 shrink-0">{item.progress}%</span>
          </div>
        )}

        {item.status === FileItemStatus.Done && (
          <span className="text-xs text-gray-400">{formatBytes(item.file.size)}</span>
        )}

        {item.status === FileItemStatus.Error && (
          <span className="text-xs text-danger">{item.error}</span>
        )}
      </div>

      {/* Download — done only */}
      {url && (
        <a href={url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
          <Button
            type="text"
            size="small"
            icon={<DownloadOutlined />}
            className="shrink-0 text-gray-400"
          />
        </a>
      )}

      {/* Remove / cancel */}
      <Button
        type="text"
        size="small"
        icon={<CloseOutlined style={{ fontSize: 11 }} />}
        onClick={onRemove}
        className="shrink-0 text-gray-400"
      />
    </div>
  )
}

// ─── Existing file item row ───────────────────────────────────────────────────

function ExistingFileItem({ file, onRemove }: { file: ExistingFileData; onRemove: () => void }) {
  if (file.type === 'image') {
    return (
      <div className="relative shrink-0 w-24 h-24 rounded-lg overflow-hidden border border-gray-200">
        <Image
          src={file.url}
          alt={file.name}
          className="w-full h-full object-cover"
          preview
          fallback="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
        />
        <Button
          type="text"
          size="small"
          icon={<CloseOutlined style={{ fontSize: 10, color: '#fff' }} />}
          onClick={onRemove}
          style={{
            position: 'absolute',
            top: 4,
            right: 4,
            background: 'rgba(0,0,0,0.55)',
            borderRadius: '50%',
            width: 20,
            height: 20,
            minWidth: 'unset',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
          }}
        />
      </div>
    )
  }

  if (file.type === 'video') {
    return (
      <div className="relative shrink-0 w-40 rounded-lg overflow-hidden border border-gray-200 bg-black">
        <video src={file.url} controls className="w-full max-h-24 block" />
        <Button
          type="text"
          size="small"
          icon={<CloseOutlined style={{ fontSize: 10, color: '#fff' }} />}
          onClick={onRemove}
          style={{
            position: 'absolute',
            top: 4,
            right: 4,
            background: 'rgba(0,0,0,0.55)',
            borderRadius: 4,
            border: 'none',
          }}
        />
      </div>
    )
  }

  // document — vertical list item
  const { Icon, colorClass, label } = getFileIconInfo(file.name)
  return (
    <div className="upload-file-item">
      <Icon style={{ fontSize: 20 }} className={`shrink-0 ${colorClass}`} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900 truncate">{file.name}</div>
        <div className="text-xs text-gray-400">{label}</div>
      </div>
      <a href={file.url} target="_blank" rel="noopener noreferrer">
        <Button
          type="text"
          size="small"
          icon={<DownloadOutlined />}
          className="shrink-0 text-gray-400"
        />
      </a>
      <Button
        type="text"
        size="small"
        icon={<CloseOutlined style={{ fontSize: 11 }} />}
        onClick={onRemove}
        className="shrink-0 text-gray-400"
      />
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function UploadMultipleFile<TResult>({
  uploadFn,
  onChange,
  renderFileItem,
  downloadUrl,
  accept,
  maxSizeMB,
  maxCount,
  disabled = false,
  hint,
  itemsContainerStyle,
  itemsContainerClassName,
  existingFiles,
  onRemoveExisting,
}: UploadMultipleFileProps<TResult>) {
  const [items, setItems] = useState<FileUploadItem<TResult>[]>([])
  const controllersRef = useRef<Map<string, AbortController>>(new Map())

  function notifyChange(current: FileUploadItem<TResult>[]) {
    const results = current
      .filter(it => it.status === FileItemStatus.Done && it.result !== undefined)
      .map(it => it.result!)
    onChange?.(results)
  }

  function updateItem(uid: string, patch: Partial<FileUploadItem<TResult>>) {
    setItems(prev => {
      const next = prev.map(it => (it.uid === uid ? { ...it, ...patch } : it))
      notifyChange(next)
      return next
    })
  }

  function handleFile(incoming: File) {
    setItems(prev => {
      if (maxCount !== undefined && prev.length >= maxCount) return prev

      if (maxSizeMB && incoming.size > maxSizeMB * 1048576) {
        return [
          ...prev,
          {
            uid: makeUid(),
            file: incoming,
            status: FileItemStatus.Error,
            progress: 0,
            error: `File không được vượt quá ${maxSizeMB} MB`,
          },
        ]
      }

      const uid = makeUid()
      const controller = new AbortController()

      queueMicrotask(() => {
        controllersRef.current.set(uid, controller)

        void uploadFn(incoming, controller.signal, (loaded, total) => {
          updateItem(uid, { progress: Math.round((loaded / total) * 100) })
        })
          .then(result => {
            controllersRef.current.delete(uid)
            updateItem(uid, { status: FileItemStatus.Done, progress: 100, result })
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

      return [...prev, { uid, file: incoming, status: FileItemStatus.Uploading, progress: 0 }]
    })
  }

  function removeItem(uid: string) {
    controllersRef.current.get(uid)?.abort()
    controllersRef.current.delete(uid)
    setItems(prev => {
      const next = prev.filter(it => it.uid !== uid)
      notifyChange(next)
      return next
    })
  }

  const isMaxReached = maxCount !== undefined && items.length >= maxCount

  const renderItem =
    renderFileItem ??
    ((props: FileItemRenderProps<TResult>) => (
      <DefaultFileItem {...props} downloadUrl={downloadUrl} />
    ))

  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Dragger — always visible unless max reached */}
      {!isMaxReached && (
        <Upload.Dragger
          accept={accept}
          multiple
          showUploadList={false}
          disabled={disabled}
          customRequest={({ file, onSuccess, onError }) => {
            try {
              handleFile(file as File)
              onSuccess?.({})
            } catch (err) {
              onError?.(err as Error)
            }
          }}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">Kéo thả file vào đây hoặc bấm để chọn</p>
          {hint && <p className="ant-upload-hint">{hint}</p>}
        </Upload.Dragger>
      )}

      {/* Existing files — images/videos horizontal, documents vertical */}
      {existingFiles && existingFiles.length > 0 && (
        <div
          className={cx(
            'gap-2',
            existingFiles[0].type === 'document' ? 'flex flex-col' : 'flex flex-row flex-wrap',
          )}
        >
          {existingFiles.map(f => (
            <ExistingFileItem key={f.url} file={f} onRemove={() => onRemoveExisting?.(f)} />
          ))}
        </div>
      )}

      {/* File list */}
      {items.length > 0 && (
        <div
          style={itemsContainerStyle}
          className={cx('flex flex-col gap-1.5', itemsContainerClassName)}
        >
          {/* eslint-disable-next-line react-hooks/refs -- removeItem only accesses the ref inside the event callback, not during render */}
          {items.map(item => renderItem({ item, onRemove: () => removeItem(item.uid) }))}
        </div>
      )}
    </div>
  )
}
