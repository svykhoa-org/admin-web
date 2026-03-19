export enum FileVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
}

export interface FileResource {
  id: string
  originalName?: string
  fileName?: string
  mimeType?: string
  size?: number
  key?: string
  bucket?: string
  provider?: string
  visibility?: FileVisibility
  url?: string
  metadata?: Record<string, unknown>
}
