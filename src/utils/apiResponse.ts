import axios from 'axios'
import type { ApiDetailResponse, ApiListData, ApiListResponse } from '@/types/api'

/**
 * Thrown when the HTTP response is 2xx but the BE embeds a non-success
 * statusCode in the response body (custom error convention).
 */
export class ApiResponseError extends Error {
  readonly statusCode: number

  constructor(statusCode: number, message: string) {
    super(message)
    this.name = 'ApiResponseError'
    this.statusCode = statusCode
  }
}

export function isApiResponseError(error: unknown): error is ApiResponseError {
  return error instanceof ApiResponseError
}

/**
 * User-facing message for a failed request.
 * - `ApiResponseError` (2xx body with error statusCode) → its message.
 * - HTTP 4xx → the server's `message` (the axios interceptor rejects non-2xx with the raw
 *   `AxiosError`, so `ApiResponseError` is never created for these).
 * - 5xx, network/timeout, non-JSON bodies (e.g. S3 XML) or anything else → `fallback`
 *   (5xx bodies only carry a generic "Internal server error").
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (isApiResponseError(error)) return error.message || fallback

  if (axios.isAxiosError<{ message?: unknown }>(error)) {
    const status = error.response?.status
    if (status === undefined || status < 400 || status >= 500) return fallback

    const message = error.response?.data?.message
    if (typeof message === 'string' && message.trim()) return message
    if (Array.isArray(message) && message.length > 0) return message.join(', ')
  }

  return fallback
}

/**
 * Unwrap a detail response body.
 * Throws `ApiResponseError` if `statusCode` is outside 2xx.
 */
export function unwrapDetail<T>(response: ApiDetailResponse<T>): T {
  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new ApiResponseError(response.statusCode, response.message)
  }
  return response.data
}

/**
 * Unwrap a list response body.
 * Throws `ApiResponseError` if `statusCode` is outside 2xx.
 */
export function unwrapList<T>(response: ApiListResponse<T>): ApiListData<T> {
  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new ApiResponseError(response.statusCode, response.message)
  }
  return response.data
}
