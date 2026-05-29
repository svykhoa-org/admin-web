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
}
