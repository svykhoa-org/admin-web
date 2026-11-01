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
  ReadOutlined,
  SettingOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import { Button, Card, Menu, Space, Spin, Tag, Typography } from 'antd'
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
  const settingsPath = RoutePath.CourseSettingsPage.getPath(id)
  const outletContext: CourseWorkspaceContext = { course, refreshCourse }

  return (
    <Space vertical size={16} style={{ width: '100%' }}>
      <Card>
        <Space className="w-full justify-between" wrap>
          <Space>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate(RoutePath.CoursePage.path)}
              type="text"
            />
            <div>
              <Space align="center">
                <Typography.Title level={4} style={{ margin: 0 }}>
                  {course.title}
                </Typography.Title>
                <Tag color={CourseStatusMappingToColors[course.status]}>
                  {statusLabels[course.status]}
                </Tag>
              </Space>
              <Typography.Text type="secondary">
                {course.shortCode} · {course.price.toLocaleString('vi-VN')} VNĐ
              </Typography.Text>
            </div>
          </Space>

          <Space>
            {course.status !== CourseStatus.PUBLISHED && (
              <CoursePublishButton courseId={id} onPublished={refreshCourse} />
            )}
          </Space>
        </Space>
      </Card>

      <div className="flex items-start gap-4">
        <Card className="w-48 shrink-0 sticky top-0" styles={{ body: { padding: 8 } }}>
          <nav aria-label="Quản lý khoá học">
            <Menu
              mode="inline"
              selectedKeys={[pathname]}
              onClick={({ key }) => navigate(key)}
              style={{ border: 'none' }}
              items={[
                { key: overviewPath, icon: <DashboardOutlined />, label: 'Tổng quan' },
                { key: contentPath, icon: <ReadOutlined />, label: 'Nội dung' },
                { key: learnersPath, icon: <TeamOutlined />, label: 'Học viên' },
                { type: 'divider' },
                { key: settingsPath, icon: <SettingOutlined />, label: 'Cài đặt' },
              ]}
            />
          </nav>
        </Card>

        <div className="flex-1 min-w-0">
          <Outlet context={outletContext} />
        </div>
      </div>
    </Space>
  )
}
