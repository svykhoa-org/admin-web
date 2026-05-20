import type { FileResource } from '@/models/FileResource'
import { getAssetAccessUrl, uploadSingleAsset } from '@/services/Asset'
import { mapAssetToFileResource } from './assetResource'
import { UploadMultipleFile } from './base/UploadMultipleFile'
import type { FileItemRenderProps, UploadFileFn } from './base/UploadMultipleFile'
import { FileItemStatus } from './types'
import { getFileIconInfo } from './utils'

// ─── Upload fn ────────────────────────────────────────────────────────────────

const uploadFn: UploadFileFn<FileResource> = (file, signal, onProgress) => {
  return uploadSingleAsset(file, signal, onProgress).then(async asset => {
    const url = await getAssetAccessUrl(asset.id).catch(() => undefined)
    return mapAssetToFileResource(asset, url)
  })
}

// ─── File item ────────────────────────────────────────────────────────────────

function DocumentFileItem({ item, onRemove }: FileItemRenderProps<FileResource>) {
  const resource = item.result
  const name = resource?.originalName ?? resource?.fileName ?? item.file.name
  const { Icon, colorClass, label } = getFileIconInfo(name, resource?.mimeType)

  return (
    <div className="upload-file-item">
      {/* File type icon */}
      <div className="shrink-0 w-7">
        {item.status === FileItemStatus.Uploading && (
          <span className="text-primary text-xl">↑</span>
        )}
        {item.status === FileItemStatus.Done && (
          <Icon style={{ fontSize: 22 }} className={colorClass} />
        )}
        {item.status === FileItemStatus.Error && <span className="text-danger text-xl">!</span>}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900 truncate">{name}</div>

        {item.status === FileItemStatus.Uploading && (
          <div className="flex items-center gap-2 mt-1">
            <div className="upload-progress-track flex-1">
              <div className="upload-progress-fill" style={{ width: `${item.progress}%` }} />
            </div>
            <span className="text-xs text-gray-400 shrink-0">{item.progress}%</span>
          </div>
        )}

        {item.status === FileItemStatus.Done && (
          <div className="text-xs text-gray-400 mt-0.5">
            {label}
            {item.file.size ? ` · ${(item.file.size / 1048576).toFixed(1)} MB` : ''}
          </div>
        )}

        {item.status === FileItemStatus.Error && (
          <div className="text-xs text-danger mt-0.5">{item.error}</div>
        )}
      </div>

      {/* Open link */}
      {item.status === FileItemStatus.Done && resource?.url && (
        <a href={resource.url} target="_blank" rel="noopener noreferrer">
          <button className="text-xs text-gray-400 hover:text-gray-600 transition-colors shrink-0">
            Mở
          </button>
        </a>
      )}

      {/* Remove */}
      <button
        onClick={onRemove}
        className="text-xs text-gray-400 hover:text-danger transition-colors shrink-0"
      >
        Xoá
      </button>
    </div>
  )
}

// ─── Public types ─────────────────────────────────────────────────────────────

export interface UploadMultipleDocumentProps {
  onChange?: (resources: FileResource[]) => void
  maxSizeMB?: number
  maxCount?: number
  disabled?: boolean
}

// ─── Component ────────────────────────────────────────────────────────────────

export function UploadMultipleDocument({
  onChange,
  maxSizeMB,
  maxCount,
  disabled,
}: UploadMultipleDocumentProps) {
  return (
    <UploadMultipleFile<FileResource>
      uploadFn={uploadFn}
      onChange={onChange}
      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
      maxSizeMB={maxSizeMB}
      maxCount={maxCount}
      disabled={disabled}
      hint="Hỗ trợ: PDF, Word, Excel, PowerPoint, TXT"
      downloadUrl={resource => resource.url}
      renderFileItem={props => <DocumentFileItem {...props} />}
    />
  )
}
