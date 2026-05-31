import { SettingOutlined } from '@ant-design/icons'
import { Menu, theme, Typography } from 'antd'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'

const NAV_ITEMS = [
  {
    key: '/settings/general',
    label: 'Cài đặt chung',
    icon: <SettingOutlined />,
  },
]

export const SettingsLayout = () => {
  const { token } = theme.useToken()
  const navigate = useNavigate()
  const location = useLocation()

  const selectedKey =
    NAV_ITEMS.map(i => i.key)
      .sort((a, b) => b.length - a.length)
      .find(key => location.pathname.startsWith(key)) ?? NAV_ITEMS[0].key

  return (
    <div
      className="flex h-full overflow-hidden rounded-lg"
      style={{
        border: `1px solid ${token.colorBorderSecondary}`,
        background: token.colorBgContainer,
        minHeight: 'calc(100vh - 96px)',
      }}
    >
      <aside
        className="flex flex-col"
        style={{
          width: 240,
          borderRight: `1px solid ${token.colorBorderSecondary}`,
          background: token.colorFillQuaternary,
          flexShrink: 0,
        }}
      >
        <div style={{ padding: '20px 20px 12px' }}>
          <Typography.Title level={5} style={{ margin: 0 }}>
            Cài đặt
          </Typography.Title>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Quản lý cấu hình hệ thống
          </Typography.Text>
        </div>

        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          items={NAV_ITEMS}
          onClick={({ key }) => navigate(key)}
          style={{
            border: 'none',
            background: 'transparent',
            padding: '0 8px',
          }}
        />
      </aside>

      <section className="flex-1 overflow-auto" style={{ padding: '24px 32px' }}>
        <Outlet />
      </section>
    </div>
  )
}
