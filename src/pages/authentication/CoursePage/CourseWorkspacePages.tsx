import { App, Card, Segmented } from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useBlocker, useOutletContext, useParams, useSearchParams } from 'react-router-dom'
import { CourseExams } from './components/CourseExams'
import { CourseModuleManager } from './components/CourseModuleManager'
import { CourseOverview } from './components/CourseOverview'
import { CourseProgressMatrix } from './components/CourseProgressMatrix'
import { CourseRoster } from './components/CourseRoster'
import { QuizEditor } from './components/exam-editor/QuizEditor'
import { CourseDangerCard } from './components/settings/CourseDangerCard'
import { CourseInfoCard } from './components/settings/CourseInfoCard'
import {
  AccessCard,
  CertificateCard,
  EnrollmentCard,
  ProctoringCard,
  ProgressionCard,
} from './components/settings/CoursePolicyCards'
import type { CourseWorkspaceContext } from './CourseWorkspaceLayout'

export const CourseOverviewPage = () => {
  const { course } = useOutletContext<CourseWorkspaceContext>()
  return <CourseOverview course={course} />
}

export const CourseContentPage = () => {
  const { course } = useOutletContext<CourseWorkspaceContext>()
  return (
    <Card>
      <CourseModuleManager courseId={course.id} enrolledTotal={course.data?.enrolledTotal ?? 0} />
    </Card>
  )
}

export const CourseLearnersPage = () => {
  const { course } = useOutletContext<CourseWorkspaceContext>()
  const [searchParams, setSearchParams] = useSearchParams()
  const view = searchParams.get('view') === 'list' ? 'list' : 'progress'
  const viewSwitcher = (
    <Segmented
      value={view}
      options={[
        { value: 'progress', label: 'Tiến độ' },
        { value: 'list', label: 'Danh sách' },
      ]}
      onChange={value => setSearchParams(value === 'list' ? { view: 'list' } : {})}
    />
  )
  return (
    <Card>
      {view === 'list' ? (
        <div className="flex flex-col gap-4">
          {viewSwitcher}
          <CourseRoster courseId={course.id} />
        </div>
      ) : (
        <CourseProgressMatrix courseId={course.id} toolbarStart={viewSwitcher} />
      )}
    </Card>
  )
}

export const CourseExamsPage = () => {
  const { course, refreshCourse } = useOutletContext<CourseWorkspaceContext>()
  return <CourseExams course={course} onSaved={refreshCourse} />
}

export const CourseExamEditPage = () => {
  const { course } = useOutletContext<CourseWorkspaceContext>()
  const { quizId } = useParams<{ quizId: string }>()
  if (!quizId) return null
  return <QuizEditor key={quizId} courseId={course.id} quizId={quizId} />
}

const useCardDirtyTracker = () => {
  const [dirtyCards, setDirtyCards] = useState<Record<string, boolean>>({})
  const [handlers] = useState(() => new Map<string, (isDirty: boolean) => void>())
  const trackerFor = useCallback(
    (card: string) => {
      let handler = handlers.get(card)
      if (!handler) {
        handler = (isDirty: boolean) =>
          setDirtyCards(current =>
            current[card] === isDirty ? current : { ...current, [card]: isDirty },
          )
        handlers.set(card, handler)
      }
      return handler
    },
    [handlers],
  )
  const hasDirtyCard = useMemo(() => Object.values(dirtyCards).some(Boolean), [dirtyCards])
  return { trackerFor, hasDirtyCard }
}

export const CourseSettingsPage = () => {
  const { course, refreshCourse } = useOutletContext<CourseWorkspaceContext>()
  const { modal } = App.useApp()
  const { trackerFor, hasDirtyCard } = useCardDirtyTracker()

  const blocker = useBlocker(hasDirtyCard)
  useEffect(() => {
    if (blocker.state !== 'blocked') return
    modal.confirm({
      title: 'Rời trang khi chưa lưu?',
      content: 'Các thay đổi chưa lưu trong Cài đặt sẽ bị mất.',
      okText: 'Rời trang',
      cancelText: 'Ở lại',
      onOk: () => blocker.proceed(),
      onCancel: () => blocker.reset(),
    })
  }, [blocker, modal])

  const { config } = course
  const shared = { course, onSaved: refreshCourse }

  return (
    <div className="flex flex-col gap-4">
      <CourseInfoCard {...shared} onDirtyChange={trackerFor('info')} />
      <EnrollmentCard {...shared} onDirtyChange={trackerFor('enrollment')} />
      {config && (
        <>
          <AccessCard {...shared} config={config} onDirtyChange={trackerFor('access')} />
          <ProgressionCard {...shared} config={config} onDirtyChange={trackerFor('progression')} />
          <ProctoringCard {...shared} config={config} onDirtyChange={trackerFor('proctoring')} />
          <CertificateCard {...shared} config={config} onDirtyChange={trackerFor('certificate')} />
        </>
      )}
      <CourseDangerCard {...shared} />
    </div>
  )
}
