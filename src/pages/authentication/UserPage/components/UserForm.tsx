import { useCreate } from '@/hooks'
import { createAdmin, type CreateAdminInput } from '@/services/User'
import { isApiResponseError } from '@/utils/apiResponse'
import { zodResolver } from '@hookform/resolvers/zod'
import { MODULE_PERMISSIONS } from '@/models/Permission'
import { App, Button, Card, Checkbox, Form, Input, Space, Switch, Typography } from 'antd'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import {
  USER_FORM_DEFAULT_VALUES,
  userFormSchema,
  type UserFormSubmitValues,
  type UserFormValues,
} from '../schemas/userFormSchema'

export const UserForm = () => {
  const navigate = useNavigate()
  const { message } = App.useApp()

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<UserFormValues, unknown, UserFormSubmitValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: USER_FORM_DEFAULT_VALUES,
  })
  const fullAccess = useWatch({ control, name: 'fullAccess' })

  const createRequest = useCreate(createAdmin)

  const onSubmit = async (values: UserFormSubmitValues) => {
    const payload: CreateAdminInput = {
      fullName: values.fullName,
      email: values.email,
      password: values.password,
      ...(values.fullAccess ? {} : { permissions: values.permissions }),
    }

    try {
      const createdUser = await createRequest.execute(payload)
      void message.success('Tạo Admin thành công')
      navigate(`/users/${createdUser.id}`, { replace: true })
    } catch (error) {
      const errorMessage = isApiResponseError(error)
        ? error.message
        : 'Không thể tạo Admin. Vui lòng thử lại.'
      void message.error(errorMessage)
    }
  }

  return (
    <Card>
      <Space orientation="vertical" size={20} style={{ width: '100%' }}>
        <div>
          <Typography.Title level={3} style={{ marginBottom: 4 }}>
            Tạo Admin
          </Typography.Title>
          <Typography.Text type="secondary">
            Tạo tài khoản quản trị mới bằng email, họ tên và mật khẩu.
          </Typography.Text>
        </div>

        <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
          <Form.Item
            label="Họ tên"
            validateStatus={errors.fullName ? 'error' : ''}
            help={errors.fullName?.message}
            required
          >
            <Controller
              name="fullName"
              control={control}
              render={({ field }) => <Input {...field} placeholder="Ví dụ: Nguyễn Văn A" />}
            />
          </Form.Item>

          <Form.Item
            label="Email"
            validateStatus={errors.email ? 'error' : ''}
            help={errors.email?.message}
            required
          >
            <Controller
              name="email"
              control={control}
              render={({ field }) => <Input {...field} placeholder="admin@domain.com" />}
            />
          </Form.Item>

          <Form.Item
            label="Mật khẩu"
            validateStatus={errors.password ? 'error' : ''}
            help={errors.password?.message}
            required
          >
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <Input.Password
                  {...field}
                  autoComplete="new-password"
                  placeholder="Nhập mật khẩu"
                />
              )}
            />
          </Form.Item>

          <Form.Item label="Quyền quản trị">
            <Space orientation="vertical" size={12} className="w-full">
              <Controller
                name="fullAccess"
                control={control}
                render={({ field }) => (
                  <Space>
                    <Switch checked={field.value} onChange={field.onChange} />
                    <Typography.Text>Toàn quyền</Typography.Text>
                  </Space>
                )}
              />
              {!fullAccess && (
                <Controller
                  name="permissions"
                  control={control}
                  render={({ field }) => (
                    <Checkbox.Group
                      value={field.value}
                      onChange={field.onChange}
                      className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2"
                      options={MODULE_PERMISSIONS}
                    />
                  )}
                />
              )}
            </Space>
          </Form.Item>

          <Space>
            <Button onClick={() => navigate('/users', { replace: true })}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={createRequest.isLoading}>
              Tạo mới
            </Button>
          </Space>
        </Form>
      </Space>
    </Card>
  )
}
