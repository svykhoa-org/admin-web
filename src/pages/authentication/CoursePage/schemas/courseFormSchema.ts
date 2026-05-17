import { z } from 'zod'
import type { FlatNamespace, TFunction } from 'i18next'

export const createCourseFormSchema = (t: TFunction<FlatNamespace[]>) => {
  const titleField = t('CourseLocales:title')
  const priceField = t('CourseLocales:price')
  const shortCodeField = t('CourseLocales:short_code')

  return z.object({
    title: z
      .string()
      .trim()
      .min(2, t('CommonLocales:FieldError.min_length', { field: titleField, value: 2 }))
      .max(200, t('CommonLocales:FieldError.max_length', { field: titleField, value: 200 })),
    subTitle: z.string().trim().max(300).optional(),
    description: z.string().trim().optional(),
    price: z.number({ error: t('CommonLocales:FieldError.invalid', { field: priceField }) }).gt(0, {
      error: t('CommonLocales:FieldError.greater_than', { field: priceField, value: 0 }),
    }),
    shortCode: z
      .string()
      .trim()
      .min(2, t('CommonLocales:FieldError.min_length', { field: shortCodeField, value: 2 }))
      .max(50, t('CommonLocales:FieldError.max_length', { field: shortCodeField, value: 50 }))
      .regex(/^[A-Z0-9_-]+$/i, t('CourseLocales:Invalid.short_code_format_invalid')),
    accessDurationDays: z.number().int().min(1).optional(),
    maxEnrollments: z.number().int().min(1).optional(),
    selfPaced: z.boolean().optional(),
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
  shortCode: '',
  accessDurationDays: undefined,
  maxEnrollments: undefined,
  selfPaced: true,
}
