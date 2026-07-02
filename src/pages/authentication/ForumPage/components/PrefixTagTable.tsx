import { ConfirmDeleteModal } from '@/components/ModalVariants/ConfirmDeleteModal'
import { DataTable } from '@/components/DataTable/DataTable'
import { useDelete } from '@/hooks'
import type { ForumPrefixTag } from '@/models/Forum'
import { createPrefixTag, deletePrefixTag, listPrefixTags, updatePrefixTag } from '@/services/Forum'
import { isApiResponseError } from '@/utils/apiResponse'
import { DeleteOutlined, EditOutlined, EllipsisOutlined } from '@ant-design/icons'
import { App, Button, Card, Dropdown, Form, Input, Modal, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useCallback, useEffect, useState } from 'react'

type FormValues = { name: string; colorHex: string }

export const PrefixTagTable = () => {
  const { message } = App.useApp()
  const [items, setItems] = useState<ForumPrefixTag[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ForumPrefixTag | null>(null)
  const [saving, setSaving] = useState(false)
  const [form] = Form.useForm<FormValues>()

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      setItems(await listPrefixTags())
    } catch {
      void message.error('Không thể tải danh sách tag')
    } finally {
      setIsLoading(false)
    }
  }, [message])

  useEffect(() => {
    void load()
  }, [load])

  const {
    selectedRowKeys,
    setSelectedRowKeys,
    deleteModal,
    openDeleteModal,
    closeDeleteModal,
    confirmDelete,
    isDeleting,
  } = useDelete<string>(deletePrefixTag)

  const openModal = (item?: ForumPrefixTag) => {
    setEditingItem(item ?? null)
    form.setFieldsValue(
      item ? { name: item.name, colorHex: item.colorHex } : { name: '', colorHex: '#3B82F6' },
    )
    setModalOpen(true)
  }

  const handleSave = async () => {
    const values = await form.validateFields()
    setSaving(true)
    try {
      if (editingItem) {
        await updatePrefixTag(editingItem.id, values)
        void message.success('Cập nhật tag thành công')
      } else {
        await createPrefixTag(values)
        void message.success('Tạo tag thành công')
      }
      setModalOpen(false)
      void load()
    } catch (error) {
      void message.error(isApiResponseError(error) ? error.message : 'Có lỗi xảy ra')
    } finally {
      setSaving(false)
    }
  }

  const handleConfirmDelete = async () => {
    try {
      await confirmDelete()
      void message.success('Xóa tag thành công')
      void load()
    } catch (error) {
      void message.error(isApiResponseError(error) ? error.message : 'Không thể xóa')
    }
  }

  const columns: ColumnsType<ForumPrefixTag> = [
    {
      title: 'Tag',
      key: 'tag',
      render: (_, r) => (
        <Tag style={{ backgroundColor: r.colorHex, color: '#fff', border: 'none' }}>{r.name}</Tag>
      ),
    },
    { title: 'Tên', dataIndex: 'name', key: 'name' },
    { title: 'Màu (HEX)', dataIndex: 'colorHex', key: 'colorHex' },
    {
      title: '',
      key: 'actions',
      width: 48,
      render: (_, record) => (
        <Dropdown
          trigger={['click']}
          menu={{
            items: [
              { key: 'edit', label: 'Chỉnh sửa', icon: <EditOutlined /> },
              { key: 'delete', label: 'Xóa', icon: <DeleteOutlined />, danger: true },
            ],
            onClick: ({ key }) => {
              if (key === 'edit') openModal(record)
              if (key === 'delete') openDeleteModal([record.id])
            },
          }}
        >
          <Button size="small" icon={<EllipsisOutlined />} />
        </Dropdown>
      ),
    },
  ]

  return (
    <>
      <Card>
        <DataTable<ForumPrefixTag>
          title="Prefix Tag diễn đàn"
          columns={columns}
          dataSource={items}
          loading={isLoading}
          selectionAction={{
            selectedRowKeys,
            onChange: keys => setSelectedRowKeys(keys as string[]),
          }}
          createAction={{ onCreate: () => openModal() }}
          deleteAction={{
            onDelete: () => openDeleteModal(selectedRowKeys),
            disabled: selectedRowKeys.length === 0,
          }}
        />
      </Card>

      <Modal
        title={editingItem ? 'Chỉnh sửa tag' : 'Tạo tag mới'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        confirmLoading={saving}
        okText={editingItem ? 'Cập nhật' : 'Tạo mới'}
        cancelText="Hủy"
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item
            name="name"
            label="Tên tag"
            rules={[{ required: true, message: 'Vui lòng nhập tên tag' }]}
          >
            <Input placeholder="Ví dụ: Hỏi đáp" />
          </Form.Item>
          <Form.Item
            name="colorHex"
            label="Màu HEX"
            rules={[
              { required: true },
              { pattern: /^#[0-9A-Fa-f]{6}$/, message: 'Định dạng phải là #RRGGBB' },
            ]}
            extra="Ví dụ: #3B82F6"
          >
            <Input placeholder="#3B82F6" maxLength={7} />
          </Form.Item>
        </Form>
      </Modal>

      <ConfirmDeleteModal
        open={deleteModal.open}
        count={deleteModal.ids.length}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={closeDeleteModal}
      />
    </>
  )
}
