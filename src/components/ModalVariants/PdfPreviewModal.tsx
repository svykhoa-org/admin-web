import { Modal, Typography } from 'antd'

interface Props {
  open: boolean
  title?: string
  pdfUrl?: string
  onCancel: () => void
}

export const PdfPreviewModal = ({ open, title, pdfUrl, onCancel }: Props) => (
  <Modal
    open={open}
    title={title || 'Xem PDF'}
    footer={null}
    width={1000}
    onCancel={onCancel}
    destroyOnHidden
  >
    {pdfUrl ? (
      <iframe
        src={pdfUrl}
        title={title || 'pdf-preview'}
        style={{ width: '100%', height: '70vh', border: 0 }}
      />
    ) : (
      <Typography.Text type="secondary">Không có PDF để xem trước.</Typography.Text>
    )}
  </Modal>
)
