import { useRequest } from '@/hooks'
import { MODULE_PERMISSIONS, Permission } from '@/models/Permission'
import type { User } from '@/models/User'
import { getUserPermissions, updateUserPermissions } from '@/services/User'
import { getApiErrorMessage } from '@/utils/apiResponse'
import { App, Button, Card, Checkbox, Space, Spin, Switch, Typography } from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'

interface Props {
  user: User
}

const sameSet = (a: string[], b: string[]) =>
  a.length === b.length && a.every(item => b.includes(item))

// Rendered for admin targets, viewed by a super admin (the permission
// endpoints reject everyone else).
export const UserPermissionCard = ({ user }: Props) => {
  const { message } = App.useApp()

  const fetchPermissions = useCallback((id: string) => getUserPermissions({ id }), [])
  const permissionsRequest = useRequest(fetchPermissions)
  const saveRequest = useRequest(updateUserPermissions)
  const { execute: loadPermissions, data: savedPermissions } = permissionsRequest

  const [fullAccess, setFullAccess] = useState(true)
  const [modules, setModules] = useState<Permission[]>([])

  const applySaved = useCallback((saved: string[]) => {
    setFullAccess(saved.includes(Permission.All))
    setModules(saved.filter(item => item !== Permission.All) as Permission[])
  }, [])

  useEffect(() => {
    loadPermissions(user.id)
      .then(applySaved)
      .catch(() => undefined)
  }, [applySaved, loadPermissions, user.id])

  const draft = useMemo(() => (fullAccess ? [Permission.All] : modules), [fullAccess, modules])
  const isDirty = savedPermissions ? !sameSet(draft, savedPermissions) : false

  const handleSavePermissions = async () => {
    try {
      await saveRequest.execute({ id: user.id, permissions: draft })
      void message.success('Đã cập nhật quyền quản trị')
      applySaved(await loadPermissions(user.id))
    } catch (error) {
      void message.error(getApiErrorMessage(error, 'Không thể cập nhật quyền. Vui lòng thử lại.'))
    }
  }

  return (
    <Card title="Quyền quản trị">
      <Spin spinning={permissionsRequest.isLoading}>
        <Space orientation="vertical" size={16} className="w-full">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Typography.Text strong>Toàn quyền</Typography.Text>
              <br />
              <Typography.Text type="secondary">
                Truy cập mọi chức năng quản trị, kể cả các chức năng thêm sau này.
              </Typography.Text>
            </div>
            <Switch checked={fullAccess} onChange={setFullAccess} />
          </div>

          {!fullAccess && (
            <Checkbox.Group
              value={modules}
              onChange={values => setModules(values)}
              className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2"
              options={MODULE_PERMISSIONS}
            />
          )}

          {!fullAccess && modules.length === 0 && (
            <Typography.Text type="warning">
              Chưa chọn chức năng nào — tài khoản vào được trang quản trị nhưng không dùng được chức
              năng nào.
            </Typography.Text>
          )}

          <div>
            <Button
              type="primary"
              disabled={!isDirty}
              loading={saveRequest.isLoading}
              onClick={handleSavePermissions}
            >
              Lưu quyền
            </Button>
          </div>
        </Space>
      </Spin>
    </Card>
  )
}
