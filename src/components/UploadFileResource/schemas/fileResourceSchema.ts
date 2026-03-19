import type { FileResource } from '@/models/FileResource'
import { FileVisibility } from '@/models/FileResource'
import { z } from 'zod'

export const fileResourceSchema: z.ZodType<FileResource> = z
  .object({
    id: z.string().trim().min(1),
    originalName: z.string().nullish(),
    fileName: z.string().nullish(),
    filename: z.string().nullish(),
    mimeType: z.string().nullish(),
    mimetype: z.string().nullish(),
    size: z.number().nonnegative().nullish(),
    key: z.string().nullish(),
    bucket: z.string().nullish(),
    provider: z.string().nullish(),
    visibility: z.enum(FileVisibility).nullish(),
    url: z.string().nullish(),
    metadata: z.record(z.string(), z.unknown()).nullish(),
  })
  .transform(value => ({
    id: value.id,
    originalName: value.originalName ?? undefined,
    fileName: value.fileName ?? value.filename ?? undefined,
    mimeType: value.mimeType ?? value.mimetype ?? undefined,
    size: value.size ?? undefined,
    key: value.key ?? undefined,
    bucket: value.bucket ?? undefined,
    provider: value.provider ?? undefined,
    visibility: value.visibility ?? undefined,
    url: value.url ?? undefined,
    metadata: value.metadata ?? undefined,
  }))

export type FileResourceSchemaValues = z.infer<typeof fileResourceSchema>
