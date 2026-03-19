import ENV from '@/constants/env'
import { FileVisibility, type FileResource } from '@/models/FileResource'

export const getPublicUrl = (file?: FileResource | null) => {
  if (file && file.visibility === FileVisibility.PUBLIC) {
    return `${ENV.API_FILE_URL}${file.url}`
  }
  return undefined
}
