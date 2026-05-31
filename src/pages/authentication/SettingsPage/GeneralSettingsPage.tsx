import { Card, Typography } from 'antd'
import { GeneralSettingsForm } from './components/GeneralSettingsForm'

export const GeneralSettingsPage = () => (
  <Card>
    <Typography.Title level={3} style={{ marginTop: 0, marginBottom: 4 }}>
      Cài đặt chung
    </Typography.Title>
    <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>
      Cấu hình chung của hệ thống
    </Typography.Text>
    <GeneralSettingsForm />
  </Card>
)
