import { ConfirmDeleteModal } from '@/components/ModalVariants/ConfirmDeleteModal'
import type { ForumCategoryGroup, ForumSubCategory } from '@/models/Forum'
import {
  createCategoryGroup,
  createSubCategory,
  deleteCategoryGroup,
  deleteSubCategory,
  listCategoryGroups,
  listSubCategories,
  reorderCategoryGroup,
  reorderSubCategory,
  updateCategoryGroup,
  updateSubCategory,
} from '@/services/Forum'
import { isApiResponseError } from '@/utils/apiResponse'
import {
  DeleteOutlined,
  DownOutlined,
  EditOutlined,
  PlusOutlined,
  UpOutlined,
} from '@ant-design/icons'
import { App, Button, Card, Form, Input, Modal, Space, Switch, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useCallback, useEffect, useState } from 'react'

const { Title } = Typography

type GroupFormValues = { name: string }
type SubCatFormValues = {
  name: string
  description?: string
  requiresModeration: boolean
}

export const ForumStructurePage = () => {
  const { message } = App.useApp()
  const [groups, setGroups] = useState<ForumCategoryGroup[]>([])
  const [subCats, setSubCats] = useState<ForumSubCategory[]>([])
  const [loading, setLoading] = useState(false)

  const [groupModal, setGroupModal] = useState(false)
  const [editingGroup, setEditingGroup] = useState<ForumCategoryGroup | null>(null)
  const [groupSaving, setGroupSaving] = useState(false)
  const [groupForm] = Form.useForm<GroupFormValues>()

  const [subCatModal, setSubCatModal] = useState(false)
  const [editingSubCat, setEditingSubCat] = useState<ForumSubCategory | null>(null)
  const [addingToGroupId, setAddingToGroupId] = useState<string | null>(null)
  const [subCatSaving, setSubCatSaving] = useState(false)
  const [subCatForm] = Form.useForm<SubCatFormValues>()

  const [deleteState, setDeleteState] = useState<{
    open: boolean
    type: 'group' | 'subcat'
    id: string
  } | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [reordering, setReordering] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [g, s] = await Promise.all([listCategoryGroups(), listSubCategories()])
      setGroups(g)
      setSubCats(s)
    } catch {
      void message.error('Không thể tải dữ liệu')
    } finally {
      setLoading(false)
    }
  }, [message])

  useEffect(() => {
    void load()
  }, [load])

  // Group actions
  const openGroupModal = (group?: ForumCategoryGroup) => {
    setEditingGroup(group ?? null)
    groupForm.setFieldsValue({ name: group?.name ?? '' })
    setGroupModal(true)
  }

  const handleSaveGroup = async () => {
    const values = await groupForm.validateFields()
    setGroupSaving(true)
    try {
      if (editingGroup) {
        await updateCategoryGroup(editingGroup.id, { name: values.name })
        void message.success('Cập nhật nhóm thành công')
      } else {
        const maxOrder = groups.reduce((m, g) => Math.max(m, g.displayOrder), -1)
        await createCategoryGroup({ name: values.name, displayOrder: maxOrder + 1 })
        void message.success('Tạo nhóm thành công')
      }
      setGroupModal(false)
      void load()
    } catch (error) {
      void message.error(isApiResponseError(error) ? error.message : 'Có lỗi xảy ra')
    } finally {
      setGroupSaving(false)
    }
  }

  const handleReorderGroup = async (id: string, direction: 'up' | 'down') => {
    setReordering(true)
    try {
      await reorderCategoryGroup(id, direction)
      void load()
    } catch {
      void message.error('Không thể thay đổi thứ tự')
    } finally {
      setReordering(false)
    }
  }

  // SubCat actions
  const openSubCatModal = (groupId: string, subCat?: ForumSubCategory) => {
    setEditingSubCat(subCat ?? null)
    setAddingToGroupId(groupId)
    subCatForm.setFieldsValue(
      subCat
        ? {
            name: subCat.name,
            description: subCat.description ?? undefined,
            requiresModeration: subCat.requiresModeration,
          }
        : { name: '', description: undefined, requiresModeration: false },
    )
    setSubCatModal(true)
  }

  const handleSaveSubCat = async () => {
    const values = await subCatForm.validateFields()
    setSubCatSaving(true)
    try {
      if (editingSubCat) {
        await updateSubCategory(editingSubCat.id, {
          name: values.name,
          description: values.description,
          requiresModeration: values.requiresModeration,
        })
        void message.success('Cập nhật danh mục thành công')
      } else {
        const groupSubCats = subCats.filter(s => s.groupId === addingToGroupId)
        const maxOrder = groupSubCats.reduce((m, s) => Math.max(m, s.displayOrder), -1)
        await createSubCategory({
          name: values.name,
          description: values.description,
          groupId: addingToGroupId!,
          displayOrder: maxOrder + 1,
          requiresModeration: values.requiresModeration,
        })
        void message.success('Tạo danh mục thành công')
      }
      setSubCatModal(false)
      void load()
    } catch (error) {
      void message.error(isApiResponseError(error) ? error.message : 'Có lỗi xảy ra')
    } finally {
      setSubCatSaving(false)
    }
  }

  const handleReorderSubCat = async (id: string, direction: 'up' | 'down') => {
    setReordering(true)
    try {
      await reorderSubCategory(id, direction)
      void load()
    } catch {
      void message.error('Không thể thay đổi thứ tự')
    } finally {
      setReordering(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteState) return
    setDeleting(true)
    try {
      if (deleteState.type === 'group') {
        await deleteCategoryGroup(deleteState.id)
        void message.success('Đã xóa nhóm danh mục')
      } else {
        await deleteSubCategory(deleteState.id)
        void message.success('Đã xóa danh mục')
      }
      setDeleteState(null)
      void load()
    } catch (error) {
      void message.error(isApiResponseError(error) ? error.message : 'Không thể xóa')
    } finally {
      setDeleting(false)
    }
  }

  const sortedGroups = [...groups].sort((a, b) => a.displayOrder - b.displayOrder)

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <Title level={4} className="!mb-0">
          Cấu trúc diễn đàn
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openGroupModal()}>
          Thêm nhóm
        </Button>
      </div>

      <div className="flex flex-col gap-4">
        {sortedGroups.map((group, groupIndex) => {
          const groupSubCats = subCats
            .filter(s => s.groupId === group.id)
            .sort((a, b) => a.displayOrder - b.displayOrder)

          const subCatColumns: ColumnsType<ForumSubCategory> = [
            {
              title: '#',
              key: 'index',
              width: 48,
              render: (_, __, i) => <span className="text-gray-400 text-sm">{i + 1}</span>,
            },
            { title: 'Tên danh mục', dataIndex: 'name', key: 'name' },
            {
              title: 'Mô tả',
              dataIndex: 'description',
              key: 'description',
              render: (v: string | null) => v ?? <span className="text-gray-300">—</span>,
            },
            {
              title: 'Bài viết',
              dataIndex: 'threadCount',
              key: 'threadCount',
              width: 90,
              align: 'right',
            },
            {
              title: 'Bình luận',
              dataIndex: 'messageCount',
              key: 'messageCount',
              width: 90,
              align: 'right',
            },
            {
              title: 'Duyệt bài',
              key: 'requiresModeration',
              width: 90,
              align: 'center',
              render: (_, record) => (
                <Switch
                  size="small"
                  checked={record.requiresModeration}
                  onChange={async checked => {
                    try {
                      await updateSubCategory(record.id, { requiresModeration: checked })
                      void load()
                    } catch {
                      void message.error('Không thể cập nhật')
                    }
                  }}
                />
              ),
            },
            {
              title: '',
              key: 'actions',
              width: 180,
              render: (_, record, i) => (
                <Space size="small">
                  <Button
                    size="small"
                    icon={<UpOutlined />}
                    disabled={reordering || i === 0}
                    onClick={() => handleReorderSubCat(record.id, 'up')}
                  />
                  <Button
                    size="small"
                    icon={<DownOutlined />}
                    disabled={reordering || i === groupSubCats.length - 1}
                    onClick={() => handleReorderSubCat(record.id, 'down')}
                  />
                  <Button
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => openSubCatModal(group.id, record)}
                  />
                  <Button
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => setDeleteState({ open: true, type: 'subcat', id: record.id })}
                  />
                </Space>
              ),
            },
          ]

          return (
            <Card
              key={group.id}
              size="small"
              title={
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-sm font-normal">{groupIndex + 1}.</span>
                  <span className="font-semibold">{group.name}</span>
                  <Tag color="blue">{groupSubCats.length} danh mục</Tag>
                </div>
              }
              extra={
                <Space size="small">
                  <Button
                    size="small"
                    icon={<UpOutlined />}
                    disabled={reordering || groupIndex === 0}
                    onClick={() => handleReorderGroup(group.id, 'up')}
                  />
                  <Button
                    size="small"
                    icon={<DownOutlined />}
                    disabled={reordering || groupIndex === sortedGroups.length - 1}
                    onClick={() => handleReorderGroup(group.id, 'down')}
                  />
                  <Button
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => openGroupModal(group)}
                  />
                  <Button
                    size="small"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => setDeleteState({ open: true, type: 'group', id: group.id })}
                  />
                  <Button
                    size="small"
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => openSubCatModal(group.id)}
                  >
                    Thêm danh mục
                  </Button>
                </Space>
              }
            >
              <Table<ForumSubCategory>
                columns={subCatColumns}
                dataSource={groupSubCats}
                rowKey="id"
                pagination={false}
                size="small"
                loading={loading}
                locale={{ emptyText: 'Chưa có danh mục nào' }}
              />
            </Card>
          )
        })}

        {sortedGroups.length === 0 && !loading && (
          <Card>
            <p className="py-8 text-center text-gray-400">
              Chưa có nhóm danh mục nào. Nhấn "Thêm nhóm" để bắt đầu.
            </p>
          </Card>
        )}
      </div>

      {/* Group modal */}
      <Modal
        title={editingGroup ? 'Chỉnh sửa nhóm' : 'Tạo nhóm mới'}
        open={groupModal}
        onOk={handleSaveGroup}
        onCancel={() => setGroupModal(false)}
        confirmLoading={groupSaving}
        okText={editingGroup ? 'Cập nhật' : 'Tạo mới'}
        cancelText="Hủy"
      >
        <Form form={groupForm} layout="vertical" className="mt-4">
          <Form.Item
            name="name"
            label="Tên nhóm"
            rules={[{ required: true, message: 'Vui lòng nhập tên nhóm' }]}
          >
            <Input placeholder="Ví dụ: Chuyên khoa nội" />
          </Form.Item>
        </Form>
      </Modal>

      {/* SubCat modal */}
      <Modal
        title={editingSubCat ? 'Chỉnh sửa danh mục' : 'Tạo danh mục mới'}
        open={subCatModal}
        onOk={handleSaveSubCat}
        onCancel={() => setSubCatModal(false)}
        confirmLoading={subCatSaving}
        okText={editingSubCat ? 'Cập nhật' : 'Tạo mới'}
        cancelText="Hủy"
      >
        <Form form={subCatForm} layout="vertical" className="mt-4">
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
            name="requiresModeration"
            label="Yêu cầu duyệt bài"
            valuePropName="checked"
            extra="Bật: bài viết mới vào trạng thái chờ duyệt. Tắt: đăng ngay lập tức."
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>

      <ConfirmDeleteModal
        open={deleteState?.open ?? false}
        count={
          deleteState?.type === 'group'
            ? 1 + subCats.filter(s => s.groupId === deleteState.id).length
            : 1
        }
        isLoading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteState(null)}
      />
    </div>
  )
}
