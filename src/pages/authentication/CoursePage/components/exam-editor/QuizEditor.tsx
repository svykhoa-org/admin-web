import type { Quiz } from '@/models/Quiz'
import { RoutePath } from '@/router/RoutePath'
import { getCourseQuizSummary, type CourseQuizSummaryItem } from '@/services/Course'
import { getQuizDetail, updateQuiz } from '@/services/Quiz'
import { getApiErrorMessage } from '@/utils/apiResponse'
import {
  ArrowLeftOutlined,
  EyeOutlined,
  PlusOutlined,
  RollbackOutlined,
  SaveOutlined,
} from '@ant-design/icons'
import {
  Alert,
  App,
  Button,
  Card,
  Empty,
  Input,
  InputNumber,
  Spin,
  Tabs,
  Tag,
  Typography,
} from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useBlocker } from 'react-router-dom'
import { QuizPreviewModal } from './QuizPreviewModal'
import { QuizQuestionForm } from './QuizQuestionForm'
import { QuizQuestionList } from './QuizQuestionList'
import { QuizResults } from './QuizResults'
import {
  createQuestion,
  duplicateQuestion,
  getQuizIssues,
  toDraftQuestions,
  toDraftSettings,
  toQuestionInputs,
  type DraftQuestion,
  type DraftSettings,
  type QuizIssue,
} from './quizDraft'

const UNDO_MESSAGE_KEY = 'quiz-question-removed'
const UNDO_SECONDS = 6

type EditorTab = 'questions' | 'settings' | 'results'

const fingerprint = (questions: DraftQuestion[]) => JSON.stringify(toQuestionInputs(questions))

