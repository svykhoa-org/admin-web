import { CourseStatus, type Course } from '@/models/Course'
import { RoutePath } from '@/router/RoutePath'
import {
  getCourseInsights,
  getPublishReadiness,
  type CourseInsights,
  type PublishReadiness,
} from '@/services/Course'
import {
  BellOutlined,
  CheckCircleFilled,
  CheckCircleOutlined,
  CloseCircleFilled,
  ExclamationCircleFilled,
  RightOutlined,
  SafetyCertificateOutlined,
  TeamOutlined,
  WalletOutlined,
} from '@ant-design/icons'
import {
  Alert,
  Button,
  Card,
  Empty,
  Popover,
  Spin,
  theme,
  Tooltip as AntTooltip,
  Typography,
} from 'antd'
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  LinearScale,
  Tooltip,
  type ChartOptions,
} from 'chart.js'
import dayjs from 'dayjs'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { Bar } from 'react-chartjs-2'
import { Link } from 'react-router-dom'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip)

const percentOf = (value: number, total: number) =>
  total > 0 ? Math.round((value / total) * 100) : 0

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

const Attention = ({ courseId, insights }: { courseId: string; insights: CourseInsights }) => {
  const { token } = theme.useToken()
  const learnersPath = RoutePath.CourseLearnersPage.getPath(courseId)
  const items = [
    {
      key: 'inactive',
      count: insights.summary.inactive,
      label: 'học viên không hoạt động trên 14 ngày',
      color: token.colorWarning,
      to: `${learnersPath}?filter=inactive`,
    },
    {
      key: 'quiz',
      count: insights.summary.quizFailed,
      label: 'lượt học viên có bài kiểm tra chưa đạt',
      color: token.colorError,
      to: `${learnersPath}?filter=quiz_failed`,
    },
  ].filter(item => item.count > 0)
  const total = items.reduce((sum, item) => sum + item.count, 0)

  if (total === 0) {
    return (
      <Typography.Text type="secondary" className="text-sm">
        <CheckCircleFilled style={{ color: token.colorSuccess }} /> Không có gì cần chú ý
      </Typography.Text>
    )
  }

  return (
    <Popover
      trigger="click"
      placement="bottomRight"
      title="Cần chú ý"
      content={
        <ul className="m-0 flex w-72 list-none flex-col gap-1 p-0">
          {items.map(item => (
            <li key={item.key}>
              <Link to={item.to} className="flex items-center gap-2 rounded-lg py-1">
                <ExclamationCircleFilled style={{ color: item.color }} />
                <span className="flex-1" style={{ color: token.colorText }}>
                  <strong>{item.count}</strong> {item.label}
                </span>
                <RightOutlined style={{ color: token.colorTextTertiary, fontSize: 10 }} />
              </Link>
            </li>
          ))}
        </ul>
      }
    >
      <Button
        icon={<BellOutlined />}
        style={{
          color: token.colorWarningText,
          background: token.colorWarningBg,
          borderColor: token.colorWarningBorder,
        }}
      >
        {total} cần chú ý
      </Button>
    </Popover>
  )
}

const OverviewCard = ({
  title,
  description,
  extra,
  children,
}: {
  title: string
  description?: ReactNode
  extra?: ReactNode
  children: ReactNode
}) => (
  <Card
    className="h-full"
    styles={{
      header: { borderBottom: 'none', paddingTop: 16, minHeight: 0 },
      body: { paddingTop: 12 },
    }}
    title={
      <div className="whitespace-normal">
        <div className="text-sm font-semibold">{title}</div>
        {description && (
          <Typography.Text type="secondary" className="text-xs font-normal">
            {description}
          </Typography.Text>
        )}
      </div>
    }
    extra={extra}
  >
    {children}
  </Card>
)

const Metric = ({
  icon,
  label,
  value,
  hint,
}: {
  icon: ReactNode
  label: string
  value: ReactNode
  hint: string
}) => {
  const { token } = theme.useToken()
  return (
    <Card styles={{ body: { padding: 16 } }}>
      <div className="flex items-start gap-3">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base"
          style={{ background: token.colorPrimaryBg, color: token.colorPrimary }}
        >
          {icon}
        </span>
        <div className="min-w-0">
          <Typography.Text type="secondary" className="text-xs">
            {label}
          </Typography.Text>
          <div className="truncate text-xl font-semibold leading-7">{value}</div>
          <Typography.Text type="secondary" className="text-xs">
            {hint}
          </Typography.Text>
        </div>
      </div>
    </Card>
  )
}

