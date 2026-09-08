import type { BulletinCategory } from '@/models/Bulletin'
import {
  createBulletinCategory,
  listBulletinCategories,
  removeBulletinCategory,
  updateBulletinCategory,
} from '@/services/Bulletin'
import { isApiResponseError } from '@/utils/apiResponse'
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import {
  App,
  Button,
  Card,
  Form,
  Input,
  Modal,
  Popconfirm,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useEffect, useState } from 'react'

interface CategoryFormValues {
  name: string
  description?: string
  color?: string
}

export const BulletinCategoryPage = () => {
  const { message } = App.useApp()
  const [form] = Form.useForm<CategoryFormValues>()
  const [items, setItems] = useState<BulletinCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<BulletinCategory | null>(null)
  const [saving, setSaving] = useState(false)

  const load = () => {
    setLoading(true)
    listBulletinCategories()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    setModalOpen(true)
  }
  const openEdit = (record: BulletinCategory) => {
    setEditing(record)
    form.setFieldsValue({
      name: record.name,
      description: record.description ?? undefined,
      color: record.color ?? undefined,
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    const values = await form.validateFields()
    setSaving(true)
    try {
      if (editing) {
        await updateBulletinCategory(editing.id, values)
        void message.success('Cập nhật chuyên mục thành công')
      } else {
        await createBulletinCategory(values)
        void message.success('Tạo chuyên mục thành công')
      }
      setModalOpen(false)
      load()
    } catch (error) {
      void message.error(isApiResponseError(error) ? error.message : 'Có lỗi xảy ra')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await removeBulletinCategory(id)
      void message.success('Xóa chuyên mục thành công')
      load()
    } catch (error) {
      void message.error(isApiResponseError(error) ? error.message : 'Không thể xóa chuyên mục')
    }
  }

  const columns: ColumnsType<BulletinCategory> = [
    { title: 'Tên', dataIndex: 'name', key: 'name' },
    { title: 'Slug', dataIndex: 'slug', key: 'slug', render: (v: string) => <Tag>{v}</Tag> },
    {
      title: 'Màu',
      dataIndex: 'color',
      key: 'color',
      width: 100,
      render: (color?: string) =>
        color ? (
          <Tag color={color}>{color}</Tag>
        ) : (
          <Typography.Text type="secondary">-</Typography.Text>
        ),
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      render: (v?: string) => v || <Typography.Text type="secondary">-</Typography.Text>,
    },
    {
      title: '',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          <Popconfirm title="Xóa chuyên mục?" onConfirm={() => void handleDelete(record.id)}>
            <Button size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <Typography.Title level={4} style={{ margin: 0 }}>
          Chuyên mục thông báo
        </Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          Thêm chuyên mục
        </Button>
      </div>
      <Table<BulletinCategory>
        rowKey="id"
        columns={columns}
        dataSource={items}
        loading={loading}
        pagination={false}
      />
      <Modal
        open={modalOpen}
        title={editing ? 'Sửa chuyên mục' : 'Thêm chuyên mục'}
        onOk={() => void handleSave()}
        onCancel={() => setModalOpen(false)}
        confirmLoading={saving}
        okText="Lưu"
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Tên chuyên mục"
            rules={[{ required: true, message: 'Vui lòng nhập tên' }]}
          >
            <Input placeholder="Ví dụ: Bảo trì" />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item
            name="color"
            label="Màu (hex)"
            rules={[{ pattern: /^#[0-9a-fA-F]{6}$/, message: 'Định dạng hex, ví dụ #0ea5e9' }]}
          >
            <Input placeholder="#0ea5e9" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}
