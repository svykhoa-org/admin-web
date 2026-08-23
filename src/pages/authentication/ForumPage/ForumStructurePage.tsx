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
import {
  DeleteOutlined,
  EditOutlined,
  HolderOutlined,
  PlusOutlined,
  RightOutlined,
} from '@ant-design/icons'
import type { DragEndEvent } from '@dnd-kit/core'
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Alert,
  App,
  Button,
  Card,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Typography,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { LexoRank } from 'lexorank'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

const { Title } = Typography

type GroupFormValues = { name: string }
type SubCatFormValues = {
  name: string
  description?: string
  requiresModeration: boolean
}

type SortableRowContextValue = Pick<
  ReturnType<typeof useSortable>,
  'attributes' | 'listeners' | 'setActivatorNodeRef'
>

const SortableRowContext = createContext<SortableRowContextValue | null>(null)

/* eslint-disable react-hooks/refs -- dnd-kit exposes stable callback refs and listeners through context. */
const SortableDragHandle = () => {
  const context = useContext(SortableRowContext)
  if (!context) return null
  return (
    <span
      ref={context.setActivatorNodeRef}
      {...context.attributes}
      {...context.listeners}
      className="inline-flex cursor-grab touch-none text-gray-300 hover:text-gray-500 active:cursor-grabbing"
    >
      <HolderOutlined />
    </span>
  )
}
/* eslint-enable react-hooks/refs */

// Sortable row for Ant Design Table
const SortableTableRow = (
  props: React.HTMLAttributes<HTMLTableRowElement> & { 'data-row-key'?: string },
) => {
  const id = props['data-row-key'] ?? ''
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })
  const contextValue = useMemo(
    () => ({ attributes, listeners, setActivatorNodeRef }),
    [attributes, listeners, setActivatorNodeRef],
  )
  return (
    <SortableRowContext.Provider value={contextValue}>
      <tr
        ref={setNodeRef}
        {...props}
        style={{
          ...props.style,
          transform: CSS.Translate.toString(transform),
          transition: isDragging ? undefined : transition,
          opacity: isDragging ? 0.4 : 1,
        }}
      />
    </SortableRowContext.Provider>
  )
}

interface SortableGroupCardProps {
  group: ForumCategoryGroup
  children: React.ReactNode
  extra: React.ReactNode
  subCatCount: number
  collapsed: boolean
  onToggle: () => void
}

const SortableGroupCard = ({
  group,
  children,
  extra,
  subCatCount,
  collapsed,
  onToggle,
}: SortableGroupCardProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: group.id,
  })
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        transition: isDragging ? undefined : transition,
        opacity: isDragging ? 0.4 : 1,
        zIndex: isDragging ? 999 : undefined,
        position: 'relative',
      }}
    >
      <Card
        title={
          <div className="flex items-center gap-3">
            <HolderOutlined
              {...attributes}
              {...listeners}
              className="cursor-grab text-gray-300 transition-colors hover:text-gray-500 active:cursor-grabbing"
            />
            <button
              type="button"
              onClick={onToggle}
              className="flex flex-1 cursor-pointer items-center gap-2 text-left focus:outline-none border-none bg-white"
            >
              <RightOutlined
                className="text-[10px] text-gray-400 transition-transform duration-200"
                style={{ transform: collapsed ? 'rotate(0deg)' : 'rotate(90deg)' }}
              />
              <span className="text-sm font-semibold text-gray-800">{group.name}</span>
              <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">
                {subCatCount}
              </span>
            </button>
          </div>
        }
        extra={extra}
        styles={{
          header: { background: 'white' },
          body: collapsed ? { display: 'none' } : undefined,
        }}
      >
        {collapsed ? null : children}
      </Card>
    </div>
  )
}

