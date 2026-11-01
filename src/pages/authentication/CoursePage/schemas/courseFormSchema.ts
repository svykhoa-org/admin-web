import { z } from 'zod'
import type { FlatNamespace, TFunction } from 'i18next'

// ─── Parse helpers ────────────────────────────────────────────────────────────

/**
 * Parse textarea input sang string[].
 * Mỗi dòng là 1 item. Dấu "- " đầu dòng sẽ bị loại bỏ.
 * VD: "- Mục tiêu 1\nMục tiêu 2" → ["Mục tiêu 1", "Mục tiêu 2"]
 */
export function parseTextareaToArray(text?: string | null): string[] {
  if (!text?.trim()) return []
  return text
    .split('\n')
    .map(line => line.replace(/^-\s*/, '').trim())
    .filter(Boolean)
}

/**
 * Convert string[] sang textarea format để hiển thị lại khi edit.
 * VD: ["Mục tiêu 1", "Mục tiêu 2"] → "- Mục tiêu 1\n- Mục tiêu 2"
 */
export function arrayToTextarea(arr?: string[] | null): string | undefined {
  if (!arr?.length) return undefined
  return arr.map(item => `- ${item}`).join('\n')
}

// ─── Schemas ──────────────────────────────────────────────────────────────────

const createTitleSchema = (t: TFunction<FlatNamespace[]>) => {
  const field = t('CourseLocales:title')
  return z
    .string()
    .trim()
    .min(2, t('CommonLocales:FieldError.min_length', { field, value: 2 }))
    .max(200, t('CommonLocales:FieldError.max_length', { field, value: 200 }))
}

const createPriceSchema = (t: TFunction<FlatNamespace[]>) => {
  const field = t('CourseLocales:price')
  return z
    .number({ error: t('CommonLocales:FieldError.invalid', { field }) })
    .min(0, { error: t('CommonLocales:FieldError.greater_than_or_equal', { field, value: 0 }) })
}

export const COURSE_PRESETS = ['self_paced', 'cohort', 'cme'] as const
export type CoursePreset = (typeof COURSE_PRESETS)[number]

export const createCourseCreateSchema = (t: TFunction<FlatNamespace[]>) =>
  z.object({
    title: createTitleSchema(t),
    price: createPriceSchema(t),
    categoryId: z.string().nullish(),
    preset: z.enum(COURSE_PRESETS),
  })

export const createCourseInfoSchema = (t: TFunction<FlatNamespace[]>) =>
  z.object({
    title: createTitleSchema(t),
    subTitle: z.string().trim().max(300).nullish(),
    price: createPriceSchema(t),
    thumbnail: z.string().nullish(),
    categoryId: z.string().nullish(),
    tagIds: z.array(z.string()).optional(),
    instructorIds: z.array(z.string()).optional(),
    description: z.string().trim().nullish(),
    objectives: z.string().trim().nullish(),
    requirements: z.string().trim().nullish(),
    suitableFor: z.string().trim().nullish(),
  })
export type CourseInfoFormValues = z.input<ReturnType<typeof createCourseInfoSchema>>

export const enrollmentSchema = z.object({
  maxEnrollments: z.number().int().min(1).nullish(),
  requiresVerification: z.boolean().optional(),
  isScheduled: z.boolean().optional(),
  registrationStart: z.string().nullish(),
  registrationEnd: z.string().nullish(),
  startDate: z.string().nullish(),
  endDate: z.string().nullish(),
})
export type EnrollmentFormValues = z.input<typeof enrollmentSchema>

export const accessSchema = z.object({
  mode: z.enum(['unlimited', 'days_after_enroll', 'until_course_end']),
  days: z.number().int().min(1).max(3650).nullish(),
})

export const progressionSchema = z.object({
  mode: z.enum(['free', 'sequential', 'module_sequential']),
  lessonThresholdPercent: z.number().int().min(50).max(100),
  requireAllRequiredLessons: z.boolean().optional(),
  requiredQuizLessonIds: z.array(z.string()).optional(),
})

export const proctoringSchema = z.object({
  proctoringEnabled: z.boolean().optional(),
  // (1) Tạm dừng khi không thao tác
  proctoringInactivityEnabled: z.boolean().optional(),
  proctoringInactivityMinutes: z.number().int().min(1).nullish(),
  // (2) Kiểm tra hiện diện qua camera
  proctoringPresenceEnabled: z.boolean().optional(),
  proctoringCameraRequired: z.boolean().optional(),
  proctoringRandomMode: z.boolean().optional(),
  proctoringIntervalMinutes: z.number().int().min(1).nullish(),
  proctoringRandomMinMinutes: z.number().int().min(1).nullish(),
  proctoringRandomMaxMinutes: z.number().int().min(1).nullish(),
  proctoringMaxChecksPerVideo: z.number().int().min(1).nullish(),
})
export type ProctoringFormValues = z.input<typeof proctoringSchema>

export const certificateSchema = z.object({
  enabled: z.boolean().optional(),
  cmeCredits: z.number().min(0).nullish(),
  certifyingOrganization: z.string().trim().nullish(),
})
