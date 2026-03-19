export type Identifier = string | number

/**
 * Cấu hình chung cho mọi hook request.
 * - `immediate`: tự gọi request khi mount.
 * - `initialParams`: params dùng cho lần gọi tự động.
 */
export interface UseRequestOptions<TData, TParams extends unknown[]> {
  immediate?: boolean
  initialParams?: TParams
  onSuccess?: (data: TData) => void
  onError?: (error: unknown) => void
}

/**
 * Trạng thái chuẩn của một request async.
 */
export interface RequestState<TData> {
  data: TData | null
  error: unknown | null
  isLoading: boolean
}

/**
 * Kết quả chuẩn của hook request.
 */
export interface RequestHookResult<TData, TParams extends unknown[]> extends RequestState<TData> {
  execute: (...params: TParams) => Promise<TData>
  reset: () => void
}