export const ForumStructurePage = () => {
  const { message } = App.useApp()
  const [groups, setGroups] = useState<ForumCategoryGroup[]>([])
  const [subCats, setSubCats] = useState<ForumSubCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  const initializedRef = useRef(false)

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
  const [replacementId, setReplacementId] = useState<string>()
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

  useEffect(() => {
    if (!initializedRef.current && groups.length > 0) {
      initializedRef.current = true
      setCollapsedGroups(new Set(groups.map(g => g.id)))
    }
  }, [groups])

  const toggleGroup = (id: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const sortedGroups = [...groups].sort((a, b) => a.rank.localeCompare(b.rank))

  const groupSubCats = (groupId: string) =>
    subCats.filter(s => s.groupId === groupId).sort((a, b) => a.rank.localeCompare(b.rank))

  const deletingGroup =
    deleteState?.type === 'group' ? groups.find(group => group.id === deleteState.id) : undefined
  const deletingSubCategory =
    deleteState?.type === 'subcat'
      ? subCats.find(subCategory => subCategory.id === deleteState.id)
      : undefined
  const affectedItemCount = deletingGroup
    ? groupSubCats(deletingGroup.id).length
    : (deletingSubCategory?.totalThreadCount ?? deletingSubCategory?.threadCount ?? 0)
  const needsReplacement = affectedItemCount > 0
  const replacementOptions =
    deleteState?.type === 'group'
      ? groups
          .filter(group => group.id !== deleteState.id)
          .map(group => ({ label: group.name, value: group.id }))
      : subCats
          .filter(subCategory => subCategory.id !== deleteState?.id)
          .map(subCategory => ({
            label: `${groups.find(group => group.id === subCategory.groupId)?.name ?? 'Nhóm khác'} — ${subCategory.name}`,
            value: subCategory.id,
          }))

  const openDeleteDialog = (type: 'group' | 'subcat', id: string) => {
    setReplacementId(undefined)
    setDeleteState({ open: true, type, id })
  }

  const closeDeleteDialog = () => {
    setReplacementId(undefined)
    setDeleteState(null)
  }

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
          }
        : { name: '', description: undefined },
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
    if (needsReplacement && !replacementId) {
      void message.warning(
        deleteState.type === 'group'
          ? 'Vui lòng chọn nhóm nhận các danh mục'
          : 'Vui lòng chọn danh mục nhận các bài viết',
      )
      return
    }
    setDeleting(true)
    try {
      if (deleteState.type === 'group') {
        await deleteCategoryGroup(deleteState.id, replacementId)
        void message.success('Đã xóa nhóm danh mục')
      } else {
        await deleteSubCategory(deleteState.id, replacementId)
        void message.success('Đã xóa danh mục')
      }
      closeDeleteDialog()
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
      render: () => <SortableDragHandle />,
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
            onClick={() => openDeleteDialog('subcat', record.id)}
          />
        </Space>
      ),
    },
  ]

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Title level={4} className="mb-0!">
            Cấu trúc diễn đàn
          </Title>
          <p className="mt-1 text-sm text-gray-400">
            {sortedGroups.length} nhóm · Nhấn vào tên nhóm để mở/đóng danh mục
          </p>
        </div>
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
          <div className="flex flex-col gap-3">
            {sortedGroups.map(group => {
              const subs = groupSubCats(group.id)
              const collapsed = collapsedGroups.has(group.id)
              return (
                <SortableGroupCard
                  key={group.id}
                  group={group}
                  subCatCount={subs.length}
                  collapsed={collapsed}
                  onToggle={() => toggleGroup(group.id)}
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
                        onClick={() => openDeleteDialog('group', group.id)}
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
                <p className="py-10 text-center text-gray-400">
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
        </Form>
      </Modal>

      <Modal
        title={deleteState?.type === 'group' ? 'Xóa nhóm danh mục' : 'Xóa danh mục'}
        width={520}
        open={deleteState?.open ?? false}
        confirmLoading={deleting}
        okText={needsReplacement ? 'Chuyển và xóa' : 'Xóa'}
        cancelText="Hủy"
        okButtonProps={{
          danger: true,
          disabled: needsReplacement && (!replacementId || replacementOptions.length === 0),
        }}
        onOk={handleConfirmDelete}
        onCancel={closeDeleteDialog}
        destroyOnHidden
      >
        <div className="flex flex-col gap-4 pt-2">
          <Alert
            showIcon
            type={needsReplacement ? 'warning' : 'info'}
            title={
              deleteState?.type === 'group'
                ? `Nhóm “${deletingGroup?.name ?? ''}”${needsReplacement ? ` đang chứa ${affectedItemCount} danh mục` : ' không có danh mục'}.`
                : `Danh mục “${deletingSubCategory?.name ?? ''}”${needsReplacement ? ` đang chứa ${affectedItemCount} bài viết` : ' không có bài viết'}.`
            }
            description={
              needsReplacement
                ? deleteState?.type === 'group'
                  ? 'Chọn một nhóm khác để chuyển toàn bộ danh mục trước khi xóa. Thao tác chuyển và xóa được thực hiện cùng lúc.'
                  : 'Chọn một danh mục khác để chuyển toàn bộ bài viết trước khi xóa. Số liệu bài viết và bình luận sẽ được cộng sang danh mục nhận.'
                : 'Bạn có thể xóa trực tiếp vì không có dữ liệu phụ thuộc.'
            }
          />

          {needsReplacement && (
            <div>
              <Typography.Text strong>
                {deleteState?.type === 'group' ? 'Chuyển sang nhóm' : 'Chuyển sang danh mục'}
              </Typography.Text>
              <Select
                className="mt-2 w-full"
                showSearch
                optionFilterProp="label"
                value={replacementId}
                options={replacementOptions}
                placeholder={
                  replacementOptions.length > 0
                    ? 'Chọn nơi nhận dữ liệu'
                    : deleteState?.type === 'group'
                      ? 'Cần tạo thêm một nhóm trước khi xóa'
                      : 'Cần tạo thêm một danh mục trước khi xóa'
                }
                disabled={replacementOptions.length === 0}
                onChange={setReplacementId}
              />
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
