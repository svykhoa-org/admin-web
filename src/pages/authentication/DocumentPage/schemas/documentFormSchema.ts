import { fileResourceSchema } from '@/components/UploadFileResource/schemas/fileResourceSchema'
import { z } from 'zod'

const DOCUMENT_TITLE_MIN_LENGTH = 2
const DOCUMENT_TITLE_MAX_LENGTH = 200

const optionalTrimmedString = z.string().trim().optional()

export const documentFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(DOCUMENT_TITLE_MIN_LENGTH, `Tiêu đề phải có ít nhất ${DOCUMENT_TITLE_MIN_LENGTH} ký tự`)
    .max(DOCUMENT_TITLE_MAX_LENGTH, `Tiêu đề tối đa ${DOCUMENT_TITLE_MAX_LENGTH} ký tự`),
  description: optionalTrimmedString,
  price: z
    .number({
      error: 'Giá phải là số',
    })
    .nonnegative('Giá phải lớn hơn hoặc bằng 0'),
  categoryId: optionalTrimmedString,
  thumbnailId: z
    .string()
    .nullable()
    .refine(v => v !== null, 'Vui lòng tải lên ảnh đại diện'),
  fileResource: fileResourceSchema
    .nullable()
    .refine(value => value !== null, 'Vui lòng tải lên một tệp tài liệu'),
  previewId: z
    .string()
    .nullable()
    .refine(v => v !== null, 'Vui lòng tải lên Preview PDF'),
})

export type DocumentFormValues = z.input<typeof documentFormSchema>
export type DocumentFormSubmitValues = z.output<typeof documentFormSchema>

export const DOCUMENT_FORM_DEFAULT_VALUES: DocumentFormValues = {
  title: '',
  description: undefined,
  price: 0,
  categoryId: undefined,
  thumbnailId: null,
  fileResource: null,
  previewId: null,
}
