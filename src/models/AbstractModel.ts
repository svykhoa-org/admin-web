export interface AbstractModel {
  id: string
  createdAt: string | number
  updatedAt: string | number
  createdBy?: string | null
  updatedBy?: string | null
}
