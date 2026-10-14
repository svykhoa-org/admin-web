import type { AbstractModel } from './AbstractModel'
import type { DocumentClassify } from './DocumentClassify'
import type { FileResource } from './FileResource'

export enum DocumentStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
}

export enum DocumentKind {
  PDF = 'PDF',
  VIDEO = 'VIDEO',
}

export interface Document extends AbstractModel {
  kind: DocumentKind
  videoId?: string | null
  // Admin detail only: minimal summary of the linked library video.
  video?: { id: string; title: string } | null
  durationMinutes?: number | null
  title: string
  description?: string | null
  slug: string
  price: number
  thumbnailId?: string | null
  thumbnail?: FileResource | null
  previewId?: string | null
  preview?: FileResource | null
  fileId?: string | null
  file?: FileResource | null
  categoryId?: string | null
  category?: Omit<DocumentClassify, 'parent' | 'parentId'> | null
  totalPages?: number | null
  fileSize?: number | null
  status: DocumentStatus
}
