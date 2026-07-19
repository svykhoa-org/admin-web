import {
  abortMultipartUpload,
  completeMultipartUpload,
  confirmPresignedUpload,
  initMultipartUpload,
  listMultipartParts,
  refreshMultipartPartUrls,
  requestPresignedUpload,
} from '@/services/Asset'
import type { InitMultipartUploadOutput, MultipartPartInfo } from '@/services/Asset'
import { resolveUploadUrl } from '@/components/Upload/assetResource'
import { isApiResponseError } from '@/utils/apiResponse'
import axios from 'axios'
import { create } from 'zustand'

// ─── Dev ──────────────────────────────────────────────────────────────────────
/** Artificial delay (ms) injected after each part upload. Set to 0 for production. */
const DEV_PART_UPLOAD_DELAY_MS = 3000

// ─── Constants ────────────────────────────────────────────────────────────────
export const UPLOAD_SESSION_PREFIX = 'mpu_bg_'
const MAX_RETRIES = 3
const RETRY_BASE_MS = 1000
const URL_REFRESH_THRESHOLD_SECS = 6 * 3600 * 0.9

// ─── Public types ─────────────────────────────────────────────────────────────
export type UploadTaskStatus = 'uploading' | 'confirming' | 'done' | 'error' | 'cancelled'

export interface UploadTask {
  id: string
  label: string
  filename: string
  fileSize: number
  status: UploadTaskStatus
  progress: number
  speedText: string
  etaText: string
  isMultipart: boolean
  completedParts: number
  totalParts: number
  errorMsg: string
  assetId: string | null
  failedPartsCount: number
}

export interface EnqueueOptions {
  label: string
  isResume?: boolean
  multipartThresholdMB?: number
  maxConcurrent?: number
  onVideoReady?: (assetId: string) => void
}

// ─── Internal session (persisted to localStorage) ────────────────────────────
interface MultipartSession extends InitMultipartUploadOutput {
  completedParts: { partNumber: number; etag: string }[]
  initiatedAt: number
}

// ─── Internal runtime (not in Zustand state) ─────────────────────────────────
interface TaskRuntime {
  file: File
  abortController: AbortController
  isCancelled: boolean
  session: MultipartSession | null
  speedSamples: { time: number; bytes: number }[]
  perPartLoaded: Map<number, number>
  completedBytes: number
  failedParts: MultipartPartInfo[]
  onVideoReady?: (assetId: string) => void
  multipartThresholdMB: number
  maxConcurrent: number
}

// Module-level map — survives component unmounts
const runtimes = new Map<string, TaskRuntime>()

