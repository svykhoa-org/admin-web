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
  maxEnrollments?: number | null
  currentEnrollments?: number
  requiresVerification?: boolean
  // Cohort (scheduled) course: date fields below gate registration/learning/certification.
  isScheduled?: boolean
  registrationStart?: string | null
  registrationEnd?: string | null
  startDate?: string | null
  endDate?: string | null
  objectives?: string[]
  requirements?: string[]
  suitableFor?: string[]
  instructorIds?: string[]
  totalDurationMinutes?: number
  config?: CourseConfig
}

export type AccessMode = 'unlimited' | 'days_after_enroll' | 'until_course_end'
export type ProgressionMode = 'free' | 'sequential' | 'module_sequential'

export interface CourseConfig {
  access: { mode: AccessMode; days: number | null }
  progression: { mode: ProgressionMode }
  completion: {
    lessonThresholdPercent: number
    requireAllRequiredLessons: boolean
    requiredQuizLessonIds: string[]
  }
  proctoring: ProctoringConfig
  certificate: {
    enabled: boolean
    cmeCredits: number | null
    certifyingOrganization: string | null
  }
}

export interface ProctoringConfig {
  enabled: boolean
  // (1) Tạm dừng khi không thao tác.
  inactivityPause: {
    enabled: boolean
    thresholdMinutes: number
  }
  // (2) Kiểm tra hiện diện qua camera.
  presenceCheck: {
    enabled: boolean
    cameraRequired: boolean
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
