// ─── Existing file descriptor (for pre-populating upload components) ─────────

export interface ExistingFileData {
  url?: string
  name: string
  type: 'image' | 'video' | 'document'
  onView?: () => void
}

// ─── Upload Status ─────────────────────────────────────────────────────────────

export enum UploadStatus {
  Idle = 'idle',
  Uploading = 'uploading',
  Confirming = 'confirming',
  Done = 'done',
  Error = 'error',
  Cancelled = 'cancelled',
}

// ─── File Item Status (used in multiple-file lists) ───────────────────────────

export enum FileItemStatus {
  Uploading = 'uploading',
  Done = 'done',
  Error = 'error',
}

// ─── Multipart part status ────────────────────────────────────────────────────

export enum PartUploadStatus {
  Pending = 'pending',
  Uploading = 'uploading',
  Done = 'done',
  Failed = 'failed',
  Resumed = 'resumed',
}

// ─── Upload function signature ────────────────────────────────────────────────

/**
 * Function that performs the actual file upload.
 * Called with the file, an AbortSignal for cancellation, and a progress callback.
 */
export type UploadFileFn<TResult> = (
  file: File,
  signal: AbortSignal,
  onProgress: (loaded: number, total: number) => void,
) => Promise<TResult>

// ─── File item in a multiple-upload list ─────────────────────────────────────

export interface FileUploadItem<TResult> {
  uid: string
  file: File
  status: FileItemStatus
  progress: number
  result?: TResult
  error?: string
}

// ─── Render props for custom file items ──────────────────────────────────────

export interface FileItemRenderProps<TResult> {
  item: FileUploadItem<TResult>
  onRemove: () => void
}
