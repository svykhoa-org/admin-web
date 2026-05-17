import type { AbstractModel } from './AbstractModel'

export interface CourseTag extends AbstractModel {
  name: string
  description?: string | null
  slug: string
  color?: string | null
}
