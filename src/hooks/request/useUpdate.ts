import { useRequest } from './useRequest'
import type { Identifier, UseRequestOptions } from './types'

/**
 * Hook cập nhật (update) độc lập tầng API.
 */
export function useUpdate<TData, TPayload = Partial<TData>, TId extends Identifier = string>(
  requestFn: (id: TId, payload: TPayload) => Promise<TData>,
  options?: UseRequestOptions<TData, [TId, TPayload]>,
) {
  return useRequest<TData, [TId, TPayload]>(requestFn, options)
}