export const QuizEditor = ({ courseId, quizId }: { courseId: string; quizId: string }) => {
  const { message, modal } = App.useApp()
  const [isLoaded, setIsLoaded] = useState(false)
  const [isMissing, setIsMissing] = useState(false)
  const [savedQuiz, setSavedQuiz] = useState<Quiz | null>(null)
  const [savedSettings, setSavedSettings] = useState<DraftSettings | null>(null)
  const [savedQuestions, setSavedQuestions] = useState('[]')
  const [settings, setSettings] = useState<DraftSettings | null>(null)
  const [questions, setQuestions] = useState<DraftQuestion[]>([])
  const [selectedKey, setSelectedKey] = useState<string | null>(null)
  const [summary, setSummary] = useState<CourseQuizSummaryItem | null>(null)
  const [activeTab, setActiveTab] = useState<EditorTab>('questions')
  const [shouldShowIssues, setShouldShowIssues] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  // Replaces the draft with the stored rows: without their new ids, the next
  // save would insert every newly added question a second time.
  const applyQuiz = useCallback((quiz: Quiz, selectedIndex: number) => {
    const draftQuestions = toDraftQuestions(quiz)
    const draftSettings = toDraftSettings(quiz)
    setSavedQuiz(quiz)
    setQuestions(draftQuestions)
    setSavedQuestions(fingerprint(draftQuestions))
    setSettings(draftSettings)
    setSavedSettings(draftSettings)
    setSelectedKey(draftQuestions[selectedIndex]?.key ?? draftQuestions[0]?.key ?? null)
  }, [])

  useEffect(() => {
    getQuizDetail({ id: quizId })
      .then(quiz => {
        if (quiz.courseId !== courseId) setIsMissing(true)
        else applyQuiz(quiz, 0)
      })
      .catch(() => setIsMissing(true))
      .finally(() => setIsLoaded(true))
    getCourseQuizSummary(courseId)
      .then(items => setSummary(items.find(item => item.quizId === quizId) ?? null))
      .catch(() => setSummary(null))
  }, [applyQuiz, courseId, quizId])

  const isQuestionsDirty = useMemo(
    () => fingerprint(questions) !== savedQuestions,
    [questions, savedQuestions],
  )
  const isSettingsDirty = JSON.stringify(settings) !== JSON.stringify(savedSettings)
  const isDirty = isQuestionsDirty || isSettingsDirty

  const blocker = useBlocker(isDirty)
  useEffect(() => {
    if (blocker.state !== 'blocked') return
    modal.confirm({
      title: 'Rời trang khi chưa lưu?',
      content: 'Các thay đổi chưa lưu của bài kiểm tra sẽ bị mất.',
      okText: 'Rời trang',
      cancelText: 'Ở lại',
      onOk: () => blocker.proceed(),
      onCancel: () => blocker.reset(),
    })
  }, [blocker, modal])

  const linkedLesson = summary?.linkedLesson ?? null
  const issues = useMemo(
    () => (settings ? getQuizIssues(settings, questions, !!linkedLesson) : []),
    [settings, questions, linkedLesson],
  )

  if (!isLoaded) {
    return (
      <div className="flex justify-center py-20">
        <Spin size="large" />
      </div>
    )
  }
  if (isMissing || !settings) {
    return (
      <Card>
        <Empty description="Không tìm thấy bài kiểm tra trong khoá này">
          <Link to={RoutePath.CourseExamsPage.getPath(courseId)}>Về danh sách bài kiểm tra</Link>
        </Empty>
      </Card>
    )
  }

  const handleSave = async () => {
    if (issues.length > 0) {
      setShouldShowIssues(true)
      return
    }
    setShouldShowIssues(false)
    setIsSaving(true)
    const selectedIndex = questions.findIndex(question => question.key === selectedKey)
    try {
      // Questions go only when changed: the server refuses question edits while
      // a learner is mid-attempt, and that must not block a plain rename.
      const saved = await updateQuiz({
        id: quizId,
        ...(isSettingsDirty && {
          ...settings,
          title: settings.title.trim(),
          passingScore: settings.passingScore ?? undefined,
        }),
        ...(isQuestionsDirty && { questions: toQuestionInputs(questions) }),
      })
      applyQuiz(saved, selectedIndex)
      message.destroy(UNDO_MESSAGE_KEY)
      void message.success('Đã lưu bài kiểm tra')
    } catch (error) {
      void message.error(getApiErrorMessage(error, 'Không thể lưu bài kiểm tra'))
    } finally {
      setIsSaving(false)
    }
  }

  const confirmRevert = () => {
    modal.confirm({
      title: 'Khôi phục bản đã lưu?',
      content: 'Mọi thay đổi chưa lưu về câu hỏi và cài đặt sẽ bị bỏ.',
      okText: 'Khôi phục',
      okButtonProps: { danger: true },
      cancelText: 'Hủy',
      onOk: () => {
        if (!savedQuiz) return
        applyQuiz(savedQuiz, 0)
        setShouldShowIssues(false)
        message.destroy(UNDO_MESSAGE_KEY)
      },
    })
  }

  const addQuestion = () => {
    const question = createQuestion()
    setQuestions(current => [...current, question])
    setSelectedKey(question.key)
  }

  const replaceQuestion = (next: DraftQuestion) =>
    setQuestions(current => current.map(item => (item.key === next.key ? next : item)))

  const copyQuestion = (index: number) => {
    const copy = duplicateQuestion(questions[index])
    setQuestions(current => [...current.slice(0, index + 1), copy, ...current.slice(index + 1)])
    setSelectedKey(copy.key)
  }

  const removeQuestion = (index: number) => {
    const removed = questions[index]
    const neighbor = questions[index + 1] ?? questions[index - 1]
    setQuestions(current => current.filter(item => item.key !== removed.key))
    setSelectedKey(neighbor?.key ?? null)
    void message.open({
      key: UNDO_MESSAGE_KEY,
      type: 'info',
      duration: UNDO_SECONDS,
      content: (
        <span>
          Đã xoá câu {index + 1}.{' '}
          <Button
            type="link"
            size="small"
            className="px-1"
            onClick={() => {
              message.destroy(UNDO_MESSAGE_KEY)
              setQuestions(current => [
                ...current.slice(0, index),
                removed,
                ...current.slice(index),
              ])
              setSelectedKey(removed.key)
            }}
          >
            Hoàn tác
          </Button>
        </span>
      ),
    })
  }

  const jumpToIssue = (issue: QuizIssue) => {
    if (issue.questionKey) {
      setActiveTab('questions')
      setSelectedKey(issue.questionKey)
    } else {
      setActiveTab(issue.message.startsWith('Cài đặt') ? 'settings' : 'questions')
    }
  }

  const selectedIndex = questions.findIndex(question => question.key === selectedKey)
  const selectedQuestion = questions[selectedIndex]

  return (
    <div className="flex flex-col gap-4">
      <Card
        className="z-10 shadow-sm lg:sticky lg:top-0"
        styles={{ body: { padding: '12px 16px' } }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <Link to={RoutePath.CourseExamsPage.getPath(courseId)} aria-label="Về danh sách">
              <Button type="text" icon={<ArrowLeftOutlined />} aria-hidden tabIndex={-1} />
            </Link>
            <div className="min-w-0">
              <Typography.Text strong ellipsis className="block text-base">
                {settings.title || 'Bài kiểm tra chưa có tên'}
              </Typography.Text>
              <div className="flex flex-wrap items-center gap-2">
                {linkedLesson ? (
                  <Typography.Text type="secondary" className="text-xs">
                    Chương {linkedLesson.modulePosition} · Bài {linkedLesson.lessonPosition}
                  </Typography.Text>
                ) : (
                  <Tag color="warning" className="m-0">
                    Chưa gắn
                  </Tag>
                )}
                {isDirty && (
                  <Tag color="processing" className="m-0">
                    Chưa lưu
                  </Tag>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button icon={<RollbackOutlined />} disabled={!isDirty} onClick={confirmRevert}>
              Khôi phục
            </Button>
            <Button icon={<EyeOutlined />} onClick={() => setIsPreviewOpen(true)}>
              Xem trước
            </Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={isSaving}
              disabled={!isDirty}
              onClick={() => void handleSave()}
            >
              Lưu
            </Button>
          </div>
        </div>
      </Card>

      {shouldShowIssues && issues.length > 0 && (
        <Alert
          type="error"
          showIcon
          title={`Còn ${issues.length} lỗi cần sửa trước khi lưu`}
          description={
            <ul className="m-0 flex list-none flex-col items-start gap-0.5 p-0">
              {issues.map(issue => (
                <li key={issue.message}>
                  <Button
                    type="link"
                    size="small"
                    className="h-auto p-0 text-left whitespace-normal"
                    onClick={() => jumpToIssue(issue)}
                  >
                    {issue.message}
                  </Button>
                </li>
              ))}
            </ul>
          }
        />
      )}

      {!!summary?.attempted && (
        <Alert
          type="info"
          showIcon
          title="Bài này đã có học viên làm. Thay đổi chỉ áp dụng cho các lượt làm sau; bài đã nộp giữ nguyên kết quả."
        />
      )}

      <Card styles={{ body: { paddingTop: 4 } }}>
        <Tabs
          activeKey={activeTab}
          onChange={key => setActiveTab(key as EditorTab)}
          items={[
            {
              key: 'questions',
              label: `Câu hỏi (${questions.length})`,
              children:
                questions.length === 0 ? (
                  <Empty description="Chưa có câu hỏi nào">
                    <Button type="primary" icon={<PlusOutlined />} onClick={addQuestion}>
                      Thêm câu hỏi
                    </Button>
                  </Empty>
                ) : (
                  <div className="flex flex-col gap-6 lg:flex-row">
                    <div className="w-full shrink-0 lg:w-80">
                      <QuizQuestionList
                        questions={questions}
                        selectedKey={selectedKey}
                        onSelect={setSelectedKey}
                        onReorder={setQuestions}
                        onAdd={addQuestion}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      {selectedQuestion && (
                        <QuizQuestionForm
                          key={selectedQuestion.key}
                          question={selectedQuestion}
                          index={selectedIndex}
                          onChange={replaceQuestion}
                          onDuplicate={() => copyQuestion(selectedIndex)}
                          onRemove={() => removeQuestion(selectedIndex)}
                        />
                      )}
                    </div>
                  </div>
                ),
            },
            {
              key: 'settings',
              label: 'Cài đặt',
              children: (
                <div className="flex max-w-xl flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor="quiz-title" className="text-sm font-semibold">
                      Tên bài kiểm tra
                    </label>
                    <Input
                      id="quiz-title"
                      maxLength={255}
                      value={settings.title}
                      onChange={event => setSettings({ ...settings, title: event.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="quiz-passing" className="text-sm font-semibold">
                        Điểm đạt (%)
                      </label>
                      <InputNumber
                        id="quiz-passing"
                        min={0}
                        max={100}
                        precision={0}
                        className="w-full"
                        value={settings.passingScore}
                        onChange={passingScore => setSettings({ ...settings, passingScore })}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="quiz-attempts" className="text-sm font-semibold">
                        Số lượt tối đa
                      </label>
                      <InputNumber
                        id="quiz-attempts"
                        min={1}
                        precision={0}
                        className="w-full"
                        placeholder="Không giới hạn"
                        value={settings.maxAttempts}
                        onChange={maxAttempts => setSettings({ ...settings, maxAttempts })}
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="quiz-time" className="text-sm font-semibold">
                        Thời gian (phút)
                      </label>
                      <InputNumber
                        id="quiz-time"
                        min={1}
                        precision={0}
                        className="w-full"
                        placeholder="Không giới hạn"
                        value={settings.timeLimit}
                        onChange={timeLimit => setSettings({ ...settings, timeLimit })}
                      />
                    </div>
                  </div>
                </div>
              ),
            },
            {
              key: 'results',
              label: 'Kết quả',
              children: <QuizResults courseId={courseId} quizId={quizId} summary={summary} />,
            },
          ]}
        />
      </Card>

      <QuizPreviewModal
        open={isPreviewOpen}
        settings={settings}
        questions={questions}
        onClose={() => setIsPreviewOpen(false)}
      />
    </div>
  )
}
