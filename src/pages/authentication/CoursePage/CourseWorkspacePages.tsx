import { App, Card } from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useBlocker, useOutletContext } from 'react-router-dom'
import { CourseModuleManager } from './components/CourseModuleManager'
import { CourseOverview } from './components/CourseOverview'
import { CourseRoster } from './components/CourseRoster'
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
      <CourseModuleManager courseId={course.id} />
    </Card>
  )
}

export const CourseLearnersPage = () => {
  const { course } = useOutletContext<CourseWorkspaceContext>()
  return (
    <Card>
      <CourseRoster courseId={course.id} />
    </Card>
  )
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
