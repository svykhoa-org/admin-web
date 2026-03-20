import type { AbstractModel } from './AbstractModel'
import type { Document } from './Document'
import type { User } from './User'

export enum DocumentOrderStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum DocumentPaymentMethod {
  SEPAY = 'SEPAY',
}

export interface DocumentOrder extends AbstractModel {
  orderCode: string
  userId: string
  user?: User
  documentId: string
  document?: Document
  status: DocumentOrderStatus
  paymentMethod: DocumentPaymentMethod
  totalAmount: number
  currency: string
  paidAt: number | null // timestamp
  paymentMetadata: Record<string, unknown> | null
  providerTransactionId: string | null
}
