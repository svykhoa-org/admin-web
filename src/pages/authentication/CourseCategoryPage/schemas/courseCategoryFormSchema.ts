import { z } from 'zod'

export const createCourseCategoryFormSchema = () =>
  z.object({
    name: z.string().trim().min(2, 'Tên phải có ít nhất 2 ký tự').max(100),
    description: z.string().trim().optional(),
    parentId: z.string().uuid().optional(),
    icon: z.string().trim().optional(),
  })

type CourseCategoryFormSchema = ReturnType<typeof createCourseCategoryFormSchema>
export type CourseCategoryFormValues = z.input<CourseCategoryFormSchema>
export type CourseCategoryFormSubmitValues = z.output<CourseCategoryFormSchema>

export const COURSE_CATEGORY_FORM_DEFAULT_VALUES: CourseCategoryFormValues = {
  name: '',
  description: undefined,
  parentId: undefined,
  icon: undefined,
}
