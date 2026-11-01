import { RoutePath } from '@/router/RoutePath'
import { getQuizDetail } from '@/services/Quiz'
import { Empty, Spin } from 'antd'
import { useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'

// Old links keep working: the editor now lives under the quiz's course.
export const QuizDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const [courseId, setCourseId] = useState<string | null>(null)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    if (!id) return
    getQuizDetail({ id })
      .then(quiz => setCourseId(quiz.courseId))
      .catch(() => setHasError(true))
  }, [id])

  if (!id || hasError) return <Empty description="Không tìm thấy bài kiểm tra" />
  if (courseId) return <Navigate replace to={RoutePath.CourseExamEditPage.getPath(courseId, id)} />
  return (
    <div className="flex justify-center py-20">
      <Spin size="large" />
    </div>
  )
}
