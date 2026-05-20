import AppLayout from '@/layouts/AppLayout'
import { CertificateListPage } from '@/pages/authentication/CertificatePage/CertificateListPage'
import { CourseCategoryCreatePage } from '@/pages/authentication/CourseCategoryPage/CourseCategoryCreatePage'
import { CourseCategoryDetailPage } from '@/pages/authentication/CourseCategoryPage/CourseCategoryDetailPage'
import { CourseCategoryListPage } from '@/pages/authentication/CourseCategoryPage/CourseCategoryListPage'
import { CourseCreatePage } from '@/pages/authentication/CoursePage/CourseCreatePage'
import { CourseDetailPage } from '@/pages/authentication/CoursePage/CourseDetailPage'
import { CourseListPage } from '@/pages/authentication/CoursePage/CourseListPage'
import { CourseTagCreatePage } from '@/pages/authentication/CourseTagPage/CourseTagCreatePage'
import { CourseTagDetailPage } from '@/pages/authentication/CourseTagPage/CourseTagDetailPage'
import { CourseTagListPage } from '@/pages/authentication/CourseTagPage/CourseTagListPage'
import DashboardPage from '@/pages/authentication/DashboardPage/DashboardPage'
import { DocumentClassifyCreatePage } from '@/pages/authentication/DocumentClassifyPage/DocumentClassifyCreatePage'
import { DocumentClassifyListPage } from '@/pages/authentication/DocumentClassifyPage/DocumentClassifyListPage'
import { DocumentClassifyUpdatePage } from '@/pages/authentication/DocumentClassifyPage/DocumentClassifyUpdatePage'
import { DocumentLicenseDetailPage } from '@/pages/authentication/DocumentLicensePage/DocumentLicenseDetailPage'
import { DocumentLicenseListPage } from '@/pages/authentication/DocumentLicensePage/DocumentLicenseListPage'
import { DocumentOrderDetailPage } from '@/pages/authentication/DocumentOrderPage/DocumentOrderDetailPage'
import { DocumentOrderListPage } from '@/pages/authentication/DocumentOrderPage/DocumentOrderListPage'
import { DocumentCreatePage } from '@/pages/authentication/DocumentPage/DocumentCreatePage'
import { DocumentListPage } from '@/pages/authentication/DocumentPage/DocumentListPage'
import { DocumentUpdatePage } from '@/pages/authentication/DocumentPage/DocumentUpdatePage'
import { EnrollmentListPage } from '@/pages/authentication/EnrollmentPage/EnrollmentListPage'
import { QuizDetailPage } from '@/pages/authentication/QuizPage/QuizDetailPage'
import { UserCreatePage } from '@/pages/authentication/UserPage/UserCreatePage'
import { UserDetailPage } from '@/pages/authentication/UserPage/UserDetailPage'
import { UserListPage } from '@/pages/authentication/UserPage/UserListPage'
import LoginPage from '@/pages/unauthentication/LoginPage'
import NotFoundPage from '@/pages/unauthentication/NotFoundPage'
import { createBrowserRouter } from 'react-router-dom'
import ProtectedRoute from './ProtectedRoute'
import { RoutePath } from './RoutePath'

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
            path: RoutePath.CoursePage.route,
            children: [
              {
                index: true,
                element: <CourseListPage />,
              },
              {
                path: RoutePath.CourseCreatePage.route,
                element: <CourseCreatePage />,
              },
              {
                path: RoutePath.CourseDetailPage.route,
                element: <CourseDetailPage />,
              },
            ],
          },
          {
            path: RoutePath.DocumentClassifyPage.route,
            children: [
              {
                index: true,
                element: <DocumentClassifyListPage />,
              },
              {
                path: RoutePath.DocumentClassifyCreatePage.route,
                element: <DocumentClassifyCreatePage />,
              },
              {
                path: RoutePath.DocumentClassifyUpdatePage.route,
                element: <DocumentClassifyUpdatePage />,
              },
            ],
          },
          {
            path: RoutePath.DocumentPage.route,
            children: [
              {
                index: true,
                element: <DocumentListPage />,
              },
              {
                path: RoutePath.DocumentCreatePage.route,
                element: <DocumentCreatePage />,
              },
              {
                path: RoutePath.DocumentUpdatePage.route,
                element: <DocumentUpdatePage />,
              },
            ],
          },
          {
            path: RoutePath.DocumentOrderPage.route,
            children: [
              {
                index: true,
                element: <DocumentOrderListPage />,
              },
              {
                path: RoutePath.DocumentOrderDetailPage.route,
                element: <DocumentOrderDetailPage />,
              },
            ],
          },
          {
            path: RoutePath.DocumentLicensePage.route,
            children: [
              {
                index: true,
                element: <DocumentLicenseListPage />,
              },
              {
                path: RoutePath.DocumentLicenseDetailPage.route,
                element: <DocumentLicenseDetailPage />,
              },
            ],
          },
          {
            path: RoutePath.CourseCategoryPage.route,
            children: [
              { index: true, element: <CourseCategoryListPage /> },
              {
                path: RoutePath.CourseCategoryCreatePage.route,
                element: <CourseCategoryCreatePage />,
              },
              {
                path: RoutePath.CourseCategoryDetailPage.route,
                element: <CourseCategoryDetailPage />,
              },
            ],
          },
          {
            path: RoutePath.CourseTagPage.route,
            children: [
              { index: true, element: <CourseTagListPage /> },
              { path: RoutePath.CourseTagCreatePage.route, element: <CourseTagCreatePage /> },
              { path: RoutePath.CourseTagDetailPage.route, element: <CourseTagDetailPage /> },
            ],
          },
          {
            path: 'quizzes',
            children: [{ path: ':id', element: <QuizDetailPage /> }],
          },
          {
            path: RoutePath.EnrollmentPage.route,
            children: [{ index: true, element: <EnrollmentListPage /> }],
          },
          {
            path: RoutePath.CertificatePage.route,
            children: [{ index: true, element: <CertificateListPage /> }],
          },
          {
            path: RoutePath.UserPage.route,
            children: [
              {
                index: true,
                element: <UserListPage />,
              },
              {
                path: RoutePath.UserCreatePage.route,
                element: <UserCreatePage />,
              },
              {
                path: RoutePath.UserDetailPage.route,
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
