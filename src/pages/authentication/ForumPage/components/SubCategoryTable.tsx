import { ConfirmDeleteModal } from '@/components/ModalVariants/ConfirmDeleteModal'
import { DataTable } from '@/components/DataTable/DataTable'
import { useDelete } from '@/hooks'
import type { ForumCategoryGroup, ForumSubCategory } from '@/models/Forum'
import {
  createSubCategory,
  deleteSubCategory,
  listCategoryGroups,
  listSubCategories,
  updateSubCategory,
} from '@/services/Forum'
import { isApiResponseError } from '@/utils/apiResponse'
import { DeleteOutlined, EditOutlined, EllipsisOutlined } from '@ant-design/icons'
import { App, Button, Card, Dropdown, Form, Input, InputNumber, Modal, Select } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useCallback, useEffect, useState } from 'react'

type FormValues = { name: string; description?: string; groupId: string; displayOrder: number }

export const SubCategoryTable = () => {
  const { message } = App.useApp()
  const [items, setItems] = useState<ForumSubCategory[]>([])
  const [groups, setGroups] = useState<ForumCategoryGroup[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ForumSubCategory | null>(null)
  const [saving, setSaving] = useState(false)
  const [form] = Form.useForm<FormValues>()

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const [cats, grps] = await Promise.all([listSubCategories(), listCategoryGroups()])
      setItems(cats)
      setGroups(grps)
    } catch {
      void message.error('Không thể tải dữ liệu')
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
  } = useDelete<string>(deleteSubCategory)

  const openModal = (item?: ForumSubCategory) => {
    setEditingItem(item ?? null)
    form.setFieldsValue(
      item
        ? {
            name: item.name,
            description: item.description ?? undefined,
            groupId: item.groupId,
            displayOrder: item.displayOrder,
          }
        : {
            name: '',
            description: undefined,
            groupId: undefined as unknown as string,
            displayOrder: 0,
          },
    )
    setModalOpen(true)
  }

  const handleSave = async () => {
    const values = await form.validateFields()
    setSaving(true)
    try {
      if (editingItem) {
        await updateSubCategory(editingItem.id, values)
        void message.success('Cập nhật thành công')
      } else {
        await createSubCategory(values)
        void message.success('Tạo danh mục thành công')
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

  const columns: ColumnsType<ForumSubCategory> = [
    { title: 'Tên danh mục', dataIndex: 'name', key: 'name' },
    {
      title: 'Nhóm',
      key: 'group',
      render: (_, r) => r.group?.name ?? groups.find(g => g.id === r.groupId)?.name ?? r.groupId,
    },
    { title: 'Bài viết', dataIndex: 'threadCount', key: 'threadCount', width: 100 },
    { title: 'Bình luận', dataIndex: 'messageCount', key: 'messageCount', width: 100 },
    { title: 'Thứ tự', dataIndex: 'displayOrder', key: 'displayOrder', width: 90 },
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
        <DataTable<ForumSubCategory>
          title="Danh mục diễn đàn"
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
        title={editingItem ? 'Chỉnh sửa danh mục' : 'Tạo danh mục mới'}
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
            label="Tên danh mục"
            rules={[{ required: true, message: 'Vui lòng nhập tên' }]}
          >
            <Input placeholder="Ví dụ: Nội khoa tổng quát" />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={2} placeholder="Mô tả ngắn về danh mục" />
          </Form.Item>
          <Form.Item
            name="groupId"
            label="Nhóm danh mục"
            rules={[{ required: true, message: 'Vui lòng chọn nhóm' }]}
          >
            <Select
              placeholder="Chọn nhóm"
              options={groups.map(g => ({ label: g.name, value: g.id }))}
            />
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
