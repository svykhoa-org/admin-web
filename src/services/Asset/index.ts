import axiosInstance from '@/lib/axios'
import type { ApiDetailResponse } from '@/types/api'
import { unwrapDetail } from '@/utils/apiResponse'

const ASSET_ENDPOINT = '/assets'

export type AssetVisibility = 'PRIVATE' | 'PUBLIC'

export interface AssetRecord {
  id: string
  type: 'IMAGE' | 'VIDEO' | 'DOCUMENT'
  status: 'PENDING' | 'UPLOADING' | 'PROCESSING' | 'READY' | 'FAILED'
  originalName: string
  mimetype: string
  size?: number | null
  key?: string | null
  bucket?: string | null
  visibility: AssetVisibility
  metadata?: Record<string, unknown>
}

export interface RequestPresignedUploadInput {
  filename: string
  contentType: string
}

export interface RequestPresignedUploadOutput {
  assetId: string
  uploadUrl: string
  key: string
}

export interface MultipartPartInfo {
  partNumber: number
  url: string
}

export interface InitMultipartUploadInput {
  filename: string
  fileSize: number
  contentType: string
}

export interface InitMultipartUploadOutput {
  assetId: string
  uploadId: string
  key: string
  chunkSize: number
  totalParts: number
  parts: MultipartPartInfo[]
}

export interface MultipartServerPart {
  PartNumber: number
  ETag: string
}

export interface CompleteMultipartPart {
  partNumber: number
  etag: string
}

export async function uploadSingleAsset(
  file: File,
  signal?: AbortSignal,
  onProgress?: (loaded: number, total: number) => void,
): Promise<AssetRecord> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await axiosInstance.post<ApiDetailResponse<AssetRecord>>(
    `${ASSET_ENDPOINT}/upload`,
    formData,
    {
      signal,
      onUploadProgress: e => onProgress?.(e.loaded, e.total ?? file.size),
    },
  )

  return unwrapDetail(response.data)
}

export async function requestPresignedUpload(
  input: RequestPresignedUploadInput,
): Promise<RequestPresignedUploadOutput> {
  const response = await axiosInstance.post<ApiDetailResponse<RequestPresignedUploadOutput>>(
    `${ASSET_ENDPOINT}/upload/presigned`,
    input,
  )
  return unwrapDetail(response.data)
}

export async function confirmPresignedUpload(assetId: string): Promise<AssetRecord> {
  const response = await axiosInstance.post<ApiDetailResponse<AssetRecord>>(
    `${ASSET_ENDPOINT}/${assetId}/confirm`,
  )
  return unwrapDetail(response.data)
}

export async function initMultipartUpload(
  input: InitMultipartUploadInput,
): Promise<InitMultipartUploadOutput> {
  const response = await axiosInstance.post<ApiDetailResponse<InitMultipartUploadOutput>>(
    `${ASSET_ENDPOINT}/upload/multipart/init`,
    input,
  )
  return unwrapDetail(response.data)
}

export async function refreshMultipartPartUrls(
  assetId: string,
  partNumbers: number[],
): Promise<{ parts: MultipartPartInfo[] }> {
  const response = await axiosInstance.post<ApiDetailResponse<{ parts: MultipartPartInfo[] }>>(
    `${ASSET_ENDPOINT}/upload/multipart/${assetId}/refresh-parts`,
    { partNumbers },
  )
  return unwrapDetail(response.data)
}

export async function listMultipartParts(assetId: string): Promise<MultipartServerPart[]> {
  const response = await axiosInstance.get<ApiDetailResponse<MultipartServerPart[]>>(
    `${ASSET_ENDPOINT}/upload/multipart/${assetId}/parts`,
  )
  return unwrapDetail(response.data)
}

export async function completeMultipartUpload(
  assetId: string,
  parts: CompleteMultipartPart[],
): Promise<AssetRecord> {
  const response = await axiosInstance.post<ApiDetailResponse<AssetRecord>>(
    `${ASSET_ENDPOINT}/upload/multipart/${assetId}/complete`,
    {
      parts: parts.map(part => ({ PartNumber: part.partNumber, ETag: part.etag })),
    },
  )
  return unwrapDetail(response.data)
}

export async function abortMultipartUpload(assetId: string): Promise<void> {
  await axiosInstance.delete(`${ASSET_ENDPOINT}/upload/multipart/${assetId}/abort`)
}

const FILE_BASE_URL = import.meta.env.VITE_API_FILE_URL as string | undefined

/** Prepend the file storage domain when the API returns a relative path. */
export function resolveFileUrl(url: string): string {
  if (!FILE_BASE_URL || url.startsWith('http://') || url.startsWith('https://')) return url
  return `${FILE_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`
}

export async function getAssetAccessUrl(assetId: string, expires = 900): Promise<string> {
  const response = await axiosInstance.get<ApiDetailResponse<{ url: string }>>(
    `${ASSET_ENDPOINT}/${assetId}/url?expires=${expires}`,
  )
  return resolveFileUrl(unwrapDetail(response.data).url)
}
