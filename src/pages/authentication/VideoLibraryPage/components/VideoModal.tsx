import { UploadSingleVideo } from '@/components/Upload/UploadSingleVideo'
import { createVideo, updateVideo, type CreateVideoInput, type VideoDto } from '@/services/Video'
import { listUser } from '@/services/User'
import type { User } from '@/models/User'
import { isApiResponseError } from '@/utils/apiResponse'
import { App, Form, Input, Modal, Select } from 'antd'
import { useEffect, useState } from 'react'

interface Props {
  open: boolean
  video: VideoDto | null
  onClose: () => void
  onSuccess: () => void
}

interface FormValues {
  assetId: string
  title: string
  description?: string
  authorId?: string
  durationMinutes?: number
}

export const VideoModal = ({ open, video, onClose, onSuccess }: Props) => {
  const { message } = App.useApp()
  const [form] = Form.useForm<FormValues>()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [assetId, setAssetId] = useState<string | undefined>(undefined)
  const [users, setUsers] = useState<User[]>([])
  const isEditMode = !!video

  useEffect(() => {
    listUser({ pageSize: 200 })
      .then(data => setUsers(data.items))
      .catch(() => void message.error('Không thể tải danh sách người dùng'))
  }, [message])

  useEffect(() => {
    if (!open) return
    if (video) {
      form.setFieldsValue({
        title: video.title,
        description: video.description ?? undefined,
        authorId: video.authorId ?? undefined,
        durationMinutes: video.durationMinutes,
      })
      setAssetId(video.assetId)
    } else {
      form.resetFields()
      setAssetId(undefined)
    }
  }, [open, video, form])

  const handleSubmit = async (values: FormValues) => {
    const effectiveAssetId = assetId
    if (!effectiveAssetId) {
      void message.warning('Vui lòng tải lên video trước khi lưu.')
      return
    }

    setIsSubmitting(true)
    try {
      if (isEditMode && video) {
        await updateVideo({
          id: video.id,
          title: values.title,
          description: values.description?.trim() || undefined,
          authorId: values.authorId || undefined,
          durationMinutes: values.durationMinutes,
        })
        void message.success('Cập nhật video thành công')
      } else {
        const payload: CreateVideoInput = {
          assetId: effectiveAssetId,
          title: values.title,
          description: values.description?.trim() || undefined,
          authorId: values.authorId || undefined,
          durationMinutes: values.durationMinutes,
        }
        await createVideo(payload)
        void message.success('Tạo video thành công')
      }
      onSuccess()
      onClose()
    } catch (error) {
      void message.error(
        isApiResponseError(error) ? error.message : 'Có lỗi xảy ra. Vui lòng thử lại.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const userOptions = users.map(u => ({ label: u.fullName || u.email, value: u.id }))

  return (
    <Modal
      open={open}
      title={isEditMode ? 'Cập nhật video' : 'Thêm video mới'}
      okText={isEditMode ? 'Cập nhật' : 'Tạo mới'}
      cancelText="Huỷ"
      confirmLoading={isSubmitting}
      onOk={() => form.submit()}
      onCancel={onClose}
      width={640}
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={handleSubmit} className="mt-4">
        <Form.Item label="Video">
          <UploadSingleVideo
            existingVideoId={isEditMode ? video?.assetId : undefined}
            label="Video"
            onVideoReady={id => setAssetId(id)}
            onVideoRemoved={() => setAssetId(undefined)}
            size="block"
          />
        </Form.Item>

        <Form.Item
          name="title"
          label="Tiêu đề"
          rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}
        >
          <Input placeholder="Tiêu đề video" />
        </Form.Item>

        <Form.Item name="description" label="Mô tả">
          <Input.TextArea rows={3} placeholder="Mô tả video (tuỳ chọn)" />
        </Form.Item>

        <Form.Item name="authorId" label="Tác giả">
          <Select
            allowClear
            showSearch
            placeholder="Chọn tác giả"
            options={userOptions}
            filterOption={(input, opt) =>
              (opt?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
          />
        </Form.Item>

        <Form.Item name="durationMinutes" label="Thời lượng (phút)">
          <Input type="number" min={0} placeholder="Số phút" />
        </Form.Item>
      </Form>
    </Modal>
  )
}
