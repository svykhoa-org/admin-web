import { useRequest } from '@/hooks'
import { getPublishReadiness, publishCourse, type PublishReadiness } from '@/services/Course'
import { getApiErrorMessage } from '@/utils/apiResponse'
import { CheckCircleOutlined } from '@ant-design/icons'
import { App, Button, Popconfirm, Spin, Typography } from 'antd'
import { useState } from 'react'

interface Props {
  courseId: string
  onPublished: () => void
}

export const CoursePublishButton = ({ courseId, onPublished }: Props) => {
  const { message } = App.useApp()
  const [readiness, setReadiness] = useState<PublishReadiness | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const publishRequest = useRequest((id: string) => publishCourse({ id }))

  const handleOpenChange = async (open: boolean) => {
    if (!open) return
    setIsChecking(true)
    setReadiness(null)
    try {
      setReadiness(await getPublishReadiness(courseId))
    } catch {
      // The server still validates on publish, so a failed check does not block it.
      setReadiness(null)
    } finally {
      setIsChecking(false)
    }
  }

  const handlePublish = async () => {
    try {
      await publishRequest.execute(courseId)
      onPublished()
      void message.success('Khoá học đã được xuất bản')
    } catch (error) {
      void message.error(getApiErrorMessage(error, 'Không thể xuất bản khoá học'))
    }
  }

  const issues = readiness?.items.filter(item => !item.ok) ?? []

  return (
    <Popconfirm
      title="Xuất bản khoá học?"
      description={
        isChecking ? (
          <Spin size="small" />
        ) : issues.length > 0 ? (
          <div className="max-w-sm">
            <Typography.Text type="danger">Cần xử lý trước khi xuất bản:</Typography.Text>
            <ul className="mt-1 mb-0 pl-4">
              {issues.map(item => (
                <li key={`${item.key}-${item.lessonId ?? item.message}`}>{item.message}</li>
              ))}
            </ul>
          </div>
        ) : (
          'Học viên sẽ thấy và đăng ký được khoá học này.'
        )
      }
      onOpenChange={open => void handleOpenChange(open)}
      onConfirm={handlePublish}
      okText="Xuất bản"
      cancelText="Hủy"
      okButtonProps={{ disabled: isChecking || issues.length > 0 }}
    >
      <Button type="primary" icon={<CheckCircleOutlined />} loading={publishRequest.isLoading}>
        Xuất bản
      </Button>
    </Popconfirm>
  )
}
