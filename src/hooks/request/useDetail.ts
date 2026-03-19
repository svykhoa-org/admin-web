import { useRequest } from './useRequest'
import type { Identifier, UseRequestOptions } from './types'

/**
 * Option cho hook lấy chi tiết.
 */
export interface UseDetailOptions<TData, TId extends Identifier> extends Omit<
  UseRequestOptions<TData, [TId]>,
  'initialParams'
> {
  initialId?: TId
}

/**
 * Hook detail độc lập tầng API: nhận `requestFn` từ service.
 */
export function useDetail<TData, TId extends Identifier = string>(
  requestFn: (id: TId) => Promise<TData>,
  options?: UseDetailOptions<TData, TId>,
) {
  return useRequest<TData, [TId]>(requestFn, {
    immediate: options?.immediate,
    initialParams: options?.immediate && options.initialId ? [options.initialId] : undefined,
    onSuccess: options?.onSuccess,
    onError: options?.onError,
  })
}
