import type { ForumPrefixTag, ForumSubCategory } from '@/models/Forum'
import { createAdminThread, listPrefixTags } from '@/services/Forum'
import { isApiResponseError } from '@/utils/apiResponse'
import { App, Checkbox, Form, Input, Modal, Select } from 'antd'
import { useEffect, useState } from 'react'
import ReactQuill from 'react-quill-new'
import 'react-quill-new/dist/quill.snow.css'

interface CreateThreadFormValues {
  subCategoryId: string
  title: string
  content: string
  prefixTagId?: string
  isPinned?: boolean
}

interface CreateThreadModalProps {
  open: boolean
  subCategories: ForumSubCategory[]
  onClose: () => void
  onCreated: () => void
}

const editorModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['blockquote', 'code-block', 'link'],
    ['clean'],
  ],
}

const hasTextContent = (html: string) => html.replace(/<[^>]*>/g, '').trim().length > 0

export const CreateThreadModal = ({
  open,
  subCategories,
  onClose,
  onCreated,
}: CreateThreadModalProps) => {
  const { message } = App.useApp()
  const [form] = Form.useForm<CreateThreadFormValues>()
  const [prefixTags, setPrefixTags] = useState<ForumPrefixTag[]>([])
  const [loadingTags, setLoadingTags] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return

    setLoadingTags(true)
    listPrefixTags()
      .then(setPrefixTags)
      .catch(() => void message.error('Không thể tải nhãn bài viết'))
      .finally(() => setLoadingTags(false))
  }, [message, open])

  const handleSubmit = async () => {
    const values = await form.validateFields()
    setSubmitting(true)
    try {
      await createAdminThread({
        ...values,
        title: values.title.trim(),
        prefixTagId: values.prefixTagId || undefined,
      })
      void message.success('Đã đăng bài viết')
      form.resetFields()
      onCreated()
    } catch (error) {
      void message.error(isApiResponseError(error) ? error.message : 'Không thể đăng bài viết')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      title="Viết bài mới"
      open={open}
      width={880}
      okText="Đăng bài"
      cancelText="Hủy"
      confirmLoading={submitting}
      onOk={() => void handleSubmit()}
      onCancel={onClose}
      afterClose={() => form.resetFields()}
      destroyOnHidden
    >
      <Form<CreateThreadFormValues>
        form={form}
        layout="vertical"
        initialValues={{ content: '', isPinned: false }}
        className="pt-3"
      >
        <Form.Item
          name="title"
          label="Tiêu đề"
          rules={[
            { required: true, whitespace: true, message: 'Vui lòng nhập tiêu đề' },
            { max: 500, message: 'Tiêu đề không được vượt quá 500 ký tự' },
          ]}
        >
          <Input placeholder="Nhập tiêu đề bài viết" maxLength={500} showCount />
        </Form.Item>

        <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
          <Form.Item
            name="subCategoryId"
            label="Danh mục"
            rules={[{ required: true, message: 'Vui lòng chọn danh mục' }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Chọn danh mục"
              options={subCategories.map(subCategory => ({
                value: subCategory.id,
                label: subCategory.group?.name
                  ? `${subCategory.group.name} — ${subCategory.name}`
                  : subCategory.name,
              }))}
            />
          </Form.Item>

          <Form.Item name="prefixTagId" label="Nhãn">
            <Select
              allowClear
              loading={loadingTags}
              placeholder="Không có nhãn"
              options={prefixTags.map(tag => ({ value: tag.id, label: tag.name }))}
            />
          </Form.Item>
        </div>

        <Form.Item
          name="content"
          label="Nội dung"
          rules={[
            {
              validator: (_, value: string) => {
                if (!value || !hasTextContent(value)) {
                  return Promise.reject(new Error('Vui lòng nhập nội dung'))
                }
                if (value.length > 20000) {
                  return Promise.reject(new Error('Nội dung không được vượt quá 20.000 ký tự'))
                }
                return Promise.resolve()
              },
            },
          ]}
        >
          <ReactQuill
            theme="snow"
            modules={editorModules}
            placeholder="Viết nội dung bài viết..."
            className="[&_.ql-container]:min-h-64"
          />
        </Form.Item>

        <Form.Item name="isPinned" valuePropName="checked" className="mb-0">
          <Checkbox>Ghim bài viết sau khi đăng</Checkbox>
        </Form.Item>
      </Form>
    </Modal>
  )
}
