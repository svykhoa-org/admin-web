import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Avatar, Dropdown, Button, Typography, theme, type MenuProps } from 'antd'
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  UserOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import { UploadTray } from '@/components/UploadTray'
import { useAuthStore } from '@/store/authStore'
import fallbackLogo from '@/assets/logo.png'
import { ItemType, sideMenuConfig, type SideMenuEntry } from './sideMenuConfig'
import classNames from 'classnames'
import { useSiteSettingsStore } from '@/store/siteSettingsStore'
import { SettingsModal } from '@/components/ModalVariants/SettingsModal/SettingsModal'

const { Sider, Header, Content } = Layout
const { Text } = Typography

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore(s => s.user)
  const logout = useAuthStore(s => s.logout)
  const { token } = theme.useToken()
  const { settings, fetchSettings } = useSiteSettingsStore()

  useEffect(() => {
    void fetchSettings()
  }, [])

  useEffect(() => {
    const name = settings?.siteName ?? 'Admin'
    document.title = `${name} CMS`
  }, [settings?.siteName])

  const logoSrc = settings?.logoUrl ?? fallbackLogo

  const buildMenuItems = (config: SideMenuEntry[]): MenuProps['items'] =>
    config.map(entry => {
      if (entry.type === ItemType.GROUP) {
        return {
          key: entry.key,
          type: 'group' as const,
          label: (
            <div className="flex items-center gap-2 py-1">
              <div className="h-px flex-1 bg-neutral-500" />
              {!collapsed && (
                <>
                  <span className="whitespace-nowrap text-sm text-neutral-500">{entry.label}</span>
                  <div className="h-px flex-1 bg-neutral-500" />
                </>
              )}
            </div>
          ),
          children: entry.children.map(child => ({
            key: child.key,
            icon: child.icon,
            label: child.label,
          })),
        }
      }
      return { key: entry.key, icon: entry.icon, label: entry.label }
    })

  const sideMenuItems = buildMenuItems(sideMenuConfig)

  const menuRouteKeys = sideMenuConfig.flatMap(entry =>
    entry.type === ItemType.GROUP ? entry.children.map(c => c.key) : [entry.key],
  )

  const selectedMenuKey =
    [...menuRouteKeys]
      .filter(key => key !== '/')
      .sort((a, b) => b.length - a.length)
      .find(key => location.pathname.startsWith(key)) || location.pathname

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      danger: true,
    },
  ]

  const handleUserMenu: MenuProps['onClick'] = ({ key }) => {
    if (key === 'logout') {
      void logout().then(() => navigate('/login'))
    }
  }

  return (
    <Layout className="h-screen overflow-hidden">
      <Sider
        collapsible
        collapsed={collapsed}
        trigger={null}
        theme="light"
        width={240}
        style={{
          background: token.colorBgContainer,
          borderRight: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        <div
          className={classNames(
            'flex h-16 items-center justify-center overflow-hidden whitespace-nowrap transition-[padding] duration-200',
            collapsed ? 'px-2' : 'px-4',
          )}
        >
          <img
            src={logoSrc}
            alt="Admin logo"
            className={`w-auto object-contain transition-[height] duration-200 ${collapsed ? 'h-5' : 'h-9'}`}
          />
        </div>

        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[selectedMenuKey]}
          items={sideMenuItems}
          onClick={({ key }) => navigate(key)}
          style={{ border: 'none' }}
        />

        <div style={{ borderTop: `1px solid ${token.colorBorderSecondary}`, padding: '8px' }}>
          <button
            onClick={() => setSettingsOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              width: '100%',
              padding: collapsed ? '8px 0' : '8px 12px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              borderRadius: token.borderRadius,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: token.colorTextSecondary,
              fontSize: 13,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = token.colorFillSecondary)}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <SettingOutlined style={{ fontSize: 16 }} />
            {!collapsed && <span>Settings</span>}
          </button>
        </div>
      </Sider>

      <Layout className="overflow-hidden">
        <Header
          className="flex items-center justify-between px-4"
          style={{
            background: token.colorBgContainer,
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(c => !c)}
          />

          <Dropdown
            menu={{ items: userMenuItems, onClick: handleUserMenu }}
            placement="bottomRight"
          >
            <div className="flex cursor-pointer items-center gap-2">
              {user?.avatar ? (
                <Avatar src={user.avatar} />
              ) : (
                <Avatar icon={<UserOutlined />} style={{ backgroundColor: token.colorPrimary }} />
              )}
              <Text>{user?.fullName}</Text>
            </div>
          </Dropdown>
        </Header>

        <Content
          className="m-4 overflow-y-auto"
          style={{
            scrollbarWidth: 'none',
          }}
        >
          <Outlet />
        </Content>
        <UploadTray />
      </Layout>
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </Layout>
  )
}
