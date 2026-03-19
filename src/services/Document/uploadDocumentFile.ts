import { uploadResource } from '@/services/Resource'
import type { UploadResourceInput, UploadResourceOutput } from '@/services/Resource/uploadResource'

export type UploadDocumentFileInput = UploadResourceInput
export type UploadDocumentFileOutput = UploadResourceOutput

export async function uploadDocumentFile(
  input: UploadDocumentFileInput,
): Promise<UploadDocumentFileOutput> {
  return uploadResource(input)
}
