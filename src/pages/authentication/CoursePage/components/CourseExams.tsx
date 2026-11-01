import type { Course } from '@/models/Course'
import { RoutePath } from '@/router/RoutePath'
import {
  getCourseQuizSummary,
  updateCourseConfig,
  type CourseQuizSummaryItem,
} from '@/services/Course'
import { getApiErrorMessage } from '@/utils/apiResponse'
import { createQuiz, removeQuiz } from '@/services/Quiz'
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons'
import {
  App,
  Button,
  Card,
  Empty,
  Form,
  Input,
  Modal,
  Segmented,
  Spin,
  Switch,
  Table,
  Tag,
  Tooltip,
  Typography,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

interface Props {
  course: Course
  onSaved: () => void
}

type LinkFilter = 'all' | 'linked' | 'unlinked'

const CreateQuizDialog = ({
  courseId,
  open,
  onClose,
}: {
  courseId: string
  open: boolean
  onClose: () => void
}) => {
  const { message } = App.useApp()
  const navigate = useNavigate()
  const [form] = Form.useForm<{ title: string }>()
  const [isSaving, setIsSaving] = useState(false)

  const handleCreate = async () => {
    const { title } = await form.validateFields()
    setIsSaving(true)
    try {
      const quiz = await createQuiz({ courseId, title: title.trim() })
      navigate(RoutePath.CourseExamEditPage.getPath(courseId, quiz.id))
    } catch (error) {
      void message.error(getApiErrorMessage(error, 'Không thể tạo bài kiểm tra'))
      setIsSaving(false)
    }
  }

  return (
    <Modal
      title="Tạo bài kiểm tra"
      open={open}
      okText="Tạo và soạn câu hỏi"
      cancelText="Hủy"
      confirmLoading={isSaving}
      onOk={() => void handleCreate().catch(() => undefined)}
      onCancel={onClose}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" preserve={false} className="mt-4">
        <Form.Item
          name="title"
          label="Tên bài kiểm tra"
          rules={[{ required: true, whitespace: true, message: 'Nhập tên bài kiểm tra' }]}
        >
          <Input autoFocus placeholder="Kiểm tra cuối chương 1" maxLength={255} />
        </Form.Item>
      </Form>
    </Modal>
  )
}

export const CourseExams = ({ course, onSaved }: Props) => {
  const { message, modal } = App.useApp()
  const [quizzes, setQuizzes] = useState<CourseQuizSummaryItem[] | null>(null)
  const [hasError, setHasError] = useState(false)
  const [savingLessonId, setSavingLessonId] = useState<string | null>(null)

  const [filter, setFilter] = useState<LinkFilter>('all')
  const [isCreating, setIsCreating] = useState(false)

  const loadQuizzes = useCallback(
    () =>
      getCourseQuizSummary(course.id).then(result => {
        setQuizzes(result)
        setHasError(false)
      }),
    [course.id],
  )

  useEffect(() => {
    loadQuizzes().catch(() => setHasError(true))
  }, [loadQuizzes])

  const requiredIds = course.config?.completion.requiredQuizLessonIds ?? []

  const toggleRequired = async (lessonId: string, isRequired: boolean) => {
    const lessonIds = new Set((quizzes ?? []).flatMap(quiz => quiz.linkedLesson?.id ?? []))
    // Drop ids of deleted lessons, which the server would otherwise reject.
    const kept = requiredIds.filter(id => id !== lessonId && lessonIds.has(id))
    setSavingLessonId(lessonId)
    try {
      await updateCourseConfig({
        id: course.id,
        completion: { requiredQuizLessonIds: isRequired ? [...kept, lessonId] : kept },
      })
      onSaved()
    } catch (error) {
      void message.error(getApiErrorMessage(error, 'Không thể cập nhật bài kiểm tra bắt buộc'))
    } finally {
      setSavingLessonId(null)
    }
  }

  const confirmRemove = (quiz: CourseQuizSummaryItem) => {
    modal.confirm({
      title: `Xoá "${quiz.title}"?`,
      content: 'Lịch sử làm bài của học viên vẫn được giữ lại.',
      okText: 'Xoá',
      okButtonProps: { danger: true },
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await removeQuiz({ id: quiz.quizId })
          void message.success('Đã xoá bài kiểm tra')
          await loadQuizzes()
        } catch (error) {
          void message.error(getApiErrorMessage(error, 'Không thể xoá bài kiểm tra'))
        }
      },
    })
  }

  const linkedCount = (quizzes ?? []).filter(quiz => quiz.linkedLesson).length
  const unlinkedCount = (quizzes ?? []).length - linkedCount
  const visibleQuizzes = (quizzes ?? []).filter(
    quiz => filter === 'all' || (filter === 'linked' ? !!quiz.linkedLesson : !quiz.linkedLesson),
  )

  const columns: ColumnsType<CourseQuizSummaryItem> = [
    {
      title: 'Bài kiểm tra',
      key: 'title',
      render: (_, quiz) => (
        <Link to={RoutePath.CourseExamEditPage.getPath(course.id, quiz.quizId)}>{quiz.title}</Link>
      ),
    },
    {
      title: 'Vị trí trong nội dung',
      key: 'position',
      render: (_, { linkedLesson }) =>
        linkedLesson ? (
          <div className="min-w-0">
            <div>
              Chương {linkedLesson.modulePosition} · Bài {linkedLesson.lessonPosition}
            </div>
            <Typography.Text type="secondary" className="text-xs">
              {linkedLesson.moduleTitle}
            </Typography.Text>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <Tag color="warning" className="m-0">
              Chưa gắn
            </Tag>
            <Link to={RoutePath.CourseContentPage.getPath(course.id)} className="text-xs">
              Gắn ở Nội dung
            </Link>
          </div>
        ),
    },
    {
      title: 'Số câu',
      dataIndex: 'questionCount',
      align: 'right',
      width: 110,
      render: (count: number) => (count > 0 ? count : <Tag className="m-0">Chưa có câu</Tag>),
    },
    {
      title: 'Điểm đạt',
      dataIndex: 'passingScore',
      align: 'right',
      width: 100,
    },
    {
      title: 'Tỷ lệ đạt',
      key: 'passRate',
      align: 'right',
      width: 130,
      render: (_, quiz) =>
        quiz.attempted > 0 ? (
          <>
            <strong>{Math.round((quiz.passed / quiz.attempted) * 100)}%</strong>{' '}
            <Typography.Text type="secondary" className="text-xs">
              {quiz.passed}/{quiz.attempted}
            </Typography.Text>
          </>
        ) : (
          <Typography.Text type="secondary">Chưa có</Typography.Text>
        ),
    },
    {
      title: 'Bắt buộc đạt',
      key: 'required',
      align: 'center',
      width: 110,
      render: (_, quiz) => (
        <Switch
          size="small"
          aria-label={`Bắt buộc đạt ${quiz.title}`}
          checked={!!quiz.linkedLesson && requiredIds.includes(quiz.linkedLesson.id)}
          loading={savingLessonId === quiz.linkedLesson?.id}
          disabled={!quiz.linkedLesson || savingLessonId !== null}
          onChange={checked =>
            quiz.linkedLesson && void toggleRequired(quiz.linkedLesson.id, checked)
          }
        />
      ),
    },
    {
      key: 'actions',
      align: 'right',
      width: 56,
      render: (_, quiz) => (
        <Tooltip
          title={quiz.linkedLesson ? 'Đang gắn vào bài học, hãy gỡ khỏi bài học trước' : 'Xoá'}
        >
          <Button
            type="text"
            size="small"
            danger
            aria-label={`Xoá ${quiz.title}`}
            icon={<DeleteOutlined />}
            disabled={!!quiz.linkedLesson}
            onClick={() => confirmRemove(quiz)}
          />
        </Tooltip>
      ),
    },
  ]

  return (
    <Card
      title={
        <div className="whitespace-normal py-3">
          <div className="text-sm font-semibold">Bài kiểm tra</div>
          <Typography.Text type="secondary" className="text-xs font-normal">
            Thay đổi &quot;Bắt buộc đạt&quot; chỉ áp dụng cho học viên đăng ký mới
          </Typography.Text>
        </div>
      }
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsCreating(true)}>
          Tạo bài kiểm tra
        </Button>
      }
    >
      {hasError ? (
        <Typography.Text type="danger">Không tải được danh sách bài kiểm tra.</Typography.Text>
      ) : !quizzes ? (
        <div className="flex justify-center py-10">
          <Spin />
        </div>
      ) : quizzes.length === 0 ? (
        <Empty description="Tạo bài kiểm tra rồi gắn vào bài học ở mục Nội dung" />
      ) : (
        <div className="flex flex-col gap-4">
          <Segmented<LinkFilter>
            className="self-start"
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'all', label: `Tất cả ${quizzes.length}` },
              { value: 'linked', label: `Đã gắn ${linkedCount}` },
              { value: 'unlinked', label: `Chưa gắn ${unlinkedCount}` },
            ]}
          />
          <Table
            rowKey="quizId"
            size="middle"
            pagination={false}
            columns={columns}
            dataSource={visibleQuizzes}
            locale={{ emptyText: 'Không có bài kiểm tra nào trong nhóm này' }}
            scroll={{ x: 760 }}
          />
        </div>
      )}
      <CreateQuizDialog
        courseId={course.id}
        open={isCreating}
        onClose={() => setIsCreating(false)}
      />
    </Card>
  )
}
