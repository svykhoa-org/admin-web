import { useRequest } from '@/hooks'
import { CourseStatus, type Course } from '@/models/Course'
import { archiveCourse } from '@/services/Course'
import { getApiErrorMessage } from '@/utils/apiResponse'
import { InboxOutlined } from '@ant-design/icons'
import { App, Button, Card, Popconfirm, Typography } from 'antd'

interface Props {
  course: Course
  onSaved: () => void
}

export const CourseDangerCard = ({ course, onSaved }: Props) => {
  const { message } = App.useApp()
  const archiveRequest = useRequest((id: string) => archiveCourse({ id }))

  const handleArchive = async () => {
    try {
      await archiveRequest.execute(course.id)
      onSaved()
      void message.success('Khoá học đã được lưu trữ')
    } catch (error) {
      void message.error(getApiErrorMessage(error, 'Không thể lưu trữ khoá học'))
    }
  }

  return (
    <Card title="Vùng nguy hiểm">
      {course.status === CourseStatus.ARCHIVED ? (
        <Typography.Text type="secondary">
          Khoá học đang được lưu trữ. Dùng nút Xuất bản ở đầu trang để đưa khoá học trở lại.
        </Typography.Text>
      ) : (
        <div className="flex items-center justify-between gap-4">
          <div>
            <Typography.Text strong>Lưu trữ khoá học</Typography.Text>
            <br />
            <Typography.Text type="secondary">
              Khoá học bị ẩn khỏi danh sách công khai nhưng vẫn còn trong trang quản lý.
            </Typography.Text>
          </div>
          <Popconfirm
            title="Lưu trữ khoá học?"
            description="Khoá học sẽ bị ẩn khỏi danh sách công khai."
            onConfirm={handleArchive}
            okText="Lưu trữ"
            cancelText="Hủy"
          >
            <Button icon={<InboxOutlined />} loading={archiveRequest.isLoading}>
              Lưu trữ
            </Button>
          </Popconfirm>
        </div>
      )}
    </Card>
  )
}
