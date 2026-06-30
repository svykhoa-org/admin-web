import { ConfirmDeleteModal } from '@/components/ModalVariants/ConfirmDeleteModal'
import type { ForumCategoryGroup, ForumSubCategory } from '@/models/Forum'
import {
  createCategoryGroup,
  createSubCategory,
  deleteCategoryGroup,
  deleteSubCategory,
  listCategoryGroups,
  listSubCategories,
  setGroupRank,
  setSubCategoryRank,
  updateCategoryGroup,
  updateSubCategory,
} from '@/services/Forum'
import { isApiResponseError } from '@/utils/apiResponse'
import { DeleteOutlined, EditOutlined, HolderOutlined, PlusOutlined } from '@ant-design/icons'
import type { DragEndEvent } from '@dnd-kit/core'
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { App, Button, Card, Form, Input, Modal, Space, Switch, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { LexoRank } from 'lexorank'
import { useCallback, useEffect, useState } from 'react'

const { Title } = Typography

type GroupFormValues = { name: string }
type SubCatFormValues = {
  name: string
  description?: string
  requiresModeration: boolean
}

// Sortable row for Ant Design Table
const SortableTableRow = (
  props: React.HTMLAttributes<HTMLTableRowElement> & { 'data-row-key'?: string },
) => {
  const id = props['data-row-key'] ?? ''
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  })
  return (
    <tr
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      {...props}
      style={{
        ...props.style,
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        cursor: 'grab',
      }}
    />
  )
}

interface SortableGroupCardProps {
  group: ForumCategoryGroup
  children: React.ReactNode
  extra: React.ReactNode
  subCatCount: number
}

const SortableGroupCard = ({ group, children, extra, subCatCount }: SortableGroupCardProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: group.id,
  })
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      <Card
        size="small"
        title={
          <div className="flex items-center gap-2">
            <HolderOutlined
              {...attributes}
              {...listeners}
              className="cursor-grab text-gray-400 active:cursor-grabbing"
            />
            <span className="font-semibold">{group.name}</span>
            <Tag color="blue">{subCatCount} danh mục</Tag>
          </div>
        }
        extra={extra}
      >
        {children}
      </Card>
    </div>
  )
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

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

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

  const sortedGroups = [...groups].sort((a, b) => a.rank.localeCompare(b.rank))

  const groupSubCats = (groupId: string) =>
    subCats.filter(s => s.groupId === groupId).sort((a, b) => a.rank.localeCompare(b.rank))

  // Group D&D
  const handleGroupDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = sortedGroups.findIndex(g => g.id === active.id)
    const newIndex = sortedGroups.findIndex(g => g.id === over.id)
    const reordered = arrayMove(sortedGroups, oldIndex, newIndex)

    setGroups(reordered)

    const prev = reordered[newIndex - 1]
    const next = reordered[newIndex + 1]
    const prevRank = prev ? LexoRank.parse(prev.rank) : LexoRank.min()
    const nextRank = next ? LexoRank.parse(next.rank) : LexoRank.max()
    const newRank = prevRank.between(nextRank)

    try {
      await setGroupRank(active.id as string, newRank.toString())
      setGroups(gs => gs.map(g => (g.id === active.id ? { ...g, rank: newRank.toString() } : g)))
    } catch {
      void message.error('Không thể lưu thứ tự')
      void load()
    }
  }

  // SubCat D&D
  const handleSubCatDragEnd = async (event: DragEndEvent, groupId: string) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const sorted = groupSubCats(groupId)
    const oldIndex = sorted.findIndex(s => s.id === active.id)
    const newIndex = sorted.findIndex(s => s.id === over.id)
    const reordered = arrayMove(sorted, oldIndex, newIndex)

    setSubCats(prev => [...prev.filter(s => s.groupId !== groupId), ...reordered])

    const prev = reordered[newIndex - 1]
    const next = reordered[newIndex + 1]
    const prevRank = prev ? LexoRank.parse(prev.rank) : LexoRank.min()
    const nextRank = next ? LexoRank.parse(next.rank) : LexoRank.max()
    const newRank = prevRank.between(nextRank)

    try {
      await setSubCategoryRank(active.id as string, newRank.toString())
      setSubCats(ss => ss.map(s => (s.id === active.id ? { ...s, rank: newRank.toString() } : s)))
    } catch {
      void message.error('Không thể lưu thứ tự')
      void load()
    }
  }

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
        const lastGroup = sortedGroups[sortedGroups.length - 1]
        const newRank = lastGroup
          ? LexoRank.parse(lastGroup.rank).genNext().toString()
          : '0|000001:'
        await createCategoryGroup({ name: values.name, displayOrder: groups.length, rank: newRank })
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
        const groupSubs = subCats
          .filter(s => s.groupId === addingToGroupId)
          .sort((a, b) => a.rank.localeCompare(b.rank))
        const lastSub = groupSubs[groupSubs.length - 1]
        const newRank = lastSub ? LexoRank.parse(lastSub.rank).genNext().toString() : '0|000001:'
        await createSubCategory({
          name: values.name,
          description: values.description,
          groupId: addingToGroupId!,
          displayOrder: groupSubs.length,
          requiresModeration: values.requiresModeration,
          rank: newRank,
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

  const subCatColumns = (group: ForumCategoryGroup): ColumnsType<ForumSubCategory> => [
    {
      key: 'drag',
      width: 32,
      render: () => (
        <HolderOutlined className="cursor-grab text-gray-300 hover:text-gray-500 active:cursor-grabbing" />
      ),
    },
    {
      title: '#',
      key: 'index',
      width: 48,
      render: (_: unknown, __: ForumSubCategory, i: number) => (
        <span className="text-gray-400 text-sm">{i + 1}</span>
      ),
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
      render: (_: unknown, record: ForumSubCategory) => (
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
      width: 120,
      render: (_: unknown, record: ForumSubCategory) => (
        <Space size="small">
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
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <Title level={4} className="!mb-0">
          Cấu trúc diễn đàn
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => openGroupModal()}>
          Thêm nhóm
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleGroupDragEnd}
      >
        <SortableContext items={sortedGroups.map(g => g.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-4">
            {sortedGroups.map(group => {
              const subs = groupSubCats(group.id)
              return (
                <SortableGroupCard
                  key={group.id}
                  group={group}
                  subCatCount={subs.length}
                  extra={
                    <Space size="small">
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
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={e => handleSubCatDragEnd(e, group.id)}
                  >
                    <SortableContext
                      items={subs.map(s => s.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <Table<ForumSubCategory>
                        components={{ body: { row: SortableTableRow } }}
                        columns={subCatColumns(group)}
                        dataSource={subs}
                        rowKey="id"
                        pagination={false}
                        size="small"
                        loading={loading}
                        locale={{ emptyText: 'Chưa có danh mục nào' }}
                      />
                    </SortableContext>
                  </DndContext>
                </SortableGroupCard>
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
        </SortableContext>
      </DndContext>

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
