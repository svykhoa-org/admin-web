import {
  ArrowLeftOutlined,
  FileTextOutlined,
  PlayCircleOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons'
import { Avatar, Badge, Button, Card, Collapse, Progress, Space, Spin, Tag, Typography } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { LessonProgressDetail, QuizAttempt } from '@/models/EnrollmentProgress'
import { LessonProgressStatus } from '@/models/EnrollmentProgress'
import { LessonType } from '@/models/Course'
import { EnrollmentStatus } from '@/models/Enrollment'
import { useRequest } from '@/hooks'
import { getEnrollmentProgress } from '@/services/Enrollment'
import { formatTimestamp } from '@/utils/time'
import { QuizAttemptsDrawer } from './components/QuizAttemptsDrawer'

const statusColors: Record<EnrollmentStatus, string> = {
  [EnrollmentStatus.ACTIVE]: 'green',
  [EnrollmentStatus.COMPLETED]: 'blue',
  [EnrollmentStatus.EXPIRED]: 'red',
  [EnrollmentStatus.REFUNDED]: 'orange',
}

const statusLabels: Record<EnrollmentStatus, string> = {
  [EnrollmentStatus.ACTIVE]: 'Đang học',
  [EnrollmentStatus.COMPLETED]: 'Hoàn thành',
  [EnrollmentStatus.EXPIRED]: 'Hết hạn',
  [EnrollmentStatus.REFUNDED]: 'Đã hoàn tiền',
}

const lessonProgressColors: Record<LessonProgressStatus, string> = {
  [LessonProgressStatus.NOT_STARTED]: 'default',
  [LessonProgressStatus.IN_PROGRESS]: 'processing',
  [LessonProgressStatus.COMPLETED]: 'success',
}

const lessonProgressLabels: Record<LessonProgressStatus, string> = {
  [LessonProgressStatus.NOT_STARTED]: 'Chưa bắt đầu',
  [LessonProgressStatus.IN_PROGRESS]: 'Đang học',
  [LessonProgressStatus.COMPLETED]: 'Hoàn thành',
}

function lessonTypeIcon(type: LessonType) {
  if (type === LessonType.VIDEO) return <PlayCircleOutlined style={{ color: '#1677ff' }} />
  if (type === LessonType.QUIZ) return <QuestionCircleOutlined style={{ color: '#722ed1' }} />
  return <FileTextOutlined style={{ color: '#52c41a' }} />
}

function formatSeconds(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

interface LessonRowProps {
  lesson: LessonProgressDetail
  onViewQuiz: (lessonTitle: string, attempts: QuizAttempt[]) => void
}

function LessonRow({ lesson, onViewQuiz }: LessonRowProps) {
  const progressStatus = lesson.progress?.status ?? LessonProgressStatus.NOT_STARTED

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 16px',
        borderBottom: '1px solid #f0f0f0',
      }}
    >
      <Space size={10} style={{ flex: 1, minWidth: 0 }}>
        {lessonTypeIcon(lesson.type)}
        <div style={{ minWidth: 0 }}>
          <Typography.Text style={{ display: 'block' }}>
            {lesson.order + 1}. {lesson.title}
            {!lesson.isRequired && (
              <Typography.Text type="secondary" style={{ fontSize: 11, marginLeft: 6 }}>
                (không bắt buộc)
              </Typography.Text>
            )}
          </Typography.Text>

          {lesson.type === LessonType.VIDEO && lesson.durationMinutes > 0 && (
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {lesson.progress && lesson.progress.watchedSeconds > 0
                ? `Đã xem: ${formatSeconds(lesson.progress.watchedSeconds)} / ${lesson.durationMinutes}:00`
                : `${lesson.durationMinutes} phút`}
            </Typography.Text>
          )}

          {lesson.type === LessonType.QUIZ &&
            lesson.quizAttempts &&
            lesson.quizAttempts.length > 0 && (
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {lesson.quizAttempts.filter(a => a.status === 'submitted').length} lần nộp bài
              </Typography.Text>
            )}
        </div>
      </Space>

      <Space size={8}>
        <Badge
          status={lessonProgressColors[progressStatus] || 'default'}
          text={lessonProgressLabels[progressStatus]}
        />

        {lesson.type === LessonType.QUIZ &&
          lesson.quizAttempts &&
          lesson.quizAttempts.filter(a => a.status === 'submitted').length > 0 && (
            <Button
              size="small"
              type="link"
              onClick={() => onViewQuiz(lesson.title, lesson.quizAttempts!)}
            >
              Xem bài thi
            </Button>
          )}
      </Space>
    </div>
  )
}

