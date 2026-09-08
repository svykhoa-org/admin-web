import { z } from 'zod'

const TITLE_MIN = 2
const TITLE_MAX = 300

const optionalTrimmed = z.string().trim().optional()
const nullableId = z.string().nullable().optional()

const hasText = (html: string) => html.replace(/<[^>]*>/g, '').trim().length > 0

export const articleFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(TITLE_MIN, `Tiêu đề phải có ít nhất ${TITLE_MIN} ký tự`)
    .max(TITLE_MAX, `Tiêu đề tối đa ${TITLE_MAX} ký tự`),
  summary: z.string().trim().min(1, 'Vui lòng nhập mô tả ngắn'),
  content: z.string().refine(hasText, 'Nội dung không được để trống'),

  thumbnailAssetId: nullableId,

  categoryId: nullableId,

  authorUserId: nullableId,
  authorName: optionalTrimmed,
  authorTitle: optionalTrimmed,
  authorAvatarUrl: optionalTrimmed,

  reviewedByUserId: nullableId,
  reviewedAt: z.string().nullable().optional(),

  isFeatured: z.boolean().optional(),
  featuredRank: z.number().nullable().optional(),

  metaTitle: optionalTrimmed,
  metaDescription: optionalTrimmed,
  canonicalUrl: optionalTrimmed,
  ogImageAssetId: nullableId,
})

export type ArticleFormValues = z.input<typeof articleFormSchema>
export type ArticleFormSubmitValues = z.output<typeof articleFormSchema>

export const ARTICLE_FORM_DEFAULT_VALUES: ArticleFormValues = {
  title: '',
  summary: '',
  content: '',
  thumbnailAssetId: null,
  categoryId: null,
  authorUserId: null,
  authorName: undefined,
  authorTitle: undefined,
  authorAvatarUrl: undefined,
  reviewedByUserId: null,
  reviewedAt: null,
  isFeatured: false,
  featuredRank: null,
  metaTitle: undefined,
  metaDescription: undefined,
  canonicalUrl: undefined,
  ogImageAssetId: null,
}
