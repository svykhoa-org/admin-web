import { z } from 'zod'

const USER_FULL_NAME_MIN_LENGTH = 2
const USER_FULL_NAME_MAX_LENGTH = 150
const USER_PASSWORD_MIN_LENGTH = 6
const USER_PASSWORD_MAX_LENGTH = 100

export const userFormSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(USER_FULL_NAME_MIN_LENGTH, `Họ tên phải có ít nhất ${USER_FULL_NAME_MIN_LENGTH} ký tự`)
    .max(USER_FULL_NAME_MAX_LENGTH, `Họ tên tối đa ${USER_FULL_NAME_MAX_LENGTH} ký tự`),
  email: z.email('Email không hợp lệ').trim(),
  password: z
    .string()
    .trim()
    .min(USER_PASSWORD_MIN_LENGTH, `Mật khẩu phải có ít nhất ${USER_PASSWORD_MIN_LENGTH} ký tự`)
    .max(USER_PASSWORD_MAX_LENGTH, `Mật khẩu tối đa ${USER_PASSWORD_MAX_LENGTH} ký tự`),
})

export type UserFormValues = z.input<typeof userFormSchema>
export type UserFormSubmitValues = z.output<typeof userFormSchema>

export const USER_FORM_DEFAULT_VALUES: UserFormValues = {
  fullName: '',
  email: '',
  password: '',
}
