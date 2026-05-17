import type { AbstractModel } from './AbstractModel'

export interface CourseCategory extends AbstractModel {
  name: string
  description?: string | null
  slug: string
  icon?: string | null
  parentId?: string | null
  path: string
  publishedCourseCount: number
  totalCourseCount: number
  parent?: CourseCategory | null
}