export function EnrollmentProgressPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data, isLoading, execute } = useRequest(getEnrollmentProgress)

  const [drawerState, setDrawerState] = useState<{
    open: boolean
    lessonTitle: string
    attempts: QuizAttempt[]
  }>({ open: false, lessonTitle: '', attempts: [] })

  // const fetchProgress = useCallback(
  //   (enrollmentId: string) => getEnrollmentProgress({ id: enrollmentId }),
  //   [],
  // )

  useEffect(() => {
    if (id) void execute({ id })
  }, [execute, id])

  const openQuizDrawer = useCallback((lessonTitle: string, attempts: QuizAttempt[]) => {
    setDrawerState({ open: true, lessonTitle, attempts })
  }, [])

  const closeDrawer = useCallback(() => {
    setDrawerState(s => ({ ...s, open: false }))
  }, [])

  if (isLoading && !data) {
    return (
      <div className="flex justify-center items-center py-20">
        <Spin size="large" />
      </div>
    )
  }

  if (!data) return null

  const { enrollment, modules } = data
  const courseTitle =
    (enrollment.courseSnapshot?.title as string | undefined) ?? enrollment.courseId
  const user = enrollment.user

  const completedLessons = modules
    .flatMap(m => m.lessons)
    .filter(l => l.progress?.status === LessonProgressStatus.COMPLETED).length
  const totalLessons = modules.flatMap(m => m.lessons).length

  return (
    <Space direction="vertical" size={16} className="w-full">
      {/* Header */}
      <Card>
        <Space className="mb-4">
          <Button
            icon={<ArrowLeftOutlined />}
            type="text"
            onClick={() => navigate('/enrollments')}
          />
          <Typography.Title level={4} style={{ margin: 0 }}>
            Chi tiết tiến độ học
          </Typography.Title>
        </Space>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* User info */}
          <Space align="start">
            {user?.avatar ? (
              <Avatar src={user.avatar} size={48} />
            ) : (
              <Avatar size={48}>{user?.fullName?.[0] ?? '?'}</Avatar>
            )}
            <div>
              <Typography.Text strong style={{ display: 'block' }}>
                {user?.fullName ?? '—'}
              </Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {user?.email ?? enrollment.userId}
              </Typography.Text>
            </div>
          </Space>

          {/* Course & status */}
          <div>
            <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
              Khoá học
            </Typography.Text>
            <Typography.Text strong style={{ display: 'block' }}>
              {courseTitle}
            </Typography.Text>
            <Tag color={statusColors[enrollment.status]} style={{ marginTop: 4 }}>
              {statusLabels[enrollment.status]}
            </Tag>
          </div>

          {/* Dates */}
          <div>
            <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
              Ngày đăng ký
            </Typography.Text>
            <Typography.Text style={{ display: 'block' }}>
              {formatTimestamp(enrollment.enrolledAt)}
            </Typography.Text>
            <Typography.Text
              type="secondary"
              style={{ fontSize: 12, display: 'block', marginTop: 6 }}
            >
              Hết hạn
            </Typography.Text>
            <Typography.Text style={{ display: 'block' }}>
              {enrollment.expireAt ? formatTimestamp(enrollment.expireAt) : 'Không giới hạn'}
            </Typography.Text>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Tiến độ tổng thể
            </Typography.Text>
            <Typography.Text style={{ fontSize: 12 }}>
              {completedLessons}/{totalLessons} bài học hoàn thành
            </Typography.Text>
          </div>
          <Progress percent={enrollment.progress} strokeColor="#1677ff" />
        </div>
      </Card>

      {/* Curriculum */}
      {modules.length === 0 ? (
        <Card>
          <Typography.Text type="secondary">Khoá học chưa có nội dung.</Typography.Text>
        </Card>
      ) : (
        <Collapse
          defaultActiveKey={modules.map(m => m.id)}
          items={modules.map(mod => {
            const modCompleted = mod.lessons.filter(
              l => l.progress?.status === LessonProgressStatus.COMPLETED,
            ).length
            return {
              key: mod.id,
              label: (
                <Space>
                  <Typography.Text strong>
                    Chương {mod.order + 1}: {mod.title}
                  </Typography.Text>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    {modCompleted}/{mod.lessons.length} bài
                  </Typography.Text>
                  {mod.locked && <Tag>Có khóa</Tag>}
                </Space>
              ),
              children: (
                <div style={{ margin: '-12px -16px' }}>
                  {mod.lessons.length === 0 ? (
                    <div style={{ padding: '12px 16px' }}>
                      <Typography.Text type="secondary">
                        Chương này chưa có bài học.
                      </Typography.Text>
                    </div>
                  ) : (
                    mod.lessons.map(lesson => (
                      <LessonRow
                        key={lesson.lessonId}
                        lesson={lesson}
                        onViewQuiz={openQuizDrawer}
                      />
                    ))
                  )}
                </div>
              ),
            }
          })}
        />
      )}

      <QuizAttemptsDrawer
        open={drawerState.open}
        onClose={closeDrawer}
        lessonTitle={drawerState.lessonTitle}
        attempts={drawerState.attempts}
      />
    </Space>
  )
}