// ─── Session helpers ──────────────────────────────────────────────────────────
function sessionKey(file: File) {
  return UPLOAD_SESSION_PREFIX + encodeURIComponent(`${file.name}::${file.size}`)
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

/** Check whether a resumable multipart session exists for this file. */
export function hasResumeSession(file: File): boolean {
  const session = loadSession(file)
  return !!session && session.completedParts.length > 0
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

// ─── Store definition ─────────────────────────────────────────────────────────
interface UploadStoreState {
  tasks: Record<string, UploadTask>
}

interface UploadStoreActions {
  enqueue: (file: File, opts: EnqueueOptions) => string
  cancel: (taskId: string) => Promise<void>
  retry: (taskId: string) => Promise<void>
  dismiss: (taskId: string) => void
}

export const useUploadStore = create<UploadStoreState & UploadStoreActions>((set, get) => {
  // ── Patch helper ──────────────────────────────────────────────────────────
  function patch(taskId: string, update: Partial<UploadTask>) {
    // Guard: task may have been dismissed already
    if (!get().tasks[taskId]) return
    set(state => ({
      tasks: { ...state.tasks, [taskId]: { ...state.tasks[taskId], ...update } },
    }))
  }

  // ── Progress updater ──────────────────────────────────────────────────────
  function updateProgress(
    taskId: string,
    rt: TaskRuntime,
    loadedBytes: number,
    totalBytes: number,
  ) {
    const pct = totalBytes > 0 ? Math.min((loadedBytes / totalBytes) * 100, 100) : 0
    const now = Date.now()
    rt.speedSamples.push({ time: now, bytes: loadedBytes })
    rt.speedSamples = rt.speedSamples.filter(s => now - s.time < 5000)

    let speedText = '—'
    let etaText = '—'
    if (rt.speedSamples.length >= 2) {
      const samples = rt.speedSamples
      const dt = (samples[samples.length - 1].time - samples[0].time) / 1000
      const db = samples[samples.length - 1].bytes - samples[0].bytes
      const speed = dt > 0 ? db / dt : 0
      if (speed > 0) {
        speedText = `${formatBytes(speed)}/s`
        etaText = formatEta((totalBytes - loadedBytes) / speed)
      }
    }

    patch(taskId, {
      progress: Math.round(pct * 10) / 10,
      speedText,
      etaText,
      completedParts: rt.session?.completedParts.length ?? 0,
    })
  }

  // ── Upload one part with retry ────────────────────────────────────────────
  async function uploadOnePart(
    taskId: string,
    part: MultipartPartInfo,
    attempt = 1,
  ): Promise<boolean> {
    const rt = runtimes.get(taskId)
    if (!rt || rt.isCancelled || !rt.session) return false

    const { session, file, abortController } = rt
    const { partNumber } = part
    rt.perPartLoaded.set(partNumber, 0)

    const start = (partNumber - 1) * session.chunkSize
    const end = Math.min(start + session.chunkSize, file.size)

    try {
      const response = await axios.put<void>(resolveUploadUrl(part.url), file.slice(start, end), {
        signal: abortController.signal,
        headers: { 'Content-Type': 'application/octet-stream' },
        onUploadProgress: e => {
          rt.perPartLoaded.set(partNumber, e.loaded)
          const inFlight = [...rt.perPartLoaded.values()].reduce((a, b) => a + b, 0)
          updateProgress(taskId, rt, rt.completedBytes + inFlight, file.size)
        },
      })

      // DEV: simulate slow network for testing
      if (DEV_PART_UPLOAD_DELAY_MS > 0) await sleep(DEV_PART_UPLOAD_DELAY_MS)

      const etag = (response.headers['etag'] as string | undefined) ?? ''
      session.completedParts.push({ partNumber, etag })
      saveSession(file, session)

      rt.completedBytes += end - start
      rt.perPartLoaded.delete(partNumber)
      updateProgress(taskId, rt, rt.completedBytes, file.size)
      return true
    } catch (err) {
      if (rt.isCancelled || axios.isCancel(err)) return false

      // 403 = presigned URL expired → refresh once then retry
      if ((err as { response?: { status: number } })?.response?.status === 403 && attempt === 1) {
        try {
          const refreshed = await refreshMultipartPartUrls(session.assetId, [partNumber])
          part.url = refreshed.parts[0].url
          const idx = session.parts.findIndex(p => p.partNumber === partNumber)
          if (idx >= 0) session.parts[idx].url = part.url
          saveSession(file, session)
          return uploadOnePart(taskId, part, attempt + 1)
        } catch {
          return false
        }
      }

      if (attempt >= MAX_RETRIES) return false
      await sleep(RETRY_BASE_MS * Math.pow(2, attempt - 1))
      return uploadOnePart(taskId, part, attempt + 1)
    }
  }

  // ── Concurrent worker pool ────────────────────────────────────────────────
  async function uploadConcurrent(
    taskId: string,
    parts: MultipartPartInfo[],
  ): Promise<MultipartPartInfo[]> {
    const rt = runtimes.get(taskId)
    if (!rt) return parts

    const queue = [...parts]
    const failed: MultipartPartInfo[] = []
    const workerCount = Math.min(rt.maxConcurrent, parts.length)

    await Promise.all(
      Array.from({ length: workerCount }, async () => {
        while (queue.length > 0 && !rt.isCancelled) {
          const part = queue.shift()!
          const ok = await uploadOnePart(taskId, part)
          if (!ok && !rt.isCancelled) failed.push(part)
        }
      }),
    )

    return failed
  }

  // ── Single upload (below threshold) ──────────────────────────────────────
  async function runSingleUpload(taskId: string) {
    const rt = runtimes.get(taskId)
    if (!rt) return

    const { file, abortController } = rt
    patch(taskId, { isMultipart: false, status: 'uploading', progress: 0 })

    const { assetId, uploadUrl } = await requestPresignedUpload({
      filename: file.name,
      contentType: file.type || 'video/mp4',
      visibility: 'PRIVATE',
    })

    // assetId available immediately → notify callback, lesson can be saved now
    patch(taskId, { assetId })
    rt.onVideoReady?.(assetId)

    await axios.put(resolveUploadUrl(uploadUrl), file, {
      signal: abortController.signal,
      headers: { 'Content-Type': file.type || 'video/mp4' },
      onUploadProgress: e => {
        patch(taskId, {
          progress: Math.round((e.loaded / (e.total ?? file.size)) * 100 * 10) / 10,
        })
      },
    })

    patch(taskId, { status: 'confirming' })
    await confirmPresignedUpload(assetId)
    patch(taskId, { status: 'done', progress: 100 })
  }

  // ── Multipart upload ──────────────────────────────────────────────────────
  async function runMultipartUpload(taskId: string, isResume: boolean) {
    const rt = runtimes.get(taskId)
    if (!rt) return

    const { file } = rt
    patch(taskId, { isMultipart: true, status: 'uploading' })

    let session: MultipartSession

    if (!isResume) {
      const res = await initMultipartUpload({
        filename: file.name,
        fileSize: file.size,
        contentType: file.type || 'application/octet-stream',
        visibility: 'PRIVATE',
      })
      session = { ...res, completedParts: [], initiatedAt: Date.now() }
      saveSession(file, session)
    } else {
      session = loadSession(file)!

      // Reconcile with server in case of mid-upload crash
      const serverParts = await listMultipartParts(session.assetId)
      if (serverParts.length !== session.completedParts.length) {
        session.completedParts = serverParts.map(p => ({ partNumber: p.PartNumber, etag: p.ETag }))
        saveSession(file, session)
      }

      // Refresh presigned URLs if near expiry
      const ageSecs = (Date.now() - session.initiatedAt) / 1000
      if (ageSecs > URL_REFRESH_THRESHOLD_SECS) {
        const completedSet = new Set(session.completedParts.map(p => p.partNumber))
        const pendingNums = session.parts
          .filter(p => !completedSet.has(p.partNumber))
          .map(p => p.partNumber)
        if (pendingNums.length > 0) {
          const refreshed = await refreshMultipartPartUrls(session.assetId, pendingNums)
          for (const rp of refreshed.parts) {
            const idx = session.parts.findIndex(p => p.partNumber === rp.partNumber)
            if (idx >= 0) session.parts[idx].url = rp.url
          }
          session.initiatedAt = Date.now()
          saveSession(file, session)
        }
      }
    }

    rt.session = session

    // assetId available immediately → notify callback, lesson can be saved now
    patch(taskId, { assetId: session.assetId, totalParts: session.totalParts })
    rt.onVideoReady?.(session.assetId)

    const completedSet = new Set(session.completedParts.map(p => p.partNumber))
    const pendingParts = session.parts.filter(p => !completedSet.has(p.partNumber))

    rt.completedBytes = session.completedParts.reduce((sum, p) => {
      const start = (p.partNumber - 1) * session.chunkSize
      return sum + Math.min(start + session.chunkSize, file.size) - start
    }, 0)

    const failed = await uploadConcurrent(taskId, pendingParts)

    if (rt.isCancelled) {
      patch(taskId, { status: 'cancelled' })
      return
    }

    if (failed.length > 0) {
      rt.failedParts = failed
      patch(taskId, {
        status: 'error',
        errorMsg: `${failed.length} part(s) thất bại.`,
        failedPartsCount: failed.length,
      })
      return
    }

    await completeMultipartUpload(
      session.assetId,
      [...session.completedParts].sort((a, b) => a.partNumber - b.partNumber),
    )

    clearSession(file)
    patch(taskId, { status: 'done', progress: 100 })
  }

  // ── Run task (entry point) ────────────────────────────────────────────────
  async function runTask(taskId: string, isResume: boolean) {
    const rt = runtimes.get(taskId)
    if (!rt) return

    const { file, multipartThresholdMB } = rt
    try {
      if (file.size < multipartThresholdMB * 1048576) {
        await runSingleUpload(taskId)
      } else {
        await runMultipartUpload(taskId, isResume)
      }
    } catch (err) {
      if (rt.isCancelled || axios.isCancel(err)) return

      const msg = isApiResponseError(err) ? err.message : 'Upload thất bại. Vui lòng thử lại.'
      patch(taskId, { status: 'error', errorMsg: msg })

      // Abort session if nothing was uploaded yet
      const session = rt.session
      if (session && !session.completedParts.length) {
        try {
          await abortMultipartUpload(session.assetId)
          clearSession(file)
        } catch {
          /* orphaned — server lifecycle policy will clean up */
        }
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  return {
    tasks: {},

    enqueue(file, opts) {
      const taskId = `upload_${Date.now()}_${Math.random().toString(36).slice(2)}`

      runtimes.set(taskId, {
        file,
        abortController: new AbortController(),
        isCancelled: false,
        session: null,
        speedSamples: [],
        perPartLoaded: new Map(),
        completedBytes: 0,
        failedParts: [],
        onVideoReady: opts.onVideoReady,
        multipartThresholdMB: opts.multipartThresholdMB ?? 50,
        maxConcurrent: opts.maxConcurrent ?? 3,
      })

      set(state => ({
        tasks: {
          ...state.tasks,
          [taskId]: {
            id: taskId,
            label: opts.label,
            filename: file.name,
            fileSize: file.size,
            status: 'uploading',
            progress: 0,
            speedText: '—',
            etaText: '—',
            isMultipart: false,
            completedParts: 0,
            totalParts: 0,
            errorMsg: '',
            assetId: null,
            failedPartsCount: 0,
          },
        },
      }))

      void runTask(taskId, opts.isResume ?? false)
      return taskId
    },

    async cancel(taskId) {
      const rt = runtimes.get(taskId)
      if (!rt) return
      rt.isCancelled = true
      rt.abortController.abort()
      patch(taskId, { status: 'cancelled' })

      const session = rt.session
      if (session) {
        try {
          await abortMultipartUpload(session.assetId)
          clearSession(rt.file)
        } catch {
          /* ignore */
        }
      }
      runtimes.delete(taskId)
    },

    async retry(taskId) {
      const rt = runtimes.get(taskId)
      if (!rt?.failedParts.length || !rt.session) return

      rt.abortController = new AbortController()
      rt.isCancelled = false
      rt.speedSamples = []

      const partsToRetry = [...rt.failedParts]
      rt.failedParts = []
      patch(taskId, { status: 'uploading', errorMsg: '', failedPartsCount: 0 })

      try {
        const stillFailed = await uploadConcurrent(taskId, partsToRetry)

        if (rt.isCancelled) {
          patch(taskId, { status: 'cancelled' })
          return
        }

        if (stillFailed.length > 0) {
          rt.failedParts = stillFailed
          patch(taskId, {
            status: 'error',
            errorMsg: `${stillFailed.length} part(s) vẫn thất bại.`,
            failedPartsCount: stillFailed.length,
          })
          return
        }

        const session = rt.session
        await completeMultipartUpload(
          session.assetId,
          [...session.completedParts].sort((a, b) => a.partNumber - b.partNumber),
        )
        clearSession(rt.file)
        patch(taskId, { status: 'done', progress: 100 })
      } catch (err) {
        if (rt.isCancelled) return
        patch(taskId, {
          status: 'error',
          errorMsg: isApiResponseError(err) ? err.message : 'Retry thất bại.',
        })
      }
    },

    dismiss(taskId) {
      runtimes.delete(taskId)
      set(state => {
        const next = { ...state.tasks }
        delete next[taskId]
        return { tasks: next }
      })
    },
  }
})

// ─── Selector helpers ─────────────────────────────────────────────────────────
export function selectActiveCount(tasks: Record<string, UploadTask>): number {
  return Object.values(tasks).filter(t => t.status === 'uploading' || t.status === 'confirming')
    .length
}
