import type { FileResource } from '@/models/FileResource'
import { getAssetAccessUrl, uploadSingleAsset } from '@/services/Asset'
import { CloseOutlined, DownloadOutlined } from '@ant-design/icons'
import { Button } from 'antd'
import { mapAssetToFileResource } from './assetResource'
import { UploadSingleFile } from './base/UploadSingleFile'
import type { UploadFileFn } from './base/UploadSingleFile'
import { getFileIconInfo } from './utils'

// ─── Upload fn ────────────────────────────────────────────────────────────────

const uploadFn: UploadFileFn<FileResource> = (file, signal, onProgress) => {
  return uploadSingleAsset(file, signal, onProgress).then(async asset => {
    const url = await getAssetAccessUrl(asset.id).catch(() => undefined)
    return mapAssetToFileResource(asset, url)
  })
}

// ─── Public types ─────────────────────────────────────────────────────────────

export interface UploadSingleDocumentProps {
  onSuccess?: (resource: FileResource) => void
  onRemove?: (resource: FileResource) => void
  maxSizeMB?: number
  disabled?: boolean
}

// ─── Component ────────────────────────────────────────────────────────────────

export function UploadSingleDocument({
  onSuccess,
  onRemove,
  maxSizeMB,
  disabled,
}: UploadSingleDocumentProps) {
  return (
    <UploadSingleFile<FileResource>
      uploadFn={uploadFn}
      onSuccess={onSuccess}
      onRemove={onRemove}
      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
      maxSizeMB={maxSizeMB}
      disabled={disabled}
      placeholder="Kéo thả tài liệu vào đây hoặc bấm để chọn"
      hint="Hỗ trợ: PDF, Word, Excel, PowerPoint, TXT"
      renderSuccess={(resource, file, onReset, _previewUrl) => {
        const name = resource.originalName ?? resource.fileName ?? file.name
        const { Icon, colorClass, label } = getFileIconInfo(name, resource.mimeType)
        const size = resource.size ?? file.size
        return (
          <div className="upload-file-item">
            <Icon style={{ fontSize: 26 }} className={`shrink-0 ${colorClass}`} />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">{name}</div>
              <div className="text-xs text-gray-400 mt-0.5">
                {label}
                {size ? ` · ${(size / 1048576).toFixed(1)} MB` : ''}
              </div>
            </div>
            {resource.url && (
              <a href={resource.url} target="_blank" rel="noopener noreferrer">
                <Button
                  type="text"
                  size="small"
                  icon={<DownloadOutlined />}
                  className="shrink-0 text-gray-400"
                />
              </a>
            )}
            <Button
              type="text"
              size="small"
              icon={<CloseOutlined />}
              onClick={onReset}
              className="shrink-0 text-gray-400"
            />
          </div>
        )
      }}
    />
  )
}
