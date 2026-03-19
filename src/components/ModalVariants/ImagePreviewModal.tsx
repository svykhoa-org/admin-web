import { Image, Modal, Typography } from 'antd'

interface Props {
  open: boolean
  title?: string
  imageUrl?: string
  onCancel: () => void
}

export const ImagePreviewModal = ({ open, title, imageUrl, onCancel }: Props) => (
  <Modal
    open={open}
    title={title || 'Xem ảnh'}
    footer={null}
    width={900}
    onCancel={onCancel}
    destroyOnHidden
  >
    {imageUrl ? (
      <Image src={imageUrl} alt={title || 'image-preview'} style={{ width: '100%' }} />
    ) : (
      <Typography.Text type="secondary">Không có ảnh để xem trước.</Typography.Text>
    )}
  </Modal>
)
