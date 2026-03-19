import { useRequest } from './useRequest'
import type { UseRequestOptions } from './types'

/**
 * Hook tạo mới (create) độc lập tầng API.
 */
export function useCreate<TData, TPayload = Partial<TData>>(
  requestFn: (payload: TPayload) => Promise<TData>,
  options?: UseRequestOptions<TData, [TPayload]>,
) {
  return useRequest<TData, [TPayload]>(requestFn, options)
}
