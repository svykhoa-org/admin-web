import { z } from 'zod'

const DOCUMENT_CLASSIFY_NAME_MIN_LENGTH = 2
const DOCUMENT_CLASSIFY_NAME_MAX_LENGTH = 150

const optionalTrimmedString = z.string().trim().optional()

export const documentClassifyFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(
      DOCUMENT_CLASSIFY_NAME_MIN_LENGTH,
      `Tên phải có ít nhất ${DOCUMENT_CLASSIFY_NAME_MIN_LENGTH} ký tự`,
    )
    .max(
      DOCUMENT_CLASSIFY_NAME_MAX_LENGTH,
      `Tên tối đa ${DOCUMENT_CLASSIFY_NAME_MAX_LENGTH} ký tự`,
    ),
  parentId: optionalTrimmedString,
})

export type DocumentClassifyFormValues = z.infer<typeof documentClassifyFormSchema>

export const DOCUMENT_CLASSIFY_FORM_DEFAULT_VALUES: DocumentClassifyFormValues = {
  name: '',
  parentId: undefined,
}
