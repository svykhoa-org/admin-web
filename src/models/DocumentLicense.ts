import type { AbstractModel } from './AbstractModel'
import type { Document } from './Document'
import type { DocumentOrder } from './DocumentOrder'
import type { User } from './User'

export enum DocumentLicenseStatus {
  ACTIVE = 'ACTIVE',
  REVOKED = 'REVOKED',
}

export interface DocumentLicense extends AbstractModel {
  userId: string
  user?: User
  documentId: string
  document?: Document
  documentOrderId: string
  documentOrder?: DocumentOrder
  status: DocumentLicenseStatus
  revokedAt: number | null // timestamp
  revokedBy: string | null
  revokeReason: string | null
}
