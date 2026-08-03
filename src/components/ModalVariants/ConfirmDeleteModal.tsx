import { DeleteOutlined } from '@ant-design/icons'
import { Modal, Typography } from 'antd'

interface Props {
  open: boolean
  /** Số lượng item sẽ bị xóa. */
  count: number
  isLoading?: boolean
  onConfirm: () => void
  onCancel: () => void
  /** Cảnh báo bổ sung về tác dụng phụ của việc xóa (vd: ảnh hưởng dữ liệu liên quan). */
  extraWarning?: React.ReactNode
}

export const ConfirmDeleteModal = ({
  open,
  count,
  isLoading,
  onConfirm,
  onCancel,
  extraWarning,
}: Props) => (
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
    {extraWarning && (
      <Typography.Text type="warning" style={{ display: 'block', marginTop: 8 }}>
        {extraWarning}
      </Typography.Text>
    )}
  </Modal>
)
