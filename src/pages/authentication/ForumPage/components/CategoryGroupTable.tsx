import { ConfirmDeleteModal } from '@/components/ModalVariants/ConfirmDeleteModal'
import { DataTable } from '@/components/DataTable/DataTable'
import { useDelete } from '@/hooks'
import type { ForumCategoryGroup } from '@/models/Forum'
import {
  createCategoryGroup,
  deleteCategoryGroup,
  listCategoryGroups,
  updateCategoryGroup,
} from '@/services/Forum'
import { isApiResponseError } from '@/utils/apiResponse'
import { DeleteOutlined, EditOutlined, EllipsisOutlined } from '@ant-design/icons'
import { App, Button, Card, Dropdown, Form, Input, InputNumber, Modal } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useCallback, useEffect, useState } from 'react'

type FormValues = { name: string; displayOrder: number }

export const CategoryGroupTable = () => {
  const { message } = App.useApp()
  const [items, setItems] = useState<ForumCategoryGroup[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ForumCategoryGroup | null>(null)
  const [saving, setSaving] = useState(false)
  const [form] = Form.useForm<FormValues>()

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      setItems(await listCategoryGroups())
    } catch {
      void message.error('Không thể tải danh sách nhóm danh mục')
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
  } = useDelete<string>(deleteCategoryGroup)

  const openModal = (item?: ForumCategoryGroup) => {
    setEditingItem(item ?? null)
    form.setFieldsValue(
      item ? { name: item.name, displayOrder: item.displayOrder } : { name: '', displayOrder: 0 },
    )
    setModalOpen(true)
  }

  const handleSave = async () => {
    const values = await form.validateFields()
    setSaving(true)
    try {
      if (editingItem) {
        await updateCategoryGroup(editingItem.id, values)
        void message.success('Cập nhật thành công')
      } else {
        await createCategoryGroup(values)
        void message.success('Tạo nhóm thành công')
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
      void message.success('Xóa thành công')
      void load()
    } catch (error) {
      void message.error(isApiResponseError(error) ? error.message : 'Không thể xóa')
    }
  }

  const columns: ColumnsType<ForumCategoryGroup> = [
    { title: 'Tên nhóm', dataIndex: 'name', key: 'name' },
    { title: 'Thứ tự hiển thị', dataIndex: 'displayOrder', key: 'displayOrder', width: 160 },
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
        <DataTable<ForumCategoryGroup>
          title="Nhóm danh mục diễn đàn"
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
        title={editingItem ? 'Chỉnh sửa nhóm danh mục' : 'Tạo nhóm danh mục'}
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
            label="Tên nhóm"
            rules={[{ required: true, message: 'Vui lòng nhập tên nhóm' }]}
          >
            <Input placeholder="Ví dụ: Chuyên khoa nội" />
          </Form.Item>
          <Form.Item name="displayOrder" label="Thứ tự hiển thị" rules={[{ required: true }]}>
            <InputNumber className="w-full" min={0} />
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
