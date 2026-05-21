import { z } from 'zod'

export const createCourseTagFormSchema = () =>
  z.object({
    name: z.string().trim().min(2, 'Tên tag phải có ít nhất 2 ký tự').max(50),
    description: z.string().trim().optional(),
    color: z.string().trim().optional(),
  })

type CourseTagFormSchema = ReturnType<typeof createCourseTagFormSchema>
export type CourseTagFormValues = z.input<CourseTagFormSchema>
export type CourseTagFormSubmitValues = z.output<CourseTagFormSchema>

export const COURSE_TAG_FORM_DEFAULT_VALUES: CourseTagFormValues = {
  name: '',
  description: undefined,
  color: undefined,
}
