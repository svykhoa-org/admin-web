import { DeleteOutlined } from '@ant-design/icons'
import { Modal, Typography } from 'antd'

interface Props {
  open: boolean
  /** Số lượng item sẽ bị xóa. */
  count: number
  isLoading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export const ConfirmDeleteModal = ({ open, count, isLoading, onConfirm, onCancel }: Props) => (
  <Modal
    open={open}
    title={
      <span>
        <DeleteOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
        Xác nhận xóa
      </span>
    }
    okText="Xóa"
    cancelText="Hủy"
    okButtonProps={{ danger: true, loading: isLoading }}
    cancelButtonProps={{ disabled: isLoading }}
    onOk={onConfirm}
    onCancel={onCancel}
    closable={!isLoading}
    mask={!isLoading}
  >
    <Typography.Text>
      Bạn có chắc chắn muốn xóa{' '}
      <Typography.Text strong>
        {count} {count > 1 ? 'bản ghi' : 'bản ghi'}
      </Typography.Text>{' '}
      này không? Hành động này không thể hoàn tác.
    </Typography.Text>
  </Modal>
)
