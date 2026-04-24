import { DeleteOutlined } from '@ant-design/icons'
import { Button } from 'antd'

export interface DeleteActionProps {
  onDelete?: (selectedRowKeys: React.Key[]) => void
  disabled?: boolean
}

export const DeleteAction = ({ onDelete, disabled }: DeleteActionProps) => {
  if (!onDelete) return null
  return (
    <Button
      onClick={() => {
        onDelete([])
      }}
      type="primary"
      danger
      icon={<DeleteOutlined />}
      disabled={disabled}
    >
      Xoá
    </Button>
  )
}
