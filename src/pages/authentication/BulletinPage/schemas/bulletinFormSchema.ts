import { z } from 'zod'
import { BulletinImportance } from '@/models/Bulletin'

const optionalTrimmed = z.string().trim().optional()
const nullableId = z.string().nullable().optional()
const hasText = (html: string) => html.replace(/<[^>]*>/g, '').trim().length > 0

export const bulletinFormSchema = z.object({
  title: z.string().trim().min(2, 'Tiêu đề phải có ít nhất 2 ký tự').max(300, 'Tối đa 300 ký tự'),
  summary: optionalTrimmed,
  content: z.string().refine(hasText, 'Nội dung không được để trống'),
  thumbnailAssetId: nullableId,
  categoryId: nullableId,
  importance: z.nativeEnum(BulletinImportance),
  pinnedUntil: z.string().nullable().optional(),
  expiresAt: z.string().nullable().optional(),
  isFeatured: z.boolean().optional(),
  featuredRank: z.number().nullable().optional(),
})

export type BulletinFormValues = z.input<typeof bulletinFormSchema>
export type BulletinFormSubmitValues = z.output<typeof bulletinFormSchema>

export const BULLETIN_FORM_DEFAULT_VALUES: BulletinFormValues = {
  title: '',
  summary: undefined,
  content: '',
  thumbnailAssetId: null,
  categoryId: null,
  importance: BulletinImportance.NORMAL,
  pinnedUntil: null,
  expiresAt: null,
  isFeatured: false,
  featuredRank: null,
}
