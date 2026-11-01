import { useDetail } from '@/hooks'
import {
  CourseStatus,
  CourseStatusMappingToColors,
  getCourseStatusMappingToLabels,
  type Course,
} from '@/models/Course'
import { RoutePath } from '@/router/RoutePath'
import { getCourseDetail } from '@/services/Course'
import {
  ArrowLeftOutlined,
  DashboardOutlined,
  FormOutlined,
  ReadOutlined,
  SettingOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import { Button, Card, Menu, Space, Spin, Tag, Tooltip, Typography } from 'antd'
import { useCallback, useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Outlet, useLocation, useNavigate, useParams } from 'react-router-dom'
import { CoursePublishButton } from './components/CoursePublishButton'

export interface CourseWorkspaceContext {
  course: Course
  refreshCourse: () => void
}

export const CourseWorkspaceLayout = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { t } = useTranslation(['CommonLocales', 'CourseLocales'])
  const statusLabels = useMemo(() => getCourseStatusMappingToLabels(t), [t])

  const fetchDetail = useCallback((detailId: string) => getCourseDetail({ id: detailId }), [])
  const { execute, data, error } = useDetail(fetchDetail)

  const refreshCourse = useCallback(() => {
    if (id) execute(id).catch(() => undefined)
  }, [execute, id])

  useEffect(() => {
    refreshCourse()
  }, [refreshCourse])

  // Ignore the previous course while navigating from one course to another.
  const course = data?.id === id ? data : null

  if (!id) return null

  if (!course) {
    return error ? (
      <Card>
        <Typography.Text type="secondary">Không tìm thấy khoá học.</Typography.Text>
      </Card>
    ) : (
      <div className="flex justify-center items-center py-20">
        <Spin size="large" />
      </div>
    )
  }

  const overviewPath = RoutePath.CourseOverviewPage.getPath(id)
  const contentPath = RoutePath.CourseContentPage.getPath(id)
  const learnersPath = RoutePath.CourseLearnersPage.getPath(id)
  const examsPath = RoutePath.CourseExamsPage.getPath(id)
  const settingsPath = RoutePath.CourseSettingsPage.getPath(id)
  const outletContext: CourseWorkspaceContext = { course, refreshCourse }

  return (
    <Space vertical size={16} style={{ width: '100%' }}>
      <div className="flex items-center gap-3">
        <Tooltip title="Về danh sách khoá học">
          <Button
            aria-label="Về danh sách khoá học"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(RoutePath.CoursePage.path)}
            type="text"
            size="small"
          />
        </Tooltip>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="m-0 truncate text-base font-semibold">{course.title}</h1>
            <Tag color={CourseStatusMappingToColors[course.status]} className="m-0">
              {statusLabels[course.status]}
            </Tag>
          </div>
          <Typography.Text type="secondary" className="text-xs">
            {course.shortCode} ·{' '}
            {course.price > 0 ? `${course.price.toLocaleString('vi-VN')} ₫` : 'Miễn phí'}
          </Typography.Text>
        </div>
        {course.status !== CourseStatus.PUBLISHED && (
          <CoursePublishButton courseId={id} onPublished={refreshCourse} />
        )}
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
        <Card
          className="w-full shrink-0 lg:sticky lg:top-0 lg:w-48"
          styles={{ body: { padding: 8 } }}
        >
          <nav aria-label="Quản lý khoá học">
            <Menu
              mode="inline"
              selectedKeys={[pathname.startsWith(`${examsPath}/`) ? examsPath : pathname]}
              onClick={({ key }) => navigate(key)}
              style={{ border: 'none' }}
              items={[
                { key: overviewPath, icon: <DashboardOutlined />, label: 'Tổng quan' },
                { key: contentPath, icon: <ReadOutlined />, label: 'Nội dung' },
                { key: learnersPath, icon: <TeamOutlined />, label: 'Học viên' },
                { key: examsPath, icon: <FormOutlined />, label: 'Bài kiểm tra' },
                { type: 'divider' },
                { key: settingsPath, icon: <SettingOutlined />, label: 'Cài đặt' },
              ]}
            />
          </nav>
        </Card>

        <div className="w-full min-w-0 flex-1">
          <Outlet context={outletContext} />
        </div>
      </div>
    </Space>
  )
}
