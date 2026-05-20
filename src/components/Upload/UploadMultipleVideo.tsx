import { InboxOutlined } from '@ant-design/icons'
import { Upload } from 'antd'
import { useState } from 'react'
import { MediaCard } from './MediaCard'
import { UploadSingleVideo } from './UploadSingleVideo'
import { UploadStatus } from './types'
import { makeUid } from './utils'

// ─── Public types ─────────────────────────────────────────────────────────────

export interface UploadMultipleVideoProps {
  onChange?: (videoIds: string[]) => void
  maxCount?: number
  multipartThresholdMB?: number
  maxConcurrent?: number
  disabled?: boolean
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface VideoEntry {
  key: string
  videoId: string | null
}

// ─── Component ────────────────────────────────────────────────────────────────

export function UploadMultipleVideo({
  onChange,
  maxCount,
  multipartThresholdMB,
  maxConcurrent,
  disabled = false,
}: UploadMultipleVideoProps) {
  const [entries, setEntries] = useState<VideoEntry[]>([])

  function handleVideoReady(key: string, videoId: string) {
    setEntries(prev => {
      const next = prev.map(e => (e.key === key ? { ...e, videoId } : e))
      onChange?.(next.flatMap(e => (e.videoId ? [e.videoId] : [])))
      return next
    })
  }

  function addEntry() {
    setEntries(prev => [...prev, { key: makeUid(), videoId: null }])
  }

  const isMaxReached = maxCount !== undefined && entries.length >= maxCount

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* ── Video grid ── */}
      {entries.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {entries.map(entry => (
            <div key={entry.key} className="flex flex-col gap-2">
              <UploadSingleVideo
                onVideoReady={videoId => handleVideoReady(entry.key, videoId)}
                multipartThresholdMB={multipartThresholdMB}
                maxConcurrent={maxConcurrent}
              />
            </div>
          ))}

          {/* Add more tile */}
          {!isMaxReached && !disabled && (
            <div
              className="upload-media-card upload-media-card--sm flex items-center justify-center cursor-pointer"
              onClick={addEntry}
            >
              <div className="flex flex-col items-center gap-1 text-gray-400">
                <InboxOutlined style={{ fontSize: 20 }} />
                <span className="text-xs text-center px-2">Thêm video</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Empty state: show add tile ── */}
      {entries.length === 0 && (
        <Upload
          accept="video/*"
          showUploadList={false}
          disabled={disabled}
          beforeUpload={() => {
            addEntry()
            return false
          }}
        >
          <MediaCard status={UploadStatus.Idle} progress={0} mediaType="video" size="sm" />
        </Upload>
      )}
    </div>
  )
}
