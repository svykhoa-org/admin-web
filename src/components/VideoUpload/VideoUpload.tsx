import ENV from '@/constants/env'
import {
  confirmVideoUpload,
  multipartAbort,
  multipartComplete,
  multipartInit,
  multipartListParts,
  multipartRefreshUrls,
  requestVideoUpload,
} from '@/services/Video'
import type { MultipartInitOutput, MultipartPartInfo } from '@/services/Video'
import { isApiResponseError } from '@/utils/apiResponse'
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  InboxOutlined,
  LoadingOutlined,
  ReloadOutlined,
  StopOutlined,
  VideoCameraOutlined,
  WarningOutlined,
} from '@ant-design/icons'
import { Alert, App, Button, Progress, Space, Typography, Upload } from 'antd'
import axios from 'axios'
import { useRef, useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VideoUploadProps {
  existingVideoId?: string
  onVideoReady: (videoId: string) => void
  /** File size threshold to switch from single to multipart upload. Default: 50 MB */
  multipartThresholdMB?: number
  /** Max concurrent part uploads (multipart only). Default: 3 */
  maxConcurrent?: number
}

type UploadStatus = 'idle' | 'uploading' | 'confirming' | 'done' | 'error' | 'cancelled'
type PartStatus = 'pending' | 'uploading' | 'done' | 'failed' | 'resumed'

interface MultipartSession extends MultipartInitOutput {
  completedParts: { partNumber: number; etag: string }[]
  initiatedAt: number
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SESSION_PREFIX = 'mpu_video_'
const MAX_RETRIES = 3
const RETRY_BASE_MS = 1000
// Refresh presigned URLs if 90% of their 6h TTL has elapsed
const URL_REFRESH_THRESHOLD_SECS = 6 * 3600 * 0.9

const PART_DOT_COLORS: Record<PartStatus, string> = {
  pending: '#e5e7eb',
  uploading: '#818cf8',
  done: '#34d399',
  failed: '#f87171',
  resumed: '#fbbf24',
}

const PART_STATUS_LABELS: Record<PartStatus, string> = {
  pending: 'Chờ',
  uploading: 'Upload',
  done: 'Xong',
  failed: 'Lỗi',
  resumed: 'Resume',
}

// ─── Session helpers ──────────────────────────────────────────────────────────

function sessionKey(file: File) {
  return SESSION_PREFIX + encodeURIComponent(`${file.name}::${file.size}`)
}

function saveSession(file: File, session: MultipartSession) {
  localStorage.setItem(sessionKey(file), JSON.stringify(session))
}

function loadSession(file: File): MultipartSession | null {
  try {
    return JSON.parse(localStorage.getItem(sessionKey(file)) ?? 'null') as MultipartSession | null
  } catch {
    return null
  }
}

function clearSession(file: File) {
  localStorage.removeItem(sessionKey(file))
}

// ─── Format helpers ───────────────────────────────────────────────────────────

function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`
  if (b < 1073741824) return `${(b / 1048576).toFixed(1)} MB`
  return `${(b / 1073741824).toFixed(2)} GB`
}

function formatEta(secs: number): string {
  if (!isFinite(secs) || secs < 0) return '—'
  if (secs < 60) return `${Math.round(secs)}s`
  if (secs < 3600) return `${Math.floor(secs / 60)}m ${Math.round(secs % 60)}s`
  return `${Math.floor(secs / 3600)}h ${Math.floor((secs % 3600) / 60)}m`
}

function sleep(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms))
}

// ─── Component ────────────────────────────────────────────────────────────────

export function VideoUpload({
  existingVideoId,
  onVideoReady,
  multipartThresholdMB = 50,
  maxConcurrent = 3,
}: VideoUploadProps) {
  const { message } = App.useApp()

  // ── UI state ──────────────────────────────────────────────────────────────
  const [status, setStatus] = useState<UploadStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [speedText, setSpeedText] = useState('—')
  const [etaText, setEtaText] = useState('—')
  const [partsMap, setPartsMap] = useState<Record<number, PartStatus>>({})
  const [completedCount, setCompletedCount] = useState(0)
  const [totalPartsCount, setTotalPartsCount] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')
  const [uploadedVideoId, setUploadedVideoId] = useState<string | null>(null)
  const [resumeBannerFile, setResumeBannerFile] = useState<File | null>(null)
  const [failedPartsQueue, setFailedPartsQueue] = useState<MultipartPartInfo[]>([])
  const [isMultipart, setIsMultipart] = useState(false)

  // ── Mutable refs (no re-render) ───────────────────────────────────────────
  const fileRef = useRef<File | null>(null)
  const sessionRef = useRef<MultipartSession | null>(null)
  const isCancelledRef = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  // Sliding window of { time, bytes } for speed calculation
  const speedSamplesRef = useRef<{ time: number; bytes: number }[]>([])
  // Per-part in-flight byte counts for accurate concurrent progress
  const perPartLoadedRef = useRef<Map<number, number>>(new Map())
  // Bytes from fully completed parts
  const completedBytesRef = useRef(0)

  // ── Progress & speed ──────────────────────────────────────────────────────

  function updateProgressUI(
    loadedBytes: number,
    totalBytes: number,
    doneCount: number,
    total: number,
  ) {
    const pct = totalBytes > 0 ? Math.min((loadedBytes / totalBytes) * 100, 100) : 0
    setProgress(Math.round(pct * 10) / 10)
    setCompletedCount(doneCount)
    setTotalPartsCount(total)

    const now = Date.now()
    speedSamplesRef.current.push({ time: now, bytes: loadedBytes })
    speedSamplesRef.current = speedSamplesRef.current.filter(s => now - s.time < 5000)

    if (speedSamplesRef.current.length >= 2) {
      const samples = speedSamplesRef.current
      const dt = (samples[samples.length - 1].time - samples[0].time) / 1000
      const db = samples[samples.length - 1].bytes - samples[0].bytes
      const speed = dt > 0 ? db / dt : 0
      setSpeedText(speed > 0 ? `${formatBytes(speed)}/s` : '—')
      setEtaText(speed > 0 ? formatEta((totalBytes - loadedBytes) / speed) : '—')
    }
  }

  function onPartProgress(partNumber: number, loaded: number) {
    perPartLoadedRef.current.set(partNumber, loaded)
    const inFlight = [...perPartLoadedRef.current.values()].reduce((a, b) => a + b, 0)
    const session = sessionRef.current
    const file = fileRef.current
    if (session && file) {
      updateProgressUI(
        completedBytesRef.current + inFlight,
        file.size,
        session.completedParts.length,
        session.totalParts,
      )
    }
  }

  // ── Part dot helpers ──────────────────────────────────────────────────────

  function setPartStatus(partNumber: number, s: PartStatus) {
    setPartsMap(prev => ({ ...prev, [partNumber]: s }))
  }

  function initPartDots(total: number, resumedNums: Set<number>) {
    const map: Record<number, PartStatus> = {}
    for (let i = 1; i <= total; i++) map[i] = resumedNums.has(i) ? 'resumed' : 'pending'
    setPartsMap(map)
    setTotalPartsCount(total)
  }

  // ── Single upload ─────────────────────────────────────────────────────────

  async function runSingleUpload(file: File) {
    const controller = new AbortController()
    abortControllerRef.current = controller

    setIsMultipart(false)
    setStatus('uploading')
    setProgress(0)
    speedSamplesRef.current = []

    const { videoId, uploadUrl } = await requestVideoUpload({ filename: file.name })
    const minioUrl = `${ENV.API_FILE_URL}${uploadUrl}`

    await axios.put(minioUrl, file, {
      signal: controller.signal,
      headers: { 'Content-Type': file.type || 'video/mp4' },
      onUploadProgress: event => {
        const pct = (event.loaded / (event.total ?? file.size)) * 100
        setProgress(Math.round(pct * 10) / 10)
      },
    })

    setStatus('confirming')
    await confirmVideoUpload({ id: videoId })

    setStatus('done')
    setUploadedVideoId(videoId)
    onVideoReady(videoId)
  }

  // ── Multipart: single part uploader ──────────────────────────────────────

  async function uploadOnePart(
    part: MultipartPartInfo,
    session: MultipartSession,
    file: File,
    signal: AbortSignal,
    attempt = 1,
  ): Promise<boolean> {
    if (isCancelledRef.current) return false

    const { partNumber } = part
    setPartStatus(partNumber, 'uploading')
    perPartLoadedRef.current.set(partNumber, 0)

    const start = (partNumber - 1) * session.chunkSize
    const end = Math.min(start + session.chunkSize, file.size)
    const chunk = file.slice(start, end)

    try {
      const response = await axios.put<void>(part.url, chunk, {
        signal,
        headers: { 'Content-Type': 'application/octet-stream' },
        onUploadProgress: e => onPartProgress(partNumber, e.loaded),
      })
      const etag = (response.headers['etag'] as string | undefined) ?? ''

      session.completedParts.push({ partNumber, etag })
      saveSession(file, session)

      completedBytesRef.current += end - start
      perPartLoadedRef.current.delete(partNumber)
      updateProgressUI(
        completedBytesRef.current,
        file.size,
        session.completedParts.length,
        session.totalParts,
      )

      setPartStatus(partNumber, 'done')
      return true
    } catch (err) {
      if (isCancelledRef.current || axios.isCancel(err)) return false

      // 403 = presigned URL expired → refresh then retry once
      const status = (err as { response?: { status: number } })?.response?.status
      if (status === 403 && attempt === 1) {
        try {
          const refreshed = await multipartRefreshUrls({
            uploadId: session.uploadId,
            key: session.key,
            partNumbers: [partNumber],
          })
          part.url = refreshed.parts[0].url
          const idx = session.parts.findIndex(p => p.partNumber === partNumber)
          if (idx >= 0) session.parts[idx].url = part.url
          saveSession(file, session)
          return uploadOnePart(part, session, file, signal, attempt + 1)
        } catch {
          setPartStatus(partNumber, 'failed')
          return false
        }
      }

      if (attempt >= MAX_RETRIES) {
        setPartStatus(partNumber, 'failed')
        return false
      }

      await sleep(RETRY_BASE_MS * Math.pow(2, attempt - 1))
      return uploadOnePart(part, session, file, signal, attempt + 1)
    }
  }

  // ── Multipart: concurrent worker pool ────────────────────────────────────

  async function uploadConcurrent(
    parts: MultipartPartInfo[],
    session: MultipartSession,
    file: File,
    signal: AbortSignal,
  ): Promise<MultipartPartInfo[]> {
    const queue = [...parts]
    const failed: MultipartPartInfo[] = []
    const workerCount = Math.min(maxConcurrent, parts.length)

    await Promise.all(
      Array.from({ length: workerCount }, async () => {
        while (queue.length > 0 && !isCancelledRef.current) {
          const part = queue.shift()!
          const ok = await uploadOnePart(part, session, file, signal)
          if (!ok && !isCancelledRef.current) failed.push(part)
        }
      }),
    )

    return failed
  }

  // ── Multipart: main flow ──────────────────────────────────────────────────

  async function runMultipartUpload(file: File, isResume: boolean) {
    const controller = new AbortController()
    abortControllerRef.current = controller
    isCancelledRef.current = false
    speedSamplesRef.current = []
    perPartLoadedRef.current.clear()

    setIsMultipart(true)
    setStatus('uploading')

    let session: MultipartSession

    if (!isResume) {
      const res = await multipartInit({
        filename: file.name,
        fileSize: file.size,
        contentType: file.type || 'application/octet-stream',
      })
      session = { ...res, completedParts: [], initiatedAt: Date.now() }
      saveSession(file, session)
    } else {
      session = loadSession(file)!

      // Reconcile with server in case of browser crash
      const serverParts = await multipartListParts(session.uploadId, session.key)
      if (serverParts.length !== session.completedParts.length) {
        session.completedParts = serverParts.map(p => ({ partNumber: p.PartNumber, etag: p.ETag }))
        saveSession(file, session)
      }

      // Refresh presigned URLs if near expiry
      const ageSecs = (Date.now() - session.initiatedAt) / 1000
      if (ageSecs > URL_REFRESH_THRESHOLD_SECS) {
        const completedNums = new Set(session.completedParts.map(p => p.partNumber))
        const pendingNums = session.parts
          .filter(p => !completedNums.has(p.partNumber))
          .map(p => p.partNumber)
        if (pendingNums.length > 0) {
          const refreshed = await multipartRefreshUrls({
            uploadId: session.uploadId,
            key: session.key,
            partNumbers: pendingNums,
          })
          for (const rp of refreshed.parts) {
            const idx = session.parts.findIndex(p => p.partNumber === rp.partNumber)
            if (idx >= 0) session.parts[idx].url = rp.url
          }
          session.initiatedAt = Date.now()
          saveSession(file, session)
        }
      }
    }

    fileRef.current = file
    sessionRef.current = session

    const completedNums = new Set(session.completedParts.map(p => p.partNumber))
    const pendingParts = session.parts.filter(p => !completedNums.has(p.partNumber))

    initPartDots(session.totalParts, completedNums)

    // Seed completed bytes from already-done parts
    completedBytesRef.current = session.completedParts.reduce((sum, p) => {
      const start = (p.partNumber - 1) * session.chunkSize
      return sum + Math.min(start + session.chunkSize, file.size) - start
    }, 0)

    const failed = await uploadConcurrent(pendingParts, session, file, controller.signal)

    if (isCancelledRef.current) {
      setStatus('cancelled')
      return
    }

    if (failed.length > 0) {
      setFailedPartsQueue(failed)
      setStatus('error')
      setErrorMsg(`${failed.length} part(s) thất bại. Bấm "Retry" để thử lại.`)
      return
    }

    // All parts done — complete the upload
    const allParts = [...session.completedParts].sort((a, b) => a.partNumber - b.partNumber)
    await multipartComplete({
      videoId: session.videoId,
      uploadId: session.uploadId,
      key: session.key,
      parts: allParts,
    })

    clearSession(file)
    setStatus('done')
    setUploadedVideoId(session.videoId)
    setProgress(100)
    onVideoReady(session.videoId)
  }

  // ── Start / resume / discard ──────────────────────────────────────────────

  async function startUpload(file: File, isResume: boolean) {
    setErrorMsg('')
    setFailedPartsQueue([])
    setUploadedVideoId(null)

    try {
      if (file.size < multipartThresholdMB * 1048576) {
        await runSingleUpload(file)
      } else {
        await runMultipartUpload(file, isResume)
      }
    } catch (err) {
      if (isCancelledRef.current || axios.isCancel(err)) return
      const msg = isApiResponseError(err) ? err.message : 'Upload thất bại. Vui lòng thử lại.'
      setStatus('error')
      setErrorMsg(msg)
      void message.error(msg)

      // Abort multipart session if it was initiated but nothing completed
      const session = sessionRef.current
      if (session && !session.completedParts.length && file) {
        try {
          await multipartAbort({
            videoId: session.videoId,
            uploadId: session.uploadId,
            key: session.key,
          })
          clearSession(file)
        } catch {
          /* orphaned session — server should clean up via lifecycle policy */
        }
      }
    }
  }

  function handleFileSelected(file: File) {
    // Check for an interrupted multipart session
    if (file.size >= multipartThresholdMB * 1048576) {
      const session = loadSession(file)
      if (session && session.completedParts.length > 0) {
        setResumeBannerFile(file)
        return
      }
    }
    void startUpload(file, false)
  }

  function handleResume() {
    if (!resumeBannerFile) return
    const file = resumeBannerFile
    setResumeBannerFile(null)
    void startUpload(file, true)
  }

  function handleDiscardResume() {
    if (!resumeBannerFile) return
    clearSession(resumeBannerFile)
    const file = resumeBannerFile
    setResumeBannerFile(null)
    void startUpload(file, false)
  }

  // ── Cancel ────────────────────────────────────────────────────────────────

  async function handleCancel() {
    isCancelledRef.current = true
    abortControllerRef.current?.abort()
    setStatus('cancelled')

    const session = sessionRef.current
    const file = fileRef.current
    if (session) {
      try {
        await multipartAbort({
          videoId: session.videoId,
          uploadId: session.uploadId,
          key: session.key,
        })
        if (file) clearSession(file)
      } catch {
        /* ignore */
      }
    }
  }

  // ── Retry failed parts ────────────────────────────────────────────────────

  async function handleRetry() {
    const session = sessionRef.current
    const file = fileRef.current
    if (!failedPartsQueue.length || !session || !file) return

    const controller = new AbortController()
    abortControllerRef.current = controller
    isCancelledRef.current = false
    speedSamplesRef.current = []

    const partsToRetry = [...failedPartsQueue]
    setFailedPartsQueue([])
    setStatus('uploading')
    setErrorMsg('')

    try {
      const stillFailed = await uploadConcurrent(partsToRetry, session, file, controller.signal)

      if (isCancelledRef.current) {
        setStatus('cancelled')
        return
      }

      if (stillFailed.length > 0) {
        setFailedPartsQueue(stillFailed)
        setStatus('error')
        setErrorMsg(`${stillFailed.length} part(s) vẫn thất bại. Bấm "Retry" để thử lại.`)
        return
      }

      const allParts = [...session.completedParts].sort((a, b) => a.partNumber - b.partNumber)
      await multipartComplete({
        videoId: session.videoId,
        uploadId: session.uploadId,
        key: session.key,
        parts: allParts,
      })

      clearSession(file)
      setStatus('done')
      setUploadedVideoId(session.videoId)
      setProgress(100)
      onVideoReady(session.videoId)
    } catch (err) {
      if (isCancelledRef.current) return
      const msg = isApiResponseError(err) ? err.message : 'Retry thất bại.'
      setStatus('error')
      setErrorMsg(msg)
    }
  }

  // ── Derived ───────────────────────────────────────────────────────────────

  const isUploading = status === 'uploading' || status === 'confirming'

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Space direction="vertical" size={12} style={{ width: '100%' }}>
      {/* Existing video */}
      {existingVideoId && status === 'idle' && (
        <Alert
          type="info"
          showIcon
          icon={<VideoCameraOutlined />}
          message="Video hiện tại"
          description={
            <Typography.Text code copyable>
              {existingVideoId}
            </Typography.Text>
          }
        />
      )}

      {/* Resume banner */}
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

      {/* Dropzone */}
      <Upload.Dragger
        name="video"
        multiple={false}
        maxCount={1}
        accept="video/*"
        showUploadList={false}
        disabled={isUploading}
        beforeUpload={file => {
          handleFileSelected(file)
          return false
        }}
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">
          {status === 'done'
            ? 'Upload video khác để thay thế'
            : 'Kéo thả file video vào đây hoặc bấm để chọn'}
        </p>
        <p className="ant-upload-hint">
          {'< '}
          {multipartThresholdMB} MB: single upload — {'≥ '}
          {multipartThresholdMB} MB: multipart upload (hỗ trợ resume)
        </p>
      </Upload.Dragger>

      {/* Progress (uploading) */}
      {status === 'uploading' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <Typography.Text type="secondary">
              {isMultipart
                ? `Multipart — ${completedCount} / ${totalPartsCount} parts`
                : 'Đang upload...'}
            </Typography.Text>
            <Typography.Text type="secondary">{progress.toFixed(1)}%</Typography.Text>
          </div>
          <Progress percent={progress} status="active" showInfo={false} />

          {/* Speed + ETA (multipart) */}
          {isMultipart && (
            <>
              <div style={{ display: 'flex', gap: 24, marginTop: 6 }}>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  Tốc độ: <strong>{speedText}</strong>
                </Typography.Text>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  Còn lại: <strong>{etaText}</strong>
                </Typography.Text>
              </div>

              {/* Part dots */}
              {totalPartsCount > 0 && (
                <div style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                    {Array.from({ length: totalPartsCount }, (_, i) => {
                      const pn = i + 1
                      const ps: PartStatus = partsMap[pn] ?? 'pending'
                      return (
                        <div
                          key={pn}
                          title={`Part ${pn}: ${ps}`}
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: 2,
                            backgroundColor: PART_DOT_COLORS[ps],
                            transition: 'background-color 0.2s',
                          }}
                        />
                      )
                    })}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 4 }}>
                    {(Object.keys(PART_DOT_COLORS) as PartStatus[]).map(s => (
                      <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <div
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 2,
                            backgroundColor: PART_DOT_COLORS[s],
                          }}
                        />
                        <Typography.Text style={{ fontSize: 11, color: '#9ca3af' }}>
                          {PART_STATUS_LABELS[s]}
                        </Typography.Text>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <div style={{ marginTop: 8, textAlign: 'right' }}>
            <Button size="small" danger icon={<StopOutlined />} onClick={() => void handleCancel()}>
              Hủy upload
            </Button>
          </div>
        </div>
      )}

      {/* Confirming (single upload) */}
      {status === 'confirming' && (
        <Alert
          type="info"
          showIcon
          icon={<LoadingOutlined spin />}
          message="Đang xác nhận upload với server..."
        />
      )}

      {/* Done */}
      {status === 'done' && uploadedVideoId && (
        <Alert
          type="success"
          showIcon
          icon={<CheckCircleOutlined />}
          message="Upload thành công!"
          description={
            <Space direction="vertical" size={2}>
              <span>
                Video ID:{' '}
                <Typography.Text code copyable>
                  {uploadedVideoId}
                </Typography.Text>
              </span>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                Video đang được xử lý HLS — trạng thái sẽ chuyển sang &quot;ready&quot; sau khi
                worker xử lý xong.
              </Typography.Text>
            </Space>
          }
        />
      )}

      {/* Cancelled */}
      {status === 'cancelled' && <Alert type="warning" showIcon message="Upload đã bị hủy." />}

      {/* Error */}
      {status === 'error' && errorMsg && (
        <Alert
          type="error"
          showIcon
          icon={<CloseCircleOutlined />}
          message={errorMsg}
          action={
            failedPartsQueue.length > 0 ? (
              <Button size="small" icon={<ReloadOutlined />} onClick={() => void handleRetry()}>
                Retry
              </Button>
            ) : undefined
          }
        />
      )}
    </Space>
  )
}
