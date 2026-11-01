import { QuizAttemptStatus, type QuizAttempt } from '@/models/EnrollmentProgress'
import { getCourseRoster, type CourseQuizSummaryItem } from '@/services/Course'
import { getQuizAttempts } from '@/services/Quiz'
import { formatTimestamp } from '@/utils/time'
import { Button, Empty, Spin, Statistic, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useEffect, useMemo, useState } from 'react'
import { QuizAttemptsDrawer } from '../../../EnrollmentPage/components/QuizAttemptsDrawer'

const MOST_MISSED_LIMIT = 5

export const QuizResults = ({
  courseId,
  quizId,
  summary,
}: {
  courseId: string
  quizId: string
  summary: CourseQuizSummaryItem | null
}) => {
  const [attempts, setAttempts] = useState<QuizAttempt[] | null>(null)
  const [names, setNames] = useState<Map<string, string | null>>(new Map())
  const [hasError, setHasError] = useState(false)
  const [drawerUserId, setDrawerUserId] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([getQuizAttempts(quizId), getCourseRoster(courseId)])
      .then(([rows, roster]) => {
        setAttempts(rows.filter(row => row.status === QuizAttemptStatus.SUBMITTED))
        setNames(new Map(roster.learners.map(learner => [learner.userId, learner.fullName])))
      })
      .catch(() => setHasError(true))
  }, [courseId, quizId])

  // Read from snapshots, so a question edited or removed later still counts as asked.
  const mostMissed = useMemo(() => {
    const byQuestion = new Map<string, { content: string; asked: number; wrong: number }>()
    for (const attempt of attempts ?? []) {
      for (const answer of attempt.answers ?? []) {
        const row = byQuestion.get(answer.questionId) ?? {
          content: answer.questionContent,
          asked: 0,
          wrong: 0,
        }
        row.asked += 1
        if (!answer.isCorrect) row.wrong += 1
        byQuestion.set(answer.questionId, row)
      }
    }
    return [...byQuestion.values()]
      .filter(row => row.wrong > 0)
      .sort((a, b) => b.wrong / b.asked - a.wrong / a.asked)
      .slice(0, MOST_MISSED_LIMIT)
  }, [attempts])

  if (hasError) {
    return <Typography.Text type="danger">Không tải được kết quả bài kiểm tra.</Typography.Text>
  }
  if (!attempts) {
    return (
      <div className="flex justify-center py-10">
        <Spin />
      </div>
    )
  }
  if (attempts.length === 0) return <Empty description="Chưa có học viên nào nộp bài" />

  const nameOf = (userId: string) => names.get(userId) ?? 'Học viên không còn trong khoá'
  const passRate =
    summary && summary.attempted > 0
      ? `${Math.round((summary.passed / summary.attempted) * 100)}%`
      : '—'

  const columns: ColumnsType<QuizAttempt> = [
    { title: 'Học viên', key: 'learner', render: (_, attempt) => nameOf(attempt.userId) },
    { title: 'Lượt', dataIndex: 'attemptNumber', align: 'right', width: 70 },
    {
      title: 'Điểm',
      dataIndex: 'score',
      align: 'right',
      width: 90,
      render: (score: number) => `${Number(score).toFixed(1)}%`,
    },
    {
      title: 'Kết quả',
      dataIndex: 'isPassed',
      width: 110,
      render: (isPassed: boolean) => (
        <Tag color={isPassed ? 'success' : 'error'} className="m-0">
          {isPassed ? 'Đạt' : 'Không đạt'}
        </Tag>
      ),
    },
    {
      title: 'Nộp lúc',
      dataIndex: 'submittedAt',
      width: 170,
      render: (submittedAt: string | null) => (submittedAt ? formatTimestamp(submittedAt) : '—'),
    },
    {
      key: 'detail',
      align: 'right',
      width: 110,
      render: (_, attempt) => (
        <Button type="link" size="small" onClick={() => setDrawerUserId(attempt.userId)}>
          Xem bài làm
        </Button>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Statistic title="Học viên đã làm" value={summary?.attempted ?? 0} />
        <Statistic title="Tỷ lệ đạt" value={passRate} />
        <Statistic
          title="Điểm trung bình"
          value={summary?.averageScore === null || !summary ? '—' : `${summary.averageScore}%`}
        />
      </div>

      {mostMissed.length > 0 && (
        <div className="flex flex-col gap-2">
          <Typography.Text strong>Câu sai nhiều nhất</Typography.Text>
          {mostMissed.map(row => (
            <div key={row.content} className="flex items-baseline justify-between gap-4">
              <Typography.Text ellipsis className="min-w-0 flex-1">
                {row.content}
              </Typography.Text>
              <Typography.Text type="secondary" className="shrink-0 text-xs">
                Sai {row.wrong}/{row.asked} lượt ({Math.round((row.wrong / row.asked) * 100)}%)
              </Typography.Text>
            </div>
          ))}
        </div>
      )}

      <Table
        rowKey="id"
        size="middle"
        columns={columns}
        dataSource={attempts}
        pagination={{ pageSize: 10, hideOnSinglePage: true }}
        scroll={{ x: 680 }}
      />

      <QuizAttemptsDrawer
        open={drawerUserId !== null}
        onClose={() => setDrawerUserId(null)}
        lessonTitle={drawerUserId ? nameOf(drawerUserId) : ''}
        attempts={attempts.filter(attempt => attempt.userId === drawerUserId)}
      />
    </div>
  )
}
