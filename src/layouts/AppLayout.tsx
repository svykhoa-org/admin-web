import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { Layout, Menu, Avatar, Dropdown, Button, Typography, theme, type MenuProps } from 'antd'
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  FolderOpenOutlined,
  FileTextOutlined,
  ProfileOutlined,
  SafetyCertificateOutlined,
  LogoutOutlined,
  TeamOutlined,
  UserOutlined,
  PlaySquareOutlined,
} from '@ant-design/icons'
import { useAuthStore } from '@/store/authStore'
import logo from '@/assets/logo.png'

const { Sider, Header, Content } = Layout
const { Text } = Typography

export default function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore(s => s.user)
  const logout = useAuthStore(s => s.logout)
  const { token } = theme.useToken()

  const sideMenuItems: MenuProps['items'] = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/users',
      icon: <TeamOutlined />,
      label: 'Người dùng',
    },
    {
      key: '/courses',
      icon: <PlaySquareOutlined />,
      label: 'Khoá học',
    },
    {
      key: '/document-classify',
      icon: <FolderOpenOutlined />,
      label: 'Loại tài liệu',
    },
    {
      key: '/documents',
      icon: <FileTextOutlined />,
      label: 'Tài liệu',
    },
    {
      key: '/document-orders',
      icon: <ProfileOutlined />,
      label: 'Đơn hàng tài liệu',
    },
    {
      key: '/document-licenses',
      icon: <SafetyCertificateOutlined />,
      label: 'License tài liệu',
    },
  ]

  const menuRouteKeys = sideMenuItems
    .map(item => item?.key)
    .filter((key): key is string => typeof key === 'string')

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
          className={`flex h-16 items-center justify-center overflow-hidden whitespace-nowrap ${collapsed ? 'px-2' : 'px-4'}`}
        >
          <img
            src={logo}
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
      </Layout>
    </Layout>
  )
}
