import { useOutletContext } from 'react-router-dom'
import { CourseForm } from './components/CourseForm'
import { CourseModuleManager } from './components/CourseModuleManager'
import { CourseRoster } from './components/CourseRoster'
import type { CourseWorkspaceContext } from './CourseWorkspaceLayout'

export const CourseContentPage = () => {
  const { course } = useOutletContext<CourseWorkspaceContext>()
  return <CourseModuleManager courseId={course.id} />
}

export const CourseLearnersPage = () => {
  const { course } = useOutletContext<CourseWorkspaceContext>()
  return <CourseRoster courseId={course.id} />
}

export const CourseSettingsPage = () => {
  const { course, refreshCourse } = useOutletContext<CourseWorkspaceContext>()
  return <CourseForm course={course} onSaved={refreshCourse} />
}
