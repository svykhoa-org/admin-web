import type { AbstractModel } from '@/models/AbstractModel'

export interface DocumentClassify extends AbstractModel {
  name: string
  slug: string
  parentId?: string | null
  parent?: Omit<DocumentClassify, 'parent' | 'parentId'> | null
}
