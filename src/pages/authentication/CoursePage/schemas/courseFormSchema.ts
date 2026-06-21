import { z } from 'zod'
import type { FlatNamespace, TFunction } from 'i18next'

// ─── Parse helpers ────────────────────────────────────────────────────────────

/**
 * Parse textarea input sang string[].
 * Mỗi dòng là 1 item. Dấu "- " đầu dòng sẽ bị loại bỏ.
 * VD: "- Mục tiêu 1\nMục tiêu 2" → ["Mục tiêu 1", "Mục tiêu 2"]
 */
export function parseTextareaToArray(text?: string): string[] | undefined {
  if (!text?.trim()) return undefined
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

// ─── Schema ───────────────────────────────────────────────────────────────────

export const createCourseFormSchema = (t: TFunction<FlatNamespace[]>) => {
  const titleField = t('CourseLocales:title')
  const priceField = t('CourseLocales:price')

  return z.object({
    title: z
      .string()
      .trim()
      .min(2, t('CommonLocales:FieldError.min_length', { field: titleField, value: 2 }))
      .max(200, t('CommonLocales:FieldError.max_length', { field: titleField, value: 200 })),
    subTitle: z.string().trim().max(300).optional(),
    description: z.string().trim().optional(),
    price: z
      .number({ error: t('CommonLocales:FieldError.invalid', { field: priceField }) })
      .min(0, {
        error: t('CommonLocales:FieldError.greater_than_or_equal', {
          field: priceField,
          value: 0,
        }),
      }),
    accessDurationDays: z.number().int().min(1).optional(),
    maxEnrollments: z.number().int().min(1).optional(),
    selfPaced: z.boolean().optional(),
    objectives: z.string().trim().optional(),
    requirements: z.string().trim().optional(),
    suitableFor: z.string().trim().optional(),
    cmeCredits: z.number().min(0).optional(),
    certifyingOrganization: z.string().trim().optional(),
    // ── Giám sát học tập (proctoring) ──
    proctoringEnabled: z.boolean().optional(),
    proctoringCameraRequired: z.boolean().optional(),
    proctoringMaxInactivitySeconds: z.number().int().min(5).optional(),
    proctoringPresenceEnabled: z.boolean().optional(),
    proctoringRandomMode: z.boolean().optional(),
    proctoringIntervalMinutes: z.number().int().min(1).optional(),
    proctoringRandomMinMinutes: z.number().int().min(1).optional(),
    proctoringRandomMaxMinutes: z.number().int().min(1).optional(),
    proctoringMaxChecksPerVideo: z.number().int().min(1).optional(),
  })
}

type CourseFormSchema = ReturnType<typeof createCourseFormSchema>
export type CourseFormValues = z.input<CourseFormSchema>
export type CourseFormSubmitValues = z.output<CourseFormSchema>

export const COURSE_FORM_DEFAULT_VALUES: CourseFormValues = {
  title: '',
  subTitle: undefined,
  description: undefined,
  price: 0,
  accessDurationDays: undefined,
  maxEnrollments: undefined,
  selfPaced: true,
  objectives: undefined,
  requirements: undefined,
  suitableFor: undefined,
  cmeCredits: undefined,
  certifyingOrganization: undefined,
  proctoringEnabled: false,
  proctoringCameraRequired: false,
  proctoringMaxInactivitySeconds: 60,
  proctoringPresenceEnabled: false,
  proctoringRandomMode: false,
  proctoringIntervalMinutes: 10,
  proctoringRandomMinMinutes: 5,
  proctoringRandomMaxMinutes: 15,
  proctoringMaxChecksPerVideo: 3,
}
