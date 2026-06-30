import type { ReactNode } from 'react'
import {
  DashboardOutlined,
  FolderOpenOutlined,
  FileTextOutlined,
  SafetyCertificateOutlined,
  ShoppingOutlined,
  TeamOutlined,
  PlaySquareOutlined,
  TagsOutlined,
  AppstoreOutlined,
  OrderedListOutlined,
  VideoCameraOutlined,
  FlagOutlined,
  FormatPainterOutlined,
  MessageOutlined,
} from '@ant-design/icons'

export enum ItemType {
  LINK,
  GROUP,
}

export type SideMenuLink = {
  type: ItemType.LINK
  key: string
  icon: ReactNode
  label: string
}

export type SideMenuGroup = {
  type: ItemType.GROUP
  key: string
  label: string
  children: SideMenuLink[]
}

export type SideMenuEntry = SideMenuLink | SideMenuGroup

export const sideMenuConfig: SideMenuEntry[] = [
  {
    type: ItemType.LINK,
    key: '/',
    icon: <DashboardOutlined />,
    label: 'Dashboard',
  },
  {
    type: ItemType.GROUP,
    key: 'GROUP_USER',
    label: 'Quản lý người dùng',
    children: [
      {
        type: ItemType.LINK,
        key: '/users',
        icon: <TeamOutlined />,
        label: 'Người dùng',
      },
    ],
  },
  {
    type: ItemType.GROUP,
    key: 'GROUP_COURSE',
    label: 'Quản lý khoá học',
    children: [
      {
        type: ItemType.LINK,
        key: '/courses',
        icon: <PlaySquareOutlined />,
        label: 'Khoá học',
      },
      {
        type: ItemType.LINK,
        key: '/course-categories',
        icon: <AppstoreOutlined />,
        label: 'Danh mục khoá học',
      },
      {
        type: ItemType.LINK,
        key: '/course-tags',
        icon: <TagsOutlined />,
        label: 'Tag khoá học',
      },
      {
        type: ItemType.LINK,
        key: '/enrollments',
        icon: <OrderedListOutlined />,
        label: 'Đăng ký khoá học',
      },
      {
        type: ItemType.LINK,
        key: '/certificates',
        icon: <SafetyCertificateOutlined />,
        label: 'Chứng chỉ',
      },
    ],
  },
  {
    type: ItemType.GROUP,
    key: 'GROUP_VIDEO',
    label: 'Quản lý video',
    children: [
      {
        type: ItemType.LINK,
        key: '/videos',
        icon: <VideoCameraOutlined />,
        label: 'Kho Video',
      },
    ],
  },
  {
    type: ItemType.GROUP,
    key: 'GROUP_DOCUMENT',
    label: 'Quản lý tài liệu',
    children: [
      {
        type: ItemType.LINK,
        key: '/documents',
        icon: <FileTextOutlined />,
        label: 'Tài liệu',
      },
      {
        type: ItemType.LINK,
        key: '/document-classify',
        icon: <FolderOpenOutlined />,
        label: 'Loại tài liệu',
      },
      {
        type: ItemType.LINK,
        key: '/document-licenses',
        icon: <SafetyCertificateOutlined />,
        label: 'License tài liệu',
      },
    ],
  },
  {
    type: ItemType.GROUP,
    key: 'GROUP_ORDER',
    label: 'Quản lý đơn hàng',
    children: [
      {
        type: ItemType.LINK,
        key: '/orders',
        icon: <ShoppingOutlined />,
        label: 'Đơn hàng',
      },
    ],
  },
  {
    type: ItemType.GROUP,
    key: 'GROUP_FORUM',
    label: 'Quản lý diễn đàn',
    children: [
      {
        type: ItemType.LINK,
        key: '/forum/structure',
        icon: <AppstoreOutlined />,
        label: 'Cấu trúc diễn đàn',
      },
      {
        type: ItemType.LINK,
        key: '/forum/prefix-tags',
        icon: <FormatPainterOutlined />,
        label: 'Prefix Tag',
      },
      {
        type: ItemType.LINK,
        key: '/forum/threads',
        icon: <MessageOutlined />,
        label: 'Kiểm duyệt bài viết',
      },
      {
        type: ItemType.LINK,
        key: '/forum/reports',
        icon: <FlagOutlined />,
        label: 'Báo cáo vi phạm',
      },
    ],
  },
]
