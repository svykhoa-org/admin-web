import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Dropdown, Button, Result, Typography, theme, type MenuProps } from 'antd'
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  LogoutOutlined,
  SettingOutlined,
} from '@ant-design/icons'
import { UploadTray } from '@/components/UploadTray'
import { useAuthStore } from '@/store/authStore'
import { UserAvatar } from '@/components/UserAvatar'
import { hasPermission } from '@/models/Permission'
import { UserRole } from '@/models/User'
import { getRoutePermission } from '@/router/routePermissions'
import fallbackLogo from '@/assets/logo.png'
import { ItemType, sideMenuConfig, type SideMenuEntry } from './sideMenuConfig'
import classNames from 'classnames'
import { useSiteSettingsStore } from '@/store/siteSettingsStore'
import { resolveUploadUrl } from '@/components/Upload/assetResource'
import { RoutePath } from '@/router/RoutePath'
import { APP_VERSION } from '@/constants/version'

const { Sider, Header, Content } = Layout
const { Text } = Typography

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore(s => s.user)
  const logout = useAuthStore(s => s.logout)
  const refreshProfile = useAuthStore(s => s.refreshProfile)
  const { token } = theme.useToken()
  const { settings, fetchSettings } = useSiteSettingsStore()

  useEffect(() => {
    void fetchSettings()
    void refreshProfile().catch(() => undefined)
  }, [])

  // Menu and pages follow the admin's module permissions (UI only — the server
  // enforces them). Creating staff accounts is super-admin only.
  const canAccessPath = (path: string) => {
    if (path === RoutePath.UserCreatePage.path) return user?.role === UserRole.SuperAdmin
    const permission = getRoutePermission(path)
    return !permission || hasPermission(user, permission)
  }

  useEffect(() => {
    const name = settings?.siteName ?? 'Admin'
    document.title = `${name} CMS`
  }, [settings?.siteName])

  const logoSrc = resolveUploadUrl(settings?.logoUrl || '') ?? fallbackLogo

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

  const visibleMenuConfig = sideMenuConfig
    .map(entry =>
      entry.type === ItemType.GROUP
        ? { ...entry, children: entry.children.filter(child => canAccessPath(child.key)) }
        : entry,
    )
    .filter(entry =>
      entry.type === ItemType.GROUP ? entry.children.length > 0 : canAccessPath(entry.key),
    )

  const sideMenuItems = buildMenuItems(visibleMenuConfig)

  const menuRouteKeys = visibleMenuConfig.flatMap(entry =>
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
        className="[&_.ant-layout-sider-children]:flex [&_.ant-layout-sider-children]:flex-col [&_.ant-layout-sider-children]:overflow-hidden"
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

        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          <Menu
            theme="light"
            mode="inline"
            selectedKeys={[selectedMenuKey]}
            items={sideMenuItems}
            onClick={({ key }) => navigate(key)}
            style={{ border: 'none' }}
          />
        </div>

        <div style={{ borderTop: `1px solid ${token.colorBorderSecondary}` }}>
          {canAccessPath(RoutePath.SettingsPage.path) && (
            <Menu
              theme="light"
              mode="inline"
              selectedKeys={
                location.pathname.startsWith(RoutePath.SettingsPage.path)
                  ? [RoutePath.SettingsPage.path]
                  : []
              }
              items={[
                {
                  key: RoutePath.SettingsPage.path,
                  icon: <SettingOutlined />,
                  label: 'Cài đặt',
                },
              ]}
              onClick={() => navigate(RoutePath.SettingsPage.path)}
              style={{ border: 'none' }}
            />
          )}
          <div
            className="flex items-center justify-center py-2"
            style={{ borderTop: `1px solid ${token.colorBorderSecondary}` }}
          >
            <Text style={{ fontSize: 11, color: token.colorTextTertiary }}>v{APP_VERSION}</Text>
          </div>
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
              <UserAvatar fullName={user?.fullName} avatar={user?.avatar} />
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
          {canAccessPath(location.pathname) ? (
            <Outlet />
          ) : (
            <Result
              status="403"
              title="Không có quyền truy cập"
              subTitle="Tài khoản của bạn chưa được cấp quyền cho chức năng này."
            />
          )}
        </Content>
        <UploadTray />
      </Layout>
    </Layout>
  )
}
