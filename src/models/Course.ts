import type { FlatNamespace, TFunction } from 'i18next'
import type { AbstractModel } from './AbstractModel'
import type { TagProps } from 'antd'

export enum CourseStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export enum LessonType {
  VIDEO = 'video',
  QUIZ = 'quiz',
  DOCUMENT = 'document',
}

export interface Course extends AbstractModel {
  title: string
  description?: string | null
  thumbnail?: string | null
  price: number
  status: CourseStatus
  shortCode: string
  finalLessonId?: string | null
}

export interface CourseModule extends AbstractModel {
  courseId: string
  title: string
  order: number
}

export interface Lesson extends AbstractModel {
  moduleId: string
  title: string
  order: number
  type: LessonType
  contentId?: string | null
  isFinal: boolean
}

export const getCourseStatusMappingToLabels = (t: TFunction<FlatNamespace[]>) => {
  return {
    [CourseStatus.DRAFT]: t('CourseLocales:CourseStatus.draft'),
    [CourseStatus.PUBLISHED]: t('CourseLocales:CourseStatus.published'),
    [CourseStatus.ARCHIVED]: t('CourseLocales:CourseStatus.archived'),
  }
}

export const CourseStatusMappingToColors: Record<CourseStatus, TagProps['color']> = {
  [CourseStatus.DRAFT]: 'default',
  [CourseStatus.PUBLISHED]: 'green',
  [CourseStatus.ARCHIVED]: 'red',
}
