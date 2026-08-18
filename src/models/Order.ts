import type { AbstractModel } from './AbstractModel'

export enum OrderProductType {
  COURSE = 'COURSE',
  DOCUMENT = 'DOCUMENT',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum OrderPaymentMethod {
  SEPAY = 'SEPAY',
  FREE = 'FREE',
}

export enum CommercialOrderStatus {
  OPEN = 'OPEN',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export enum OrderPaymentProjection {
  NOT_REQUIRED = 'NOT_REQUIRED',
  UNPAID = 'UNPAID',
  PAID = 'PAID',
  PARTIALLY_REFUNDED = 'PARTIALLY_REFUNDED',
  REFUNDED = 'REFUNDED',
  REVIEW_REQUIRED = 'REVIEW_REQUIRED',
}

export enum FulfillmentProjection {
  NOT_STARTED = 'NOT_STARTED',
  PENDING = 'PENDING',
  FULFILLED = 'FULFILLED',
  FAILED = 'FAILED',
  REVOKED = 'REVOKED',
}

export interface Order extends AbstractModel {
  orderCode: string
  userId: string
  user?: {
    id: string
    fullName: string
    email: string
    avatar?: string | null
  }
  productType: OrderProductType
  productId: string
  productName: string
  status: OrderStatus
  paymentMethod: OrderPaymentMethod
  totalAmount: number
  currency: string
  paidAt: number | null
  paymentMetadata: Record<string, unknown> | null
  providerTransactionId: string | null
  purchaseScopeKey?: string | null
  purchaseFingerprint?: string | null
  fingerprintVersion?: number | null
  commercialStatus?: CommercialOrderStatus | null
  subtotalMinor?: string | null
  discountMinor?: string | null
  totalMinor?: string | null
  paymentStatus?: OrderPaymentProjection | null
  fulfillmentStatus?: FulfillmentProjection | null
  aggregateVersion?: number | null
}
