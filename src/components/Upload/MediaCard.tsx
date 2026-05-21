import { CloseOutlined, EyeOutlined, PictureOutlined, VideoCameraOutlined } from '@ant-design/icons'
import { Button, Progress } from 'antd'
import cx from 'classnames'
import type { ReactNode } from 'react'
import { UploadStatus } from './types'
import './upload.css'

// ─── Props ────────────────────────────────────────────────────────────────────

export type MediaType = 'image' | 'video'
export type MediaCardSize = 'full' | 'sm'

export interface MediaCardProps {
  status: UploadStatus
  progress: number
  mediaType: MediaType
  /** Local object URL or remote URL to display as preview */
  previewUrl?: string
  /** File name — shown as alt text and tooltip */
  fileName?: string
  /** Card size: full = 400px, sm = 140px */
  size?: MediaCardSize
  /** Called when X button is clicked (cancel or remove) */
  onRemove?: () => void
  /** Called when the eye icon is clicked in done state */
  onPreview?: () => void
  /** Extra content shown in the overlay when status is done (e.g. video ID) */
  doneContent?: ReactNode
  /** Error message shown when status is error */
  errorMsg?: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MediaCard({
  status,
  progress,
  mediaType,
  previewUrl,
  fileName,
  size = 'full',
  onRemove,
  onPreview,
  doneContent,
  errorMsg,
}: MediaCardProps) {
  const isUploading = status === UploadStatus.Uploading || status === UploadStatus.Confirming
  const isDone = status === UploadStatus.Done
  const isError = status === UploadStatus.Error
  const isIdle = status === UploadStatus.Idle || status === UploadStatus.Cancelled

  const PlaceholderIcon = mediaType === 'image' ? PictureOutlined : VideoCameraOutlined

  return (
    <div className={cx('upload-media-card', { 'upload-media-card--sm': size === 'sm' })}>
      {/* ── Preview image ── */}
      {previewUrl && (
        <img
          src={previewUrl}
          alt={fileName ?? ''}
          className={cx('upload-media-card__preview', {
            'upload-media-card__preview--uploading': isUploading,
          })}
        />
      )}

      {/* ── Idle / no preview placeholder ── */}
      {isIdle && !previewUrl && (
        <div className="upload-media-card__overlay text-gray-400">
          <PlaceholderIcon style={{ fontSize: size === 'full' ? 40 : 24 }} />
          {size === 'full' && (
            <span className="text-xs text-gray-400 text-center px-4">
              Bấm để chọn {mediaType === 'image' ? 'ảnh' : 'video'}
            </span>
          )}
        </div>
      )}

      {/* ── Uploading: circular progress ── */}
      {isUploading && (
        <div className="upload-media-card__overlay">
          <Progress
            type="circle"
            percent={Math.round(progress)}
            size={size === 'full' ? 80 : 50}
            strokeColor="var(--color-primary)"
            trailColor="rgba(255,255,255,0.3)"
            format={pct => (
              <span
                className={cx('font-medium text-gray-900', size === 'full' ? 'text-sm' : 'text-xs')}
              >
                {pct}%
              </span>
            )}
          />
          {status === UploadStatus.Confirming && size === 'full' && (
            <span className="text-xs text-white opacity-80">Đang xác nhận...</span>
          )}
        </div>
      )}

      {/* ── Error overlay ── */}
      {isError && (
        <div className="upload-media-card__overlay px-4 text-center">
          <span className="text-danger text-xs">{errorMsg ?? 'Upload thất bại'}</span>
        </div>
      )}

      {/* ── Done: hover overlay with eye & extra content ── */}
      {isDone && (
        <>
          {doneContent && (
            <div className="upload-media-card__overlay pointer-events-none">{doneContent}</div>
          )}
          {onPreview && (
            <div className="upload-media-card__hover-overlay">
              <Button
                type="text"
                icon={
                  <EyeOutlined style={{ fontSize: size === 'full' ? 28 : 18, color: '#fff' }} />
                }
                onClick={onPreview}
                style={{ background: 'none', border: 'none', boxShadow: 'none' }}
              />
            </div>
          )}
        </>
      )}

      {/* ── Close / cancel button ── */}
      {onRemove && (
        <Button
          type="text"
          size="small"
          icon={<CloseOutlined style={{ fontSize: 11 }} />}
          onClick={e => {
            e.stopPropagation()
            onRemove()
          }}
          className="upload-media-card__close-btn"
        />
      )}
    </div>
  )
}
