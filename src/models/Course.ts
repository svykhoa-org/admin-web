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

export interface CourseTagRef {
  id: string
  name: string
  color: string
}

export interface Course extends AbstractModel {
  title: string
  subTitle?: string | null
  description?: string | null
  thumbnail?: string | null
  price: number
  status: CourseStatus
  shortCode: string
  categoryId?: string | null
  tags?: CourseTagRef[]
  accessDurationDays?: number | null
  maxEnrollments?: number | null
  currentEnrollments?: number
  selfPaced?: boolean
  objectives?: string[]
  requirements?: string[]
  suitableFor?: string[]
  instructorIds?: string[]
  cmeCredits?: number | null
  certifyingOrganization?: string | null
  totalDurationMinutes?: number
  proctoringConfig?: ProctoringConfig | null
}

export interface ProctoringConfig {
  enabled: boolean
  cameraRequired: boolean
  maxInactivitySeconds: number
  presenceCheck: {
    enabled: boolean
    mode: 'fixed' | 'random'
    intervalMinutes: number
    randomMinMinutes: number
    randomMaxMinutes: number
    maxChecksPerVideo: number
  }
}

export interface CourseModule extends AbstractModel {
  courseId: string
  title: string
  description?: string | null
  order: number
  locked?: boolean
  lessonCount?: number
  totalDurationMinutes?: number
}

export interface Lesson extends AbstractModel {
  moduleId: string
  courseId: string
  title: string
  description?: string | null
  order: number
  type: LessonType
  contentId?: string | null
  durationMinutes?: number
  isRequired?: boolean
  isPreview?: boolean
  prerequisiteLessonId?: string | null
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
