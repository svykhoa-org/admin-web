import type { AbstractModel } from './AbstractModel'

export enum PhysicalCertificateStatus {
  NONE = 'none',
  PENDING = 'pending',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
}

export interface Certificate extends AbstractModel {
  enrollmentId: string
  userId: string
  courseId: string
  certificateCode: string
  issuedAt: string
  digitalUrl?: string | null
  physicalStatus: PhysicalCertificateStatus
  physicalAddress?: Record<string, unknown> | null
  physicalRequestedAt?: string | null
  physicalShippedAt?: string | null
  courseSnapshot?: Record<string, unknown>
}
