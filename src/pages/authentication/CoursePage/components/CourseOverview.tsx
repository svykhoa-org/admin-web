import { CourseStatus, type Course, type PolicySummary } from '@/models/Course'
import { RoutePath } from '@/router/RoutePath'
import { getPublishReadiness, type PublishReadiness } from '@/services/Course'
import { CheckCircleFilled, CloseCircleFilled } from '@ant-design/icons'
import { Alert, Card, Spin, Statistic, Tag, Typography } from 'antd'
import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

const PROGRESSION_LABELS: Record<PolicySummary['progressionMode'], string> = {
  free: 'Học tự do',
  sequential: 'Học tuần tự theo bài',
  module_sequential: 'Học tuần tự theo chương',
}

const formatDuration = (totalSeconds: number) => {
  const totalMinutes = Math.round(totalSeconds / 60)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return hours > 0 ? `${hours} giờ ${minutes} phút` : `${minutes} phút`
}

const describeAccess = (access: PolicySummary['access']) => {
  if (access.mode === 'days_after_enroll') return `Truy cập ${access.days} ngày`
  if (access.mode === 'until_course_end') return 'Truy cập tới hết đợt'
  return 'Truy cập trọn đời'
}

const describePolicy = (policy: PolicySummary) => {
  const { capacity, certificate, proctoring } = policy
  return [
    PROGRESSION_LABELS[policy.progressionMode],
    `Hoàn thành bài từ ${policy.lessonThresholdPercent}%`,
    describeAccess(policy.access),
    capacity.max === null ? 'Không giới hạn sĩ số' : `Sĩ số tối đa ${capacity.max}`,
    certificate.enabled ? 'Có chứng chỉ' : 'Không cấp chứng chỉ',
    proctoring.cameraRequired ? 'Bắt buộc camera' : null,
    proctoring.inactivityPause ? 'Tạm dừng khi không thao tác' : null,
    policy.requiresVerification ? 'Chỉ bác sĩ đã xác minh' : null,
  ].filter((label): label is string => label !== null)
}

const PublishChecklist = ({ course }: { course: Course }) => {
  const [readiness, setReadiness] = useState<PublishReadiness | null>(null)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    let isCurrent = true
    getPublishReadiness(course.id)
      .then(result => {
        if (isCurrent) setReadiness(result)
      })
      .catch(() => {
        if (isCurrent) setHasError(true)
      })
    return () => {
      isCurrent = false
    }
  }, [course.id, course.updatedAt])

  const fixLinkFor = (key: string) =>
    key === 'config'
      ? { to: RoutePath.CourseSettingsPage.getPath(course.id), label: 'Mở Cài đặt' }
      : { to: RoutePath.CourseContentPage.getPath(course.id), label: 'Mở Nội dung' }

  const isMissingSchedule = course.isScheduled && (!course.startDate || !course.endDate)

  return (
    <Card title="Điều kiện xuất bản">
      {hasError ? (
        <Typography.Text type="danger">Không tải được điều kiện xuất bản.</Typography.Text>
      ) : !readiness ? (
        <Spin />
      ) : (
        <div className="flex flex-col gap-3">
          {readiness.ready && (
            <Alert
              type="success"
              showIcon
              title="Khoá học đủ điều kiện. Bấm Xuất bản ở đầu trang khi đã sẵn sàng."
            />
          )}
          <ul className="m-0 flex list-none flex-col gap-2 p-0">
            {readiness.items.map(item => {
              const fixLink = fixLinkFor(item.key)
              return (
                <li
                  key={`${item.key}-${item.lessonId ?? item.message}`}
                  className="flex items-center gap-2"
                >
                  <Typography.Text type={item.ok ? 'success' : 'danger'}>
                    {item.ok ? <CheckCircleFilled /> : <CloseCircleFilled />}
                  </Typography.Text>
                  <span className="flex-1">{item.message}</span>
                  {!item.ok && <Link to={fixLink.to}>{fixLink.label}</Link>}
                </li>
              )
            })}
          </ul>
          {isMissingSchedule && (
            <Alert
              type="warning"
              showIcon
              title="Khoá theo đợt chưa đủ ngày bắt đầu và kết thúc. Việc này không chặn xuất bản."
              action={<Link to={RoutePath.CourseSettingsPage.getPath(course.id)}>Mở Cài đặt</Link>}
            />
          )}
        </div>
      )}
    </Card>
  )
}

const CourseStats = ({ course }: { course: Course }) => {
  const { data } = course
  return (
    <Card
      title="Số liệu khoá học"
      extra={
        data?.recomputedAt && (
          <Typography.Text type="secondary">
            Cập nhật {dayjs(data.recomputedAt).format('HH:mm DD/MM/YYYY')}
          </Typography.Text>
        )
      }
    >
      {data?.recomputedAt ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <Statistic title="Đang học" value={data.activeLearners} />
          <Statistic title="Hoàn thành" value={data.completedTotal} />
          <Statistic title="Chứng chỉ đã cấp" value={data.certificatesIssued} />
          <Statistic title="Số bài học" value={data.lessonCount} />
          <Statistic title="Thời lượng" value={formatDuration(data.totalDurationSeconds)} />
        </div>
      ) : (
        <Typography.Text type="secondary">Chưa có số liệu cho khoá học này.</Typography.Text>
      )}
    </Card>
  )
}

export const CourseOverview = ({ course }: { course: Course }) => (
  <div className="flex flex-col gap-4">
    {course.status !== CourseStatus.PUBLISHED && <PublishChecklist course={course} />}
    {course.status !== CourseStatus.DRAFT && <CourseStats course={course} />}
    {course.policySummary && (
      <Card
        title="Luật đang áp dụng"
        extra={<Link to={RoutePath.CourseSettingsPage.getPath(course.id)}>Sửa trong Cài đặt</Link>}
      >
        <div className="flex flex-wrap gap-2">
          {describePolicy(course.policySummary).map(label => (
            <Tag key={label}>{label}</Tag>
          ))}
        </div>
      </Card>
    )}
  </div>
)
