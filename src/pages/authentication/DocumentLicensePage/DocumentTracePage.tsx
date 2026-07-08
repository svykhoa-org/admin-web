import { useState } from 'react'
import { App, Button, Card, Descriptions, Tag, Typography, Upload } from 'antd'
import type { UploadFile } from 'antd'
import { FileSearchOutlined, InboxOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { traceDocument, type TraceDocumentOutput } from '@/services/DocumentLicense'
import { isApiResponseError } from '@/utils/apiResponse'
import { formatTimestamp } from '@/utils/time/formatTimestamp'
import { RoutePath } from '@/router/RoutePath'

const viaLabelMap: Record<'metadata' | 'microtext', string> = {
  metadata: 'Metadata PDF',
  microtext: 'Lớp chìm micro-text',
}

export const DocumentTracePage = () => {
  const navigate = useNavigate()
  const { message } = App.useApp()

  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<TraceDocumentOutput | null>(null)

  const handleTrace = async () => {
    if (!file) return

    setLoading(true)
    setResult(null)
    try {
      const output = await traceDocument({ file })
      setResult(output)
    } catch (error) {
      const errorMessage = isApiResponseError(error)
        ? error.message
        : 'Truy vết thất bại, vui lòng thử lại'
      void message.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <Typography.Title level={3} style={{ marginBottom: 4 }}>
          Truy vết tài liệu
        </Typography.Title>
        <Typography.Paragraph type="secondary">
          Tải lên file PDF nghi bị phát tán trái phép. Hệ thống sẽ đọc các lớp watermark (metadata,
          micro-text) để xác định license và người mua gốc.
        </Typography.Paragraph>

        <Upload.Dragger
          accept=".pdf"
          maxCount={1}
          fileList={
            file ? [{ uid: 'trace-file', name: file.name, status: 'done' } as UploadFile] : []
          }
          beforeUpload={selected => {
            setFile(selected)
            setResult(null)
            return false
          }}
          onRemove={() => {
            setFile(null)
            setResult(null)
          }}
          className="rounded-lg"
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">Kéo thả hoặc bấm để chọn file PDF</p>
        </Upload.Dragger>

        <Button
          type="primary"
          icon={<FileSearchOutlined />}
          onClick={() => void handleTrace()}
          disabled={!file}
          loading={loading}
          className="mt-4 rounded-lg"
        >
          Truy vết
        </Button>
      </Card>

      {result && !result.matched && (
        <Card className="shadow-sm">
          <Typography.Title level={5} type="warning" style={{ marginTop: 0 }}>
            Không tìm thấy dấu vết SVYKHOA trong tài liệu này
          </Typography.Title>
        </Card>
      )}

      {result?.matched &&
        result.license &&
        (() => {
          const license = result.license
          return (
            <Card title="Đã tìm thấy nguồn phát tán" className="shadow-sm">
              <Descriptions bordered column={1} size="middle">
                <Descriptions.Item label="Phương thức phát hiện">
                  <Tag color={result.via === 'metadata' ? 'blue' : 'purple'}>
                    {result.via ? viaLabelMap[result.via] : '-'}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Người mua">
                  {license.user.fullName} ({license.user.email})
                </Descriptions.Item>
                <Descriptions.Item label="Tài liệu">{license.document.title}</Descriptions.Item>
                <Descriptions.Item label="Mã watermark">
                  {license.watermarkCode || <Typography.Text type="secondary">-</Typography.Text>}
                </Descriptions.Item>
                <Descriptions.Item label="Mã đơn hàng">
                  {license.orderId || <Typography.Text type="secondary">-</Typography.Text>}
                </Descriptions.Item>
                <Descriptions.Item label="Ngày cấp license">
                  {formatTimestamp(license.createdAt)}
                </Descriptions.Item>
              </Descriptions>

              <Button
                className="mt-4 rounded-lg"
                onClick={() => navigate(RoutePath.DocumentLicenseDetailPage.getPath(license.id))}
              >
                Xem license
              </Button>
            </Card>
          )
        })()}
    </div>
  )
}