const LearnerHealth = ({ courseId, insights }: { courseId: string; insights: CourseInsights }) => {
  const { token } = theme.useToken()
  const { summary } = insights
  const learning = Math.max(summary.active - summary.stalled - summary.notStarted, 0)
  const segments = [
    { label: 'Đang học', value: learning, color: token.colorInfo },
    { label: 'Hoàn thành', value: summary.completed, color: token.colorSuccess },
    { label: 'Không hoạt động', value: summary.stalled, color: token.colorWarning },
    { label: 'Chưa bắt đầu', value: summary.notStarted, color: token.colorBorder },
    { label: 'Hết hạn', value: summary.expired, color: token.colorTextQuaternary },
  ]
  return (
    <OverviewCard
      title="Phân bố học viên"
      description={`${summary.enrolled} học viên, không gồm đã hoàn tiền`}
      extra={<Attention courseId={courseId} insights={insights} />}
    >
      <div className="flex h-2.5 gap-0.5" role="img" aria-label="Phân bố học viên theo tình trạng">
        {segments
          .filter(segment => segment.value > 0)
          .map(segment => (
            <AntTooltip key={segment.label} title={`${segment.label}: ${segment.value}`}>
              <div
                className="rounded-sm"
                style={{ flexGrow: segment.value, background: segment.color }}
              />
            </AntTooltip>
          ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
        {segments.map(segment => (
          <div key={segment.label}>
            <div className="flex items-center gap-1.5">
              <span
                className="inline-block h-2 w-2 rounded-sm"
                style={{ background: segment.color }}
              />
              <Typography.Text type="secondary" className="text-xs">
                {segment.label}
              </Typography.Text>
            </div>
            <div className="text-base font-semibold">
              {segment.value}{' '}
              <Typography.Text type="secondary" className="text-xs font-normal">
                {percentOf(segment.value, summary.enrolled)}%
              </Typography.Text>
            </div>
          </div>
        ))}
      </div>
    </OverviewCard>
  )
}

const BarRow = ({
  label,
  percent,
  value,
  tooltip,
}: {
  label: string
  percent: number | null
  value: ReactNode
  tooltip?: string
}) => {
  const { token } = theme.useToken()
  return (
    <AntTooltip title={tooltip}>
      <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)_5rem] items-center gap-3 text-sm">
        <span className="truncate">{label}</span>
        <div
          className="h-2 overflow-hidden rounded-sm"
          style={{ background: token.colorFillSecondary }}
        >
          {percent !== null && (
            <div
              className="h-full rounded-sm"
              style={{ width: `${percent}%`, background: token.colorPrimary }}
            />
          )}
        </div>
        <span className="text-right">{value}</span>
      </div>
    </AntTooltip>
  )
}

const LearningFunnel = ({ insights }: { insights: CourseInsights }) => {
  const { summary } = insights
  const steps = [
    { label: 'Đăng ký', value: summary.enrolled },
    { label: 'Bắt đầu học', value: summary.started },
    { label: 'Học quá nửa', value: summary.halfway },
    { label: 'Hoàn thành', value: summary.completed },
    { label: 'Nhận chứng chỉ', value: summary.certificates },
  ]
  return (
    <OverviewCard title="Phễu học tập" description="Số học viên qua từng giai đoạn">
      <div className="flex flex-col gap-4">
        {steps.map(step => {
          const percent = percentOf(step.value, summary.enrolled)
          return (
            <BarRow
              key={step.label}
              label={step.label}
              percent={percent}
              value={
                <>
                  <strong>{step.value}</strong>{' '}
                  <Typography.Text type="secondary" className="text-xs">
                    {percent}%
                  </Typography.Text>
                </>
              }
            />
          )
        })}
      </div>
    </OverviewCard>
  )
}

const QuizPassRates = ({ insights }: { insights: CourseInsights }) => (
  <OverviewCard title="Tỷ lệ đạt bài kiểm tra" description="Theo thứ tự trong giáo trình">
    {insights.quizzes.length === 0 ? (
      <Typography.Text type="secondary">Khoá học chưa có bài kiểm tra.</Typography.Text>
    ) : (
      <div className="flex max-h-48 flex-col gap-4 overflow-y-auto">
        {insights.quizzes.map(quiz => {
          const hasAttempts = quiz.attempted > 0
          return (
            <BarRow
              key={quiz.lessonId}
              label={quiz.title}
              percent={hasAttempts ? percentOf(quiz.passed, quiz.attempted) : null}
              tooltip={
                hasAttempts
                  ? `${quiz.title}: ${quiz.passed}/${quiz.attempted} học viên đạt${
                      quiz.averageScore !== null ? `, điểm trung bình ${quiz.averageScore}` : ''
                    }`
                  : `${quiz.title}: chưa có lượt làm`
              }
              value={
                hasAttempts ? (
                  <>
                    <strong>{percentOf(quiz.passed, quiz.attempted)}%</strong>{' '}
                    <Typography.Text type="secondary" className="text-xs">
                      {quiz.passed}/{quiz.attempted}
                    </Typography.Text>
                  </>
                ) : (
                  <Typography.Text type="secondary" className="text-xs">
                    Chưa có
                  </Typography.Text>
                )
              }
            />
          )
        })}
      </div>
    )}
  </OverviewCard>
)

const useBarOptions = (
  tooltipTitle: (index: number) => string,
  formatValue: (value: number) => string,
  yMax?: number,
): ChartOptions<'bar'> => {
  const { token } = theme.useToken()
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        displayColors: false,
        callbacks: {
          title: items => tooltipTitle(items[0].dataIndex),
          label: item => formatValue(Number(item.raw)),
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: token.colorTextSecondary, font: { size: 11 } },
      },
      y: {
        beginAtZero: true,
        max: yMax,
        grid: { color: token.colorBorderSecondary },
        border: { display: false },
        ticks: {
          color: token.colorTextSecondary,
          font: { size: 11 },
          precision: 0,
          callback: value => formatValue(Number(value)),
        },
      },
    },
  }
}

