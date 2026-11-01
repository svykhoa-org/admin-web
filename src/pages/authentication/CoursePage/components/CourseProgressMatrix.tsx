import { LessonType } from '@/models/Course'
import type { QuizAttempt } from '@/models/EnrollmentProgress'
import { RoutePath } from '@/router/RoutePath'
import {
  getProgressMatrix,
  type MatrixCell,
  type MatrixCellState,
  type ProgressMatrix,
  type ProgressMatrixColumn,
  type ProgressMatrixFilter,
  type ProgressMatrixRow,
} from '@/services/Course'
import { getEnrollmentProgress } from '@/services/Enrollment'
import { getApiErrorMessage } from '@/utils/apiResponse'
import { formatTimestamp } from '@/utils/time'
import {
  CheckOutlined,
  CloseOutlined,
  DownOutlined,
  FileTextOutlined,
  FormOutlined,
  PlayCircleOutlined,
  RightOutlined,
} from '@ant-design/icons'
import { App, Empty, Input, Pagination, Select, Spin, theme, Tooltip, Typography } from 'antd'
import type { CSSProperties, ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { QuizAttemptsDrawer } from '../../EnrollmentPage/components/QuizAttemptsDrawer'

const PAGE_SIZE = 20
// Above this many lessons the columns no longer fit on screen, so chapters start collapsed.
const EXPANDED_LESSON_LIMIT = 12
const CELL_WIDTH = 48
const NAME_WIDTH = 220
const TOTAL_WIDTH = 64
const CELL_GAP = 4
const totalStickyStyle: CSSProperties = { left: NAME_WIDTH + CELL_GAP }

const FILTER_OPTIONS: { value: ProgressMatrixFilter; label: string }[] = [
  { value: 'active', label: 'Đang học' },
  { value: 'completed', label: 'Hoàn thành' },
  { value: 'inactive', label: 'Không hoạt động trên 14 ngày' },
  { value: 'quiz_failed', label: 'Có quiz chưa đạt' },
]

const STATE_LABELS: Record<MatrixCellState, string> = {
  not_started: 'Chưa học',
  in_progress: 'Đang học',
  done: 'Hoàn thành',
  pending: 'Đủ % nhưng chưa hoàn thành',
  failed: 'Chưa đạt',
}

const LESSON_ICONS: Record<LessonType, ReactNode> = {
  [LessonType.VIDEO]: <PlayCircleOutlined />,
  [LessonType.DOCUMENT]: <FileTextOutlined />,
  [LessonType.QUIZ]: <FormOutlined />,
}

const isFilter = (value: string | null): value is ProgressMatrixFilter =>
  FILTER_OPTIONS.some(option => option.value === value)

const useStateStyles = (): Record<MatrixCellState, CSSProperties> => {
  const { token } = theme.useToken()
  return {
    not_started: { background: token.colorFillTertiary, color: token.colorTextTertiary },
    in_progress: { background: token.colorInfoBorder, color: token.colorText },
    done: { background: token.colorSuccessBorder, color: token.colorText },
    pending: { background: token.colorWarningBorder, color: token.colorText },
    failed: { background: token.colorErrorBorder, color: token.colorText },
  }
}

const cellContent = (cell: MatrixCell): ReactNode => {
  // A score carries its unit so it cannot be read as a percent watched.
  if (cell.score !== null) return `${Math.round(cell.score)}đ`
  if (cell.state === 'done') return <CheckOutlined />
  if (cell.state === 'failed') return <CloseOutlined />
  if (cell.percent !== null) return `${cell.percent}%`
  return cell.state === 'not_started' ? '–' : '…'
}

const describeCell = (cell: MatrixCell, lessonTitle: string) => {
  const details = [STATE_LABELS[cell.state]]
  if (cell.percent !== null && cell.state !== 'done') details.push(`khoảng ${cell.percent}%`)
  if (cell.score !== null) details.push(`điểm cao nhất ${cell.score}`)
  if (cell.attempts > 0) details.push(`${cell.attempts} lượt`)
  if (cell.state === 'pending') {
    details.push('có thể đang chờ kiểm tra hiện diện hoặc bài đang bị khoá')
  }
  return `${lessonTitle}: ${details.join(', ')}`
}

const CELL_CLASS = 'flex h-9 items-center justify-center gap-1 rounded-lg text-xs font-medium'

interface LearnerRowProps {
  row: ProgressMatrixRow
  columns: ProgressMatrixColumn[]
  expanded: Set<string>
  stickyStyle: CSSProperties
  stateStyles: Record<MatrixCellState, CSSProperties>
  onQuizClick: (row: ProgressMatrixRow, lessonId: string, lessonTitle: string) => void
}

const LearnerRow = ({
  row,
  columns,
  expanded,
  stickyStyle,
  stateStyles,
  onQuizClick,
}: LearnerRowProps) => (
  <tr>
    <td
      className="sticky left-0 z-10 truncate"
      style={{ ...stickyStyle, minWidth: NAME_WIDTH, maxWidth: NAME_WIDTH }}
    >
      <Tooltip
        title={
          row.lastActivityAt
            ? `Hoạt động gần nhất: ${formatTimestamp(row.lastActivityAt)}`
            : 'Chưa có hoạt động'
        }
      >
        <Link to={RoutePath.EnrollmentDetailPage.getPath(row.enrollmentId)} className="block">
          {row.fullName ?? '—'}
        </Link>
      </Tooltip>
      <Typography.Text type="secondary" className="text-xs">
        {row.email ?? ''}
      </Typography.Text>
    </td>
    <td
      className="sticky z-10 text-center font-medium"
      style={{ ...stickyStyle, ...totalStickyStyle, minWidth: TOTAL_WIDTH }}
    >
      {row.progress}%
    </td>
    {columns.flatMap(column => {
      if (!expanded.has(column.moduleId)) {
        const cells = column.lessons.map(lesson => row.cells[lesson.id])
        const done = cells.filter(cell => cell?.state === 'done').length
        const state: MatrixCellState =
          done === cells.length && cells.length > 0
            ? 'done'
            : cells.some(cell => cell?.state === 'failed')
              ? 'failed'
              : cells.some(cell => cell && cell.state !== 'not_started')
                ? 'in_progress'
                : 'not_started'
        return (
          <td key={column.moduleId} style={{ minWidth: CELL_WIDTH }}>
            <Tooltip title={`${column.moduleTitle}: ${done}/${cells.length} bài hoàn thành`}>
              <div className={CELL_CLASS} style={stateStyles[state]}>
                {done}/{cells.length}
              </div>
            </Tooltip>
          </td>
        )
      }
      return column.lessons.map(lesson => {
        const cell = row.cells[lesson.id]
        if (!cell) return <td key={lesson.id} />
        const canOpen = lesson.type === LessonType.QUIZ && cell.attempts > 0
        return (
          <td key={lesson.id} style={{ minWidth: CELL_WIDTH }}>
            <Tooltip title={describeCell(cell, lesson.title)}>
              {canOpen ? (
                <button
                  type="button"
                  className={`${CELL_CLASS} w-full cursor-pointer border-0`}
                  style={stateStyles[cell.state]}
                  onClick={() => onQuizClick(row, lesson.id, lesson.title)}
                >
                  <FormOutlined />
                  {cellContent(cell)}
                </button>
              ) : (
                <div className={CELL_CLASS} style={stateStyles[cell.state]}>
                  {lesson.type === LessonType.QUIZ && cell.state !== 'not_started' && (
                    <FormOutlined />
                  )}
                  {cellContent(cell)}
                </div>
              )}
            </Tooltip>
          </td>
        )
      })
    })}
  </tr>
)

interface CourseProgressMatrixProps {
  courseId: string
  toolbarStart?: ReactNode
}

export const CourseProgressMatrix = ({ courseId, toolbarStart }: CourseProgressMatrixProps) => {
  const { message } = App.useApp()
  const { token } = theme.useToken()
  const stateStyles = useStateStyles()
  const [searchParams] = useSearchParams()
  const initialFilter = searchParams.get('filter')

  const [matrix, setMatrix] = useState<ProgressMatrix | null>(null)
  const [loadedKey, setLoadedKey] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<ProgressMatrixFilter | undefined>(
    isFilter(initialFilter) ? initialFilter : undefined,
  )
  // Null until the user toggles a chapter: the default then depends on the course size.
  const [toggled, setToggled] = useState<Set<string> | null>(null)
  const [drawer, setDrawer] = useState<{
    open: boolean
    lessonTitle: string
    attempts: QuizAttempt[]
  }>({ open: false, lessonTitle: '', attempts: [] })

  const requestKey = JSON.stringify({ courseId, page, search, filter })
  const isLoading = loadedKey !== requestKey

  useEffect(() => {
    let isCurrent = true
    getProgressMatrix({ courseId, page, pageSize: PAGE_SIZE, search: search || undefined, filter })
      .then(result => {
        if (isCurrent) setMatrix(result)
      })
      .catch(error => {
        if (isCurrent)
          void message.error(getApiErrorMessage(error, 'Không thể tải ma trận tiến độ'))
      })
      .finally(() => {
        if (isCurrent) setLoadedKey(requestKey)
      })
    return () => {
      isCurrent = false
    }
  }, [courseId, filter, message, page, requestKey, search])

  const columns = useMemo(() => matrix?.columns ?? [], [matrix])
  const expanded = useMemo(() => {
    if (toggled) return toggled
    const lessonCount = columns.reduce((sum, column) => sum + column.lessons.length, 0)
    return new Set(
      lessonCount > EXPANDED_LESSON_LIMIT ? [] : columns.map(column => column.moduleId),
    )
  }, [columns, toggled])

  const toggleColumn = (moduleId: string) => {
    const next = new Set(expanded)
    if (next.has(moduleId)) next.delete(moduleId)
    else next.add(moduleId)
    setToggled(next)
  }

  const openQuizAttempts = async (
    row: ProgressMatrixRow,
    lessonId: string,
    lessonTitle: string,
  ) => {
    try {
      const progress = await getEnrollmentProgress({ id: row.enrollmentId })
      const lesson = progress.modules
        .flatMap(mod => mod.lessons)
        .find(item => item.lessonId === lessonId)
      setDrawer({ open: true, lessonTitle, attempts: lesson?.quizAttempts ?? [] })
    } catch (error) {
      void message.error(getApiErrorMessage(error, 'Không thể tải lượt làm bài'))
    }
  }

  // The shadow covers the table's cell gap so scrolled cells do not show through it.
  const stickyStyle: CSSProperties = {
    background: token.colorBgContainer,
    boxShadow: `${CELL_GAP}px 0 0 ${token.colorBgContainer}`,
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        {toolbarStart}
        <div className="ml-auto flex items-center gap-2">
          <Input.Search
            allowClear
            placeholder="Tìm theo tên hoặc email"
            className="w-56"
            onSearch={value => {
              setPage(1)
              setSearch(value.trim())
            }}
          />
          <Select
            allowClear
            placeholder="Tất cả học viên"
            className="w-56"
            value={filter}
            options={FILTER_OPTIONS}
            onChange={value => {
              setPage(1)
              setFilter(value)
            }}
          />
        </div>
      </div>

      <Spin spinning={isLoading}>
        {matrix && matrix.rows.length > 0 && columns.length > 0 ? (
          <div className="overflow-x-auto">
            <table
              className="w-full border-separate"
              style={{ borderSpacing: CELL_GAP }}
              aria-label="Ma trận tiến độ học viên"
            >
              <thead>
                <tr>
                  <th
                    rowSpan={2}
                    className="sticky left-0 z-10 text-left align-bottom font-medium"
                    style={{
                      ...stickyStyle,
                      width: NAME_WIDTH,
                      minWidth: NAME_WIDTH,
                      maxWidth: NAME_WIDTH,
                    }}
                  >
                    Học viên
                  </th>
                  <th
                    rowSpan={2}
                    className="align-bottom font-medium"
                    style={{ width: TOTAL_WIDTH }}
                  >
                    Tổng
                  </th>
                  {columns.map(column => {
                    const isOpen = expanded.has(column.moduleId)
                    return (
                      <th
                        key={column.moduleId}
                        colSpan={isOpen ? Math.max(column.lessons.length, 1) : 1}
                        className="font-normal"
                      >
                        <Tooltip title={column.moduleTitle}>
                          <button
                            type="button"
                            className="block w-0 min-w-full cursor-pointer truncate rounded-lg border-0 px-1 py-1 text-xs"
                            style={{
                              background: token.colorFillSecondary,
                              color: token.colorText,
                            }}
                            aria-expanded={isOpen}
                            onClick={() => toggleColumn(column.moduleId)}
                          >
                            {isOpen ? <DownOutlined /> : <RightOutlined />}{' '}
                            {isOpen ? column.moduleTitle : ''}
                          </button>
                        </Tooltip>
                      </th>
                    )
                  })}
                </tr>
                <tr>
                  {columns.flatMap((column, moduleIndex) =>
                    expanded.has(column.moduleId) ? (
                      column.lessons.map((lesson, lessonIndex) => (
                        <th key={lesson.id} className="text-xs font-normal">
                          <Tooltip
                            title={`${lesson.title}${lesson.isRequired ? '' : ' (không bắt buộc)'}`}
                          >
                            <span className={lesson.isRequired ? '' : 'opacity-50'}>
                              {LESSON_ICONS[lesson.type]} {lessonIndex + 1}
                            </span>
                          </Tooltip>
                        </th>
                      ))
                    ) : (
                      <th key={column.moduleId} className="text-xs font-normal">
                        C{moduleIndex + 1}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {matrix.rows.map(row => (
                  <LearnerRow
                    key={row.enrollmentId}
                    row={row}
                    columns={columns}
                    expanded={expanded}
                    stickyStyle={stickyStyle}
                    stateStyles={stateStyles}
                    onQuizClick={(...args) => void openQuizAttempts(...args)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          !isLoading && <Empty description="Không có học viên phù hợp" />
        )}
      </Spin>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {(Object.keys(STATE_LABELS) as MatrixCellState[]).map(state => (
            <span key={state} className="flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded-lg" style={stateStyles[state]} />
              {STATE_LABELS[state]}
            </span>
          ))}
          <span className="flex items-center gap-1">
            <strong>50%</strong> bài học đã xem
          </span>
          <span className="flex items-center gap-1">
            <FormOutlined /> <strong>86đ</strong> điểm cao nhất bài kiểm tra (thang 100)
          </span>
          <Typography.Text type="secondary" className="text-xs">
            % video là gần đúng vì tính theo thời lượng nhập tay. Không gồm học viên đã hoàn tiền.
          </Typography.Text>
        </div>
        <Pagination
          size="small"
          current={page}
          pageSize={PAGE_SIZE}
          total={matrix?.total ?? 0}
          showSizeChanger={false}
          hideOnSinglePage
          onChange={setPage}
        />
      </div>

      <QuizAttemptsDrawer
        open={drawer.open}
        onClose={() => setDrawer(current => ({ ...current, open: false }))}
        lessonTitle={drawer.lessonTitle}
        attempts={drawer.attempts}
      />
    </div>
  )
}
