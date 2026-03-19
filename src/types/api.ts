export interface ApiDetailResponse<T> {
  statusCode: number
  message: string
  data: T
}

export interface PaginationMeta {
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
  hasNext?: boolean
  hasPrevious?: boolean
}

export interface ApiListData<T> {
  items: T[]
  pagination: PaginationMeta
}

export interface ApiListResponse<T> {
  statusCode: number
  message: string
  data: ApiListData<T>
}
