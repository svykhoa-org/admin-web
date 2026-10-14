import { fileResourceSchema } from '@/components/UploadFileResource/schemas/fileResourceSchema'
import { DocumentKind } from '@/models/Document'
import { z } from 'zod'

const DOCUMENT_TITLE_MIN_LENGTH = 2
const DOCUMENT_TITLE_MAX_LENGTH = 200

const optionalTrimmedString = z.string().trim().optional()

// Kind-specific fields are validated in superRefine below so one RHF form can
// serve both kinds: PDF needs file + preview; VIDEO needs a library video.
export const documentFormSchema = z
  .object({
    kind: z.enum(DocumentKind),
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
    fileResource: fileResourceSchema.nullable(),
    previewId: z.string().nullable(),
    videoId: z.string().nullable(),
  })
  .superRefine((values, ctx) => {
    if (values.kind === DocumentKind.VIDEO) {
      if (!values.videoId) {
        ctx.addIssue({ code: 'custom', path: ['videoId'], message: 'Vui lòng chọn video' })
      }
      return
    }
    if (!values.fileResource) {
      ctx.addIssue({
        code: 'custom',
        path: ['fileResource'],
        message: 'Vui lòng tải lên một tệp tài liệu',
      })
    }
    if (!values.previewId) {
      ctx.addIssue({ code: 'custom', path: ['previewId'], message: 'Vui lòng tải lên Preview PDF' })
    }
  })

export type DocumentFormValues = z.input<typeof documentFormSchema>
export type DocumentFormSubmitValues = z.output<typeof documentFormSchema>

export const DOCUMENT_FORM_DEFAULT_VALUES: DocumentFormValues = {
  kind: DocumentKind.PDF,
  videoId: null,
  title: '',
  description: undefined,
  price: 0,
  categoryId: undefined,
  thumbnailId: null,
  fileResource: null,
  previewId: null,
}
