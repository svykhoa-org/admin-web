import type { AbstractModel } from './AbstractModel'
import type { DocumentClassify } from './DocumentClassify'
import type { FileResource } from './FileResource'

export enum DocumentStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
}

export interface Document extends AbstractModel {
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
