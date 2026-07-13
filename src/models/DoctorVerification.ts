import type { AbstractModel } from './AbstractModel'

// Mirror of the server VerificationStatus enum (record status).
export enum VerificationStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  REJECTED = 'rejected',
}

export interface DoctorVerification extends AbstractModel {
  userId: string
  fullNameOnLicense: string
  personalId: string
  licenseNumber: string
  scopeOfPractice: string
  issuingAuthority: string
  issuedDate: string
  expiryDate: string
  licenseFileAssetId: string
  workplace?: string | null
  academicTitle?: string | null
  phone?: string | null
  status: VerificationStatus
  reviewedBy?: string | null
  reviewedAt?: string | null
  rejectionReason?: string | null
  user?: {
    id: string
    fullName: string
    email: string
    avatar?: string | null
  }
}

// Shape returned by GET /verification/admin/:id (detail + presigned licence URL).
export interface DoctorVerificationDetail {
  verification: DoctorVerification
  licenseFileUrl: string
}
