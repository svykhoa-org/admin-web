import AppLayout from '@/layouts/AppLayout'
import DashboardPage from '@/pages/authentication/DashboardPage/DashboardPage'
import { DocumentClassifyCreatePage } from '@/pages/authentication/DocumentClassifyPage/DocumentClassifyCreatePage'
import { DocumentClassifyListPage } from '@/pages/authentication/DocumentClassifyPage/DocumentClassifyListPage'
import { DocumentClassifyUpdatePage } from '@/pages/authentication/DocumentClassifyPage/DocumentClassifyUpdatePage'
import { DocumentOrderDetailPage } from '@/pages/authentication/DocumentOrderPage/DocumentOrderDetailPage'
import { DocumentOrderListPage } from '@/pages/authentication/DocumentOrderPage/DocumentOrderListPage'
import { DocumentCreatePage } from '@/pages/authentication/DocumentPage/DocumentCreatePage'
import { DocumentListPage } from '@/pages/authentication/DocumentPage/DocumentListPage'
import { DocumentUpdatePage } from '@/pages/authentication/DocumentPage/DocumentUpdatePage'
import { UserCreatePage } from '@/pages/authentication/UserPage/UserCreatePage'
import { UserDetailPage } from '@/pages/authentication/UserPage/UserDetailPage'
import { UserListPage } from '@/pages/authentication/UserPage/UserListPage'
import LoginPage from '@/pages/unauthentication/LoginPage'
import NotFoundPage from '@/pages/unauthentication/NotFoundPage'
import { createBrowserRouter } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            path: '/',
            element: <DashboardPage />,
          },
          {
            path: '/document-classify',
            children: [
              {
                index: true,
                element: <DocumentClassifyListPage />,
              },
              {
                path: 'create',
                element: <DocumentClassifyCreatePage />,
              },
              {
                path: ':id/edit',
                element: <DocumentClassifyUpdatePage />,
              },
            ],
          },
          {
            path: '/documents',
            children: [
              {
                index: true,
                element: <DocumentListPage />,
              },
              {
                path: 'create',
                element: <DocumentCreatePage />,
              },
              {
                path: ':id/edit',
                element: <DocumentUpdatePage />,
              },
            ],
          },
          {
            path: '/document-orders',
            children: [
              {
                index: true,
                element: <DocumentOrderListPage />,
              },
              {
                path: ':id',
                element: <DocumentOrderDetailPage />,
              },
            ],
          },
          {
            path: '/users',
            children: [
              {
                index: true,
                element: <UserListPage />,
              },
              {
                path: 'create',
                element: <UserCreatePage />,
              },
              {
                path: ':id',
                element: <UserDetailPage />,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])

export default router
