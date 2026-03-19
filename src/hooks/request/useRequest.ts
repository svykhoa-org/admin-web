import { useCallback, useEffect, useState } from 'react'
import type { RequestHookResult, UseRequestOptions } from './types'

/**
 * Hook nền tảng cho mọi request async.
 * Hook này không phụ thuộc vào axios hay endpoint cụ thể,
 * chỉ nhận `requestFn` từ service bên ngoài.
 */
export function useRequest<TData, TParams extends unknown[]>(
  requestFn: (...params: TParams) => Promise<TData>,
  options?: UseRequestOptions<TData, TParams>,
): RequestHookResult<TData, TParams> {
  const { immediate, initialParams, onSuccess, onError } = options ?? {}

  const [data, setData] = useState<TData | null>(null)
  const [error, setError] = useState<unknown | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const execute = useCallback(
    async (...params: TParams) => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await requestFn(...params)
        setData(response)
        onSuccess?.(response)
        return response
      } catch (err) {
        setError(err)
        onError?.(err)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [onError, onSuccess, requestFn],
  )

  const reset = useCallback(() => {
    setData(null)
    setError(null)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    if (!immediate || !initialParams) return
    void execute(...initialParams)
  }, [execute, immediate, initialParams])

  return {
    data,
    error,
    isLoading,
    execute,
    reset,
  }
}
