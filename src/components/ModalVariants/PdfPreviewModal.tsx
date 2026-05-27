import { DownloadOutlined, MinusOutlined, PlusOutlined } from '@ant-design/icons'
import { Button, Modal, Space, Spin, Typography } from 'antd'
import { useState } from 'react'
import { Document, Page } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

// ─── URL resolution ───────────────────────────────────────────────────────────

const FILE_BASE_URL = import.meta.env.VITE_API_FILE_URL as string | undefined

function resolveUrl(raw: string): string {
  if (!FILE_BASE_URL || raw.startsWith('http://') || raw.startsWith('https://')) return raw
  return `${FILE_BASE_URL}${raw.startsWith('/') ? '' : '/'}${raw}`
}

// ─── Zoom config ──────────────────────────────────────────────────────────────

const ZOOM_LEVELS = [0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0]
const DEFAULT_ZOOM_INDEX = 2

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  open: boolean
  title?: string
  url?: string
  onCancel: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export const PdfPreviewModal = ({ open, title, url, onCancel }: Props) => {
  const [numPages, setNumPages] = useState(0)
  const [zoomIndex, setZoomIndex] = useState(DEFAULT_ZOOM_INDEX)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)

  const resolvedUrl = url ? resolveUrl(url) : undefined
  const scale = ZOOM_LEVELS[zoomIndex]
  const zoomLabel = `${Math.round(scale * 100)}%`

  function handleLoadSuccess({ numPages: n }: { numPages: number }) {
    setNumPages(n)
    setIsLoading(false)
    setLoadError(false)
  }

  function handleLoadError() {
    setIsLoading(false)
    setLoadError(true)
  }

  function handleAfterClose() {
    setNumPages(0)
    setZoomIndex(DEFAULT_ZOOM_INDEX)
    setIsLoading(true)
    setLoadError(false)
  }

  return (
    <Modal
      open={open}
      title={
        <Space>
          <Typography.Text strong>{title ?? 'Xem PDF'}</Typography.Text>
          {resolvedUrl && (
            <a href={resolvedUrl} download rel="noopener noreferrer">
              <Button type="text" size="small" icon={<DownloadOutlined />}>
                Tải xuống
              </Button>
            </a>
          )}
        </Space>
      }
      footer={null}
      width={960}
      onCancel={onCancel}
      destroyOnHidden
      afterClose={handleAfterClose}
      styles={{ body: { padding: 0 } }}
    >
      {!resolvedUrl ? (
        <div className="flex items-center justify-center py-16">
          <Typography.Text type="secondary">Không có tài liệu để xem.</Typography.Text>
        </div>
      ) : (
        <div className="flex flex-col">
          {/* ── Toolbar ── */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-background sticky top-0 z-10">
            <Space>
              <Button
                size="small"
                icon={<MinusOutlined />}
                disabled={zoomIndex === 0}
                onClick={() => setZoomIndex(i => i - 1)}
              />
              <span className="text-sm w-12 text-center select-none">{zoomLabel}</span>
              <Button
                size="small"
                icon={<PlusOutlined />}
                disabled={zoomIndex === ZOOM_LEVELS.length - 1}
                onClick={() => setZoomIndex(i => i + 1)}
              />
            </Space>
            {numPages > 0 && (
              <Typography.Text type="secondary" className="text-xs">
                {numPages} trang
              </Typography.Text>
            )}
          </div>

          {/* ── PDF scroll area ── */}
          <div className="overflow-y-auto bg-gray-100" style={{ height: '70vh' }}>
            {isLoading && !loadError && (
              <div className="flex items-center justify-center py-16">
                <Spin size="large" />
              </div>
            )}

            {loadError && (
              <div className="flex items-center justify-center py-16">
                <Typography.Text type="danger">
                  Không thể tải PDF. Vui lòng thử lại.
                </Typography.Text>
              </div>
            )}

            <Document
              file={resolvedUrl}
              onLoadSuccess={handleLoadSuccess}
              onLoadError={handleLoadError}
              loading={null}
              className="flex flex-col items-center gap-3 py-4"
            >
              {Array.from({ length: numPages }, (_, i) => (
                <Page
                  key={i + 1}
                  pageNumber={i + 1}
                  scale={scale}
                  className="shadow-md"
                  loading={null}
                />
              ))}
            </Document>
          </div>
        </div>
      )}
    </Modal>
  )
}
