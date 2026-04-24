import { PlusOutlined } from '@ant-design/icons'
import { Button } from 'antd'

export interface CreateActionProps {
  onCreate?: () => void
}

export const CreateAction = ({ onCreate }: CreateActionProps) => {
  if (!onCreate) return null
  return (
    <Button onClick={onCreate} type="primary" icon={<PlusOutlined />}>
      Tạo mới
    </Button>
  )
}