const LessonCompletion = ({ insights }: { insights: CourseInsights }) => {
  const { token } = theme.useToken()
  const { lessons, summary } = insights
  const rates = lessons.map(lesson => percentOf(lesson.completed, summary.enrolled))
  const options = useBarOptions(
    index => `Bài ${index + 1}: ${lessons[index]?.title ?? ''}`,
    value => `${value}%`,
    100,
  )
  // The largest fall between neighbouring lessons is where learners give up.
  const biggestDrop = rates.reduce<{ index: number; drop: number } | null>((best, rate, index) => {
    if (index === 0) return best
    const drop = rates[index - 1] - rate
    return drop > 0 && drop > (best?.drop ?? 0) ? { index, drop } : best
  }, null)

  return (
    <OverviewCard
      title="Hoàn thành theo bài học"
      description={
        biggestDrop
          ? `Giảm mạnh nhất ở bài ${biggestDrop.index + 1}, thấp hơn bài trước ${biggestDrop.drop} điểm %`
          : '% học viên hoàn thành từng bài'
      }
    >
      <div className="h-52">
        <Bar
          options={options}
          data={{
            labels: lessons.map((_, index) => `${index + 1}`),
            datasets: [
              {
                label: 'Tỷ lệ hoàn thành',
                data: rates,
                backgroundColor: rates.map((_, index) =>
                  index === biggestDrop?.index ? token.colorWarning : token.colorPrimary,
                ),
                borderRadius: 4,
                maxBarThickness: 24,
              },
            ],
          }}
        />
      </div>
    </OverviewCard>
  )
}

const EnrollmentTrend = ({ insights }: { insights: CourseInsights }) => {
  const { token } = theme.useToken()
  const weeks = insights.enrollmentsByWeek
  const options = useBarOptions(
    index => `Tuần từ ${dayjs(weeks[index]?.weekStart).format('DD/MM/YYYY')}`,
    value => `${value}`,
  )
  return (
    <OverviewCard title="Đăng ký mới" description="Theo tuần, 12 tuần gần nhất">
      <div className="h-52">
        <Bar
          options={options}
          data={{
            labels: weeks.map(week => dayjs(week.weekStart).format('DD/MM')),
            datasets: [
              {
                label: 'Đăng ký mới',
                data: weeks.map(week => week.count),
                backgroundColor: token.colorPrimary,
                borderRadius: 4,
                maxBarThickness: 24,
              },
            ],
          }}
        />
      </div>
    </OverviewCard>
  )
}

const Insights = ({ course }: { course: Course }) => {
  const [insights, setInsights] = useState<CourseInsights | null>(null)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    let isCurrent = true
    getCourseInsights(course.id)
      .then(result => {
        if (isCurrent) setInsights(result)
      })
      .catch(() => {
        if (isCurrent) setHasError(true)
      })
    return () => {
      isCurrent = false
    }
  }, [course.id])

  if (hasError) {
    return (
      <Card>
        <Typography.Text type="danger">Không tải được số liệu khoá học.</Typography.Text>
      </Card>
    )
  }
  if (!insights) {
    return (
      <Card>
        <div className="flex justify-center py-10">
          <Spin />
        </div>
      </Card>
    )
  }

  const { summary } = insights
  return (
    <>
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <Metric
          icon={<TeamOutlined />}
          label="Học viên"
          value={summary.enrolled}
          hint={`${summary.active} đang học`}
        />
        <Metric
          icon={<CheckCircleOutlined />}
          label="Tỷ lệ hoàn thành"
          value={`${percentOf(summary.completed, summary.enrolled)}%`}
          hint={`${summary.completed} học viên`}
        />
        <Metric
          icon={<SafetyCertificateOutlined />}
          label="Chứng chỉ"
          value={summary.certificates}
          hint="Đã cấp"
        />
        <Metric
          icon={<WalletOutlined />}
          label="Doanh thu"
          value={`${summary.revenue.toLocaleString('vi-VN')} ₫`}
          hint="Không gồm hoàn tiền"
        />
      </div>
      {summary.enrolled === 0 ? (
        <Card>
          <Empty description="Chưa có học viên nên chưa có số liệu phân tích" />
        </Card>
      ) : (
        <>
          <LearnerHealth courseId={course.id} insights={insights} />
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <LearningFunnel insights={insights} />
            <QuizPassRates insights={insights} />
            <LessonCompletion insights={insights} />
            <EnrollmentTrend insights={insights} />
          </div>
        </>
      )}
    </>
  )
}

export const CourseOverview = ({ course }: { course: Course }) => (
  <div className="flex flex-col gap-4">
    {course.status !== CourseStatus.PUBLISHED && <PublishChecklist course={course} />}
    {course.status !== CourseStatus.DRAFT && <Insights course={course} />}
  </div>
)
