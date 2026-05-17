import type { AbstractModel } from './AbstractModel'

export enum EnrollmentStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  EXPIRED = 'expired',
  REFUNDED = 'refunded',
}

export interface Enrollment extends AbstractModel {
  userId: string
  courseId: string
  orderId?: string | null
  status: EnrollmentStatus
  enrolledAt: string
  expireAt?: string | null
  completedAt?: string | null
  refundedAt?: string | null
  progress: number
  pricePaid: number
  courseSnapshot?: Record<string, unknown>
}
