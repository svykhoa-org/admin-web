import type { FileResource } from '@/models/FileResource'
import { DeleteOutlined, DownloadOutlined, EyeOutlined, InboxOutlined } from '@ant-design/icons'
import { Alert, Button, Space, Typography, Upload } from 'antd'
import type { UploadProps } from 'antd'
import { useMemo, useState } from 'react'

const { Dragger } = Upload

interface UploadFileResourceProps {
  value?: FileResource | null
  onChange?: (value: FileResource | undefined) => void
  uploadFile: (file: File) => Promise<FileResource>
  disabled?: boolean
  accept?: string
  maxSizeInMb?: number
  accessUrl?: string
}

export const UploadFileResource = ({
  value,
  onChange,
  uploadFile,
  disabled,
  accept,
  maxSizeInMb = 20,
  accessUrl,
}: UploadFileResourceProps) => {
  const [isUploading, setIsUploading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const maxSizeInBytes = useMemo(() => maxSizeInMb * 1024 * 1024, [maxSizeInMb])
  const displayedValue = value ?? null

  const handleCustomRequest: UploadProps['customRequest'] = async options => {
    const rawFile = options.file as File

    if (rawFile.size > maxSizeInBytes) {
      const message = `Dung lượng file tối đa ${maxSizeInMb}MB`
      setErrorMessage(message)
      options.onError?.(new Error(message))
      return
    }

    try {
      setErrorMessage(null)
      setIsUploading(true)
      const uploadedFile = await uploadFile(rawFile)
      onChange?.(uploadedFile)
      options.onSuccess?.(uploadedFile)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Tải file thất bại. Vui lòng thử lại.'
      setErrorMessage(message)
      options.onError?.(new Error(message))
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemove = () => {
    onChange?.(undefined)
    setErrorMessage(null)
  }

  const fileUrl = displayedValue?.url || accessUrl

  return (
    <Space direction="vertical" size={12} style={{ width: '100%' }}>
      <Dragger
        name="file"
        multiple={false}
        maxCount={1}
        disabled={disabled || isUploading}
        accept={accept}
        customRequest={handleCustomRequest}
        showUploadList={false}
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">Kéo thả file vào đây hoặc bấm để chọn file</p>
        <p className="ant-upload-hint">Hỗ trợ tải lên một file, tối đa {maxSizeInMb}MB.</p>
      </Dragger>

      {isUploading && <Alert type="info" message="Đang tải file lên..." showIcon />}
      {errorMessage && <Alert type="error" message={errorMessage} showIcon />}

      {displayedValue && (
        <Space
          style={{
            width: '100%',
            justifyContent: 'space-between',
            border: '1px solid #f0f0f0',
            borderRadius: 8,
            padding: 12,
          }}
        >
          <Space direction="vertical" size={2}>
            <Typography.Text strong>
              {displayedValue.originalName || displayedValue.fileName || 'Tệp đã tải lên'}
            </Typography.Text>
            {displayedValue.mimeType && (
              <Typography.Text type="secondary">{displayedValue.mimeType}</Typography.Text>
            )}
            {fileUrl && (
              <Space size={4}>
                <Button
                  type="link"
                  size="small"
                  icon={<EyeOutlined />}
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ padding: 0 }}
                >
                  Xem
                </Button>
                <Button
                  type="link"
                  size="small"
                  icon={<DownloadOutlined />}
                  href={fileUrl}
                  download
                  style={{ padding: 0 }}
                >
                  Tải xuống
                </Button>
              </Space>
            )}
          </Space>

          <Button
            danger
            type="text"
            icon={<DeleteOutlined />}
            onClick={handleRemove}
            disabled={disabled || isUploading}
          >
            Gỡ
          </Button>
        </Space>
      )}
    </Space>
  )
}
