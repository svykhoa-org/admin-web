import { useCallback, useEffect, useRef, useState } from 'react'
import type { RequestState } from './types'
import type { ApiListData } from '@/types/api'
import type { SetStateAction } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface UseListOptions<TItem, TParams extends object> {
  /** Params khởi tạo. Nếu có, hook sẽ tự fetch ngay khi mount. */
  initialParams?: TParams
  onSuccess?: (data: ApiListData<TItem>) => void
  onError?: (error: unknown) => void
}

export interface ListHookResult<TItem, TParams extends object> extends RequestState<
  ApiListData<TItem>
> {
  items: TItem[]
  /** Params hiện tại — dùng để bind pagination/filter/sort từ UI. */
  params: TParams
  /** Cập nhật toàn bộ params (hỗ trợ object hoặc updater function). */
  setParams: (update: SetStateAction<TParams>) => void
  /** Cập nhật một key cụ thể trong params. */
  setParam: <K extends keyof TParams>(key: K, value: TParams[K]) => void
  /** Fetch lại với params hiện tại (dùng sau create/delete). */
  refresh: () => void
  reset: () => void
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Hook quản lý danh sách theo params generic.
 *
 * - Tự fetch khi `params` thay đổi.
 * - Hook không biết `searcher/sorter/operator` là gì.
 * - Toàn bộ mapping params -> query string đặt trong `requestFn` (service layer).
 *
 * @example
 * const { items, params, setParams, refresh } = useList(
 *   listDocumentClassify,
 *   { initialParams: { page: 1, pageSize: 10 } },
 * )
 */
export function useList<TItem, TParams extends object = Record<string, never>>(
  requestFn: (params: TParams) => Promise<ApiListData<TItem>>,
  options?: UseListOptions<TItem, TParams>,
): ListHookResult<TItem, TParams> {
  const { initialParams, onSuccess, onError } = options ?? {}

  const [params, setParams] = useState<TParams>((initialParams ?? {}) as TParams)
  const [data, setData] = useState<ApiListData<TItem> | null>(null)
  const [error, setError] = useState<unknown | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Dùng ref để callbacks không làm effect re-run
  const onSuccessRef = useRef(onSuccess)
  const onErrorRef = useRef(onError)
  const requestFnRef = useRef(requestFn)
  onSuccessRef.current = onSuccess
  onErrorRef.current = onError
  requestFnRef.current = requestFn

  const fetchWithParams = useCallback(async (nextParams: TParams) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await requestFnRef.current(nextParams)
      setData(response)
      onSuccessRef.current?.(response)
      return response
    } catch (err) {
      setError(err)
      onErrorRef.current?.(err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Auto-fetch mỗi khi params thay đổi
  useEffect(() => {
    void fetchWithParams(params)
  }, [fetchWithParams, params])

  const setParam = useCallback(<K extends keyof TParams>(key: K, value: TParams[K]) => {
    setParams(prev => ({ ...prev, [key]: value }))
  }, [])

  const refresh = useCallback(() => {
    setParams(prev => ({ ...prev }))
  }, [])

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setIsLoading(false)
    setParams((initialParams ?? {}) as TParams)
  }, [initialParams])

  return {
    items: data?.items ?? [],
    data,
    error,
    isLoading,
    params,
    setParams,
    setParam,
    refresh,
    reset,
  }
}
