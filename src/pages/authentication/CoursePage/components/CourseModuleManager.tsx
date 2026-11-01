import { ConfirmDeleteModal } from '@/components/ModalVariants/ConfirmDeleteModal'
import { LessonType, type CourseModule, type Lesson } from '@/models/Course'
import {
  createCourseModule,
  listCourseModule,
  removeCourseModule,
  updateCourseModule,
} from '@/services/CourseModule'
import { listLesson, removeLesson, updateLesson } from '@/services/Lesson'
import { getApiErrorMessage } from '@/utils/apiResponse'
import {
  BookOutlined,
  DeleteOutlined,
  EditOutlined,
  FileTextOutlined,
  HolderOutlined,
  LockOutlined,
  PlusOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons'
import { useSortableItem } from './useSortableItem'
import type { DragEndEvent } from '@dnd-kit/core'
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'
import {
  App,
  Button,
  Collapse,
  Form,
  Input,
  Modal,
  Space,
  Spin,
  Switch,
  Tag,
  theme,
  Tooltip,
  Typography,
} from 'antd'
import type { CollapseProps } from 'antd'
import type { ReactNode } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { LessonDrawer } from './LessonDrawer'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  courseId: string
  enrolledTotal: number
}

interface ModuleModalState {
  open: boolean
  mode: 'create' | 'edit'
  data?: CourseModule
}

interface LessonDrawerState {
  open: boolean
  mode: 'create' | 'edit'
  moduleId: string
  data?: Lesson
}

interface DeleteState {
  open: boolean
  type: 'module' | 'lesson'
  targetId: string
  moduleId?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const lessonTypeLabelMap: Record<LessonType, string> = {
  [LessonType.VIDEO]: 'Video',
  [LessonType.QUIZ]: 'Bài kiểm tra',
  [LessonType.DOCUMENT]: 'Tài liệu',
}

const lessonTypeIconMap: Record<LessonType, ReactNode> = {
  [LessonType.VIDEO]: <VideoCameraOutlined />,
  [LessonType.QUIZ]: <BookOutlined />,
  [LessonType.DOCUMENT]: <FileTextOutlined />,
}

const describeModule = (lessons: Lesson[]) => {
  const minutes = lessons.reduce((sum, lesson) => sum + (lesson.durationMinutes ?? 0), 0)
  return `${lessons.length} bài${minutes > 0 ? ` · ${minutes} phút` : ''}`
}

const reorderedById = (items: { id: string }[], event: DragEndEvent) => {
  const { active, over } = event
  if (!over || active.id === over.id) return null
  const oldIndex = items.findIndex(item => item.id === active.id)
  const newIndex = items.findIndex(item => item.id === over.id)
  return oldIndex < 0 || newIndex < 0 ? null : { oldIndex, newIndex }
}

// ─── Sub-component: sortable pieces ───────────────────────────────────────────

const DragHandle = ({
  label,
  handleProps,
}: {
  label: string
  handleProps: ReturnType<typeof useSortableItem>['handleProps']
}) => {
  const { token } = theme.useToken()
  return (
    <Tooltip title="Kéo để đổi thứ tự">
      <button
        type="button"
        aria-label={label}
        {...handleProps}
        onClick={event => event.stopPropagation()}
        className="inline-flex shrink-0 cursor-grab touch-none border-none bg-transparent p-1 active:cursor-grabbing"
        style={{ color: token.colorTextTertiary }}
      >
        <HolderOutlined />
      </button>
    </Tooltip>
  )
}

const SortableLessonRow = ({
  lesson,
  children,
  bordered,
}: {
  lesson: Lesson
  children: ReactNode
  bordered: boolean
}) => {
  const { token } = theme.useToken()
  const { setNodeRef, style, handleProps } = useSortableItem(lesson.id)
  return (
    <li
      ref={setNodeRef}
      className="flex items-center gap-3 px-2 py-2"
      style={{
        ...style,
        ...(bordered ? { borderTop: `1px solid ${token.colorBorderSecondary}` } : {}),
      }}
    >
      <DragHandle label={`Đổi thứ tự ${lesson.title}`} handleProps={handleProps} />
      {children}
    </li>
  )
}

const SortableChapter = ({
  item,
  title,
  defaultOpen,
}: {
  item: NonNullable<CollapseProps['items']>[number]
  title: string
  defaultOpen: boolean
}) => {
  const { setNodeRef, style, handleProps } = useSortableItem(String(item.key))
  return (
    <div ref={setNodeRef} style={style}>
      <Collapse
        items={[
          {
            ...item,
            label: (
              <div className="flex items-center gap-2">
                <DragHandle label={`Đổi thứ tự ${title}`} handleProps={handleProps} />
                <div className="min-w-0 flex-1">{item.label}</div>
              </div>
            ),
          },
        ]}
        bordered={false}
        expandIconPlacement="end"
        defaultActiveKey={defaultOpen ? [String(item.key)] : []}
        style={{ background: 'transparent' }}
        styles={{ header: { alignItems: 'center' } }}
      />
    </div>
  )
}

// ─── Sub-component: LessonTable ───────────────────────────────────────────────

interface LessonTableProps {
  moduleId: string
  lessons: Lesson[]
  isLoading: boolean
  onAddLesson: (moduleId: string) => void
  onEditLesson: (moduleId: string, lesson: Lesson) => void
  onDeleteLesson: (lesson: Lesson) => void
  onReorder: (event: DragEndEvent) => void
}

const LessonTable = ({
  moduleId,
  lessons,
  isLoading,
  onAddLesson,
  onEditLesson,
  onDeleteLesson,
  onReorder,
}: LessonTableProps) => {
  const { token } = theme.useToken()
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))
  return (
    <Spin spinning={isLoading}>
      {lessons.length === 0 && !isLoading ? (
        <Typography.Text type="secondary" className="block px-2 py-3 text-sm">
          Chương này chưa có bài học.
        </Typography.Text>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onReorder}>
          <SortableContext
            items={lessons.map(lesson => lesson.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="m-0 list-none p-0">
              {lessons.map((lesson, index) => (
                <SortableLessonRow key={lesson.id} lesson={lesson} bordered={index > 0}>
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: token.colorFillTertiary, color: token.colorTextSecondary }}
                  >
                    {lessonTypeIconMap[lesson.type]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Typography.Text ellipsis>{lesson.title}</Typography.Text>
                      {lesson.isPreview && (
                        <Tag color="blue" className="m-0">
                          Xem trước
                        </Tag>
                      )}
                      {lesson.isRequired === false && <Tag className="m-0">Không bắt buộc</Tag>}
                    </div>
                    <Typography.Text type="secondary" className="text-xs">
                      {lessonTypeLabelMap[lesson.type]}
                      {lesson.durationMinutes ? ` · ${lesson.durationMinutes} phút` : ''}
                    </Typography.Text>
                  </div>
                  <Tooltip title="Sửa bài học">
                    <Button
                      type="text"
                      size="small"
                      aria-label={`Sửa ${lesson.title}`}
                      icon={<EditOutlined />}
                      onClick={() => onEditLesson(moduleId, lesson)}
                    />
                  </Tooltip>
                  <Tooltip title="Xoá bài học">
                    <Button
                      type="text"
                      size="small"
                      danger
                      aria-label={`Xoá ${lesson.title}`}
                      icon={<DeleteOutlined />}
                      onClick={() => onDeleteLesson(lesson)}
                    />
                  </Tooltip>
                </SortableLessonRow>
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
      <Button
        type="link"
        icon={<PlusOutlined />}
        size="small"
        className="mt-1"
        onClick={() => onAddLesson(moduleId)}
      >
        Thêm bài học
      </Button>
    </Spin>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const CourseModuleManager = ({ courseId, enrolledTotal }: Props) => {
  const { message, modal } = App.useApp()
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))
  const { token } = theme.useToken()

  const [modules, setModules] = useState<CourseModule[]>([])
  const [lessonsByModule, setLessonsByModule] = useState<Record<string, Lesson[]>>({})
  const [loadingModules, setLoadingModules] = useState(false)
  const [loadingLessons, setLoadingLessons] = useState<Record<string, boolean>>({})

  const [moduleModal, setModuleModal] = useState<ModuleModalState>({ open: false, mode: 'create' })
  const [lessonDrawer, setLessonDrawer] = useState<LessonDrawerState>({
    open: false,
    mode: 'create',
    moduleId: '',
  })
  const [deleteState, setDeleteState] = useState<DeleteState>({
    open: false,
    type: 'module',
    targetId: '',
  })
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSavingModule, setIsSavingModule] = useState(false)

  const [moduleForm] = Form.useForm()

  // ─── Load modules ─────────────────────────────────────────────────────────

  const loadModules = useCallback(async () => {
    setLoadingModules(true)
    try {
      const result = await listCourseModule({ courseId })
      const items = Array.isArray(result) ? result : (result.items ?? [])
      setModules(items)
    } catch {
      void message.error('Không thể tải danh sách chương')
    } finally {
      setLoadingModules(false)
    }
  }, [courseId, message])

  useEffect(() => {
    void loadModules()
  }, [loadModules])

  // ─── Load lessons for a module ────────────────────────────────────────────

  const loadLessons = useCallback(
    async (moduleId: string) => {
      setLoadingLessons(prev => ({ ...prev, [moduleId]: true }))
      try {
        const result = await listLesson({ moduleId })
        const items = Array.isArray(result) ? result : (result.items ?? [])
        setLessonsByModule(prev => ({ ...prev, [moduleId]: items }))
      } catch {
        void message.error('Không thể tải danh sách bài học')
      } finally {
        setLoadingLessons(prev => ({ ...prev, [moduleId]: false }))
      }
    },
    [message],
  )

  useEffect(() => {
    modules.forEach(mod => {
      void loadLessons(mod.id)
    })
  }, [modules, loadLessons])

  // ─── Module CRUD ──────────────────────────────────────────────────────────

  const openModuleModal = (mode: 'create' | 'edit', data?: CourseModule) => {
    setModuleModal({ open: true, mode, data })
    if (mode === 'edit' && data) {
      moduleForm.setFieldsValue({
        title: data.title,
        description: data.description ?? '',
        locked: data.locked ?? false,
      })
    } else {
      moduleForm.setFieldsValue({
        title: '',
        description: '',
        locked: false,
      })
    }
  }

  const handleSaveModule = async () => {
    try {
      const values = await moduleForm.validateFields()
      setIsSavingModule(true)

      if (moduleModal.mode === 'create') {
        await createCourseModule({
          courseId,
          title: values.title as string,
          description: (values.description as string | undefined) || undefined,
          locked: (values.locked as boolean | undefined) ?? false,
        })
        void message.success('Tạo module thành công')
      } else if (moduleModal.data) {
        await updateCourseModule({
          courseId,
          id: moduleModal.data.id,
          title: values.title as string,
          description: (values.description as string | undefined) || undefined,
          locked: (values.locked as boolean | undefined) ?? false,
        })
        void message.success('Cập nhật chương thành công')
      }

      setModuleModal({ open: false, mode: 'create' })
      moduleForm.resetFields()
      void loadModules()
    } catch (error) {
      if (error && typeof error === 'object' && 'errorFields' in error) return
      const errorMessage = getApiErrorMessage(error, 'Có lỗi xảy ra')
      void message.error(errorMessage)
    } finally {
      setIsSavingModule(false)
    }
  }

  // ─── Reorder ──────────────────────────────────────────────────────────────

  // Reordering can change which lesson a sequential course locks for current learners.
  const confirmReorder = (apply: () => void) => {
    if (enrolledTotal === 0) {
      apply()
      return
    }
    modal.confirm({
      title: 'Đổi thứ tự khi khoá đã có học viên?',
      content: `Khoá có ${enrolledTotal} học viên. Với khoá học tuần tự, thứ tự mới có thể đổi bài đang được mở hoặc bị khoá của họ.`,
      okText: 'Đổi thứ tự',
      cancelText: 'Hủy',
      onOk: apply,
    })
  }

  const saveModuleOrder = async (reordered: CourseModule[]) => {
    setModules(reordered)
    try {
      await Promise.all(
        reordered.flatMap((mod, order) =>
          mod.order === order ? [] : [updateCourseModule({ courseId, id: mod.id, order })],
        ),
      )
    } catch (error) {
      void message.error(getApiErrorMessage(error, 'Không thể lưu thứ tự chương'))
    }
    void loadModules()
  }

  const saveLessonOrder = async (moduleId: string, reordered: Lesson[]) => {
    setLessonsByModule(prev => ({ ...prev, [moduleId]: reordered }))
    try {
      await Promise.all(
        reordered.flatMap((lesson, order) =>
          lesson.order === order ? [] : [updateLesson({ id: lesson.id, order })],
        ),
      )
    } catch (error) {
      void message.error(getApiErrorMessage(error, 'Không thể lưu thứ tự bài học'))
    }
    void loadLessons(moduleId)
  }

  const handleModuleDragEnd = (event: DragEndEvent) => {
    const move = reorderedById(modules, event)
    if (!move) return
    confirmReorder(() => void saveModuleOrder(arrayMove(modules, move.oldIndex, move.newIndex)))
  }

  const handleLessonDragEnd = (moduleId: string, event: DragEndEvent) => {
    const lessons = lessonsByModule[moduleId] ?? []
    const move = reorderedById(lessons, event)
    if (!move) return
    confirmReorder(
      () => void saveLessonOrder(moduleId, arrayMove(lessons, move.oldIndex, move.newIndex)),
    )
  }

  // ─── Lesson Drawer ────────────────────────────────────────────────────────

  const openLessonDrawer = (mode: 'create' | 'edit', moduleId: string, data?: Lesson) => {
    setLessonDrawer({ open: true, mode, moduleId, data })
  }

  const handleLessonSaved = () => {
    void loadLessons(lessonDrawer.moduleId)
  }

  // ─── Delete ───────────────────────────────────────────────────────────────

  const handleConfirmDelete = async () => {
    setIsDeleting(true)
    try {
      if (deleteState.type === 'module') {
        await removeCourseModule({ courseId, id: deleteState.targetId })
        void message.success('Xoá chương thành công')
        void loadModules()
      } else {
        await removeLesson({ id: deleteState.targetId })
        void message.success('Xóa bài học thành công')
        if (deleteState.moduleId) void loadLessons(deleteState.moduleId)
      }
      setDeleteState({ open: false, type: 'module', targetId: '' })
    } catch (error) {
      const errorMessage = getApiErrorMessage(error, 'Không thể xóa')
      void message.error(errorMessage)
    } finally {
      setIsDeleting(false)
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  const collapseItems = (modules ?? []).map((mod, index) => ({
    key: mod.id,
    style: {
      marginBottom: token.marginXS,
      border: `1px solid ${token.colorBorderSecondary}`,
      borderRadius: token.borderRadiusLG,
    },
    label: (
      <div className="flex items-center gap-3">
        <span
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm font-semibold"
          style={{ background: token.colorPrimaryBg, color: token.colorPrimary }}
        >
          {index + 1}
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Typography.Text strong ellipsis>
              {mod.title}
            </Typography.Text>
            {mod.locked && (
              <Tag icon={<LockOutlined />} color="orange" className="m-0">
                Khoá
              </Tag>
            )}
          </div>
          <Typography.Text type="secondary" className="text-xs">
            {describeModule(lessonsByModule[mod.id] ?? [])}
          </Typography.Text>
        </div>
      </div>
    ),
    extra: (
      <Space size={2} onClick={e => e.stopPropagation()}>
        <Tooltip title="Sửa chương">
          <Button
            type="text"
            size="small"
            aria-label={`Sửa ${mod.title}`}
            icon={<EditOutlined />}
            onClick={() => openModuleModal('edit', mod)}
          />
        </Tooltip>
        <Tooltip title="Xoá chương">
          <Button
            type="text"
            size="small"
            danger
            aria-label={`Xoá ${mod.title}`}
            icon={<DeleteOutlined />}
            onClick={() => setDeleteState({ open: true, type: 'module', targetId: mod.id })}
          />
        </Tooltip>
      </Space>
    ),
    children: (
      <LessonTable
        moduleId={mod.id}
        lessons={lessonsByModule[mod.id] ?? []}
        isLoading={loadingLessons[mod.id] ?? false}
        onAddLesson={mid => openLessonDrawer('create', mid)}
        onEditLesson={(mid, lesson) => openLessonDrawer('edit', mid, lesson)}
        onReorder={event => handleLessonDragEnd(mod.id, event)}
        onDeleteLesson={lesson =>
          setDeleteState({
            open: true,
            type: 'lesson',
            targetId: lesson.id,
            moduleId: lesson.moduleId,
          })
        }
      />
    ),
  }))

  return (
    <>
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <Typography.Text type="secondary">{(modules ?? []).length} chương</Typography.Text>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openModuleModal('create')}>
            Thêm chương
          </Button>
        </Space>

        {loadingModules ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <Spin />
          </div>
        ) : (modules ?? []).length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '48px 0',
              border: `1px dashed ${token.colorBorder}`,
              borderRadius: 8,
            }}
          >
            <Typography.Text type="secondary">
              Chưa có chương nào. Nhấn &quot;Thêm chương&quot; để bắt đầu.
            </Typography.Text>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleModuleDragEnd}
          >
            <SortableContext
              items={modules.map(mod => mod.id)}
              strategy={verticalListSortingStrategy}
            >
              {collapseItems.map((item, index) => (
                <SortableChapter
                  key={item.key}
                  item={item}
                  title={modules[index].title}
                  defaultOpen={index === 0}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </Space>

      {/* Module Modal */}
      <Modal
        title={moduleModal.mode === 'create' ? 'Thêm chương' : 'Cập nhật chương'}
        open={moduleModal.open}
        onOk={handleSaveModule}
        onCancel={() => {
          setModuleModal({ open: false, mode: 'create' })
          moduleForm.resetFields()
        }}
        confirmLoading={isSavingModule}
        okText={moduleModal.mode === 'create' ? 'Tạo' : 'Lưu'}
        cancelText="Hủy"
        destroyOnClose
      >
        <Form form={moduleForm} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item
            label="Tiêu đề chương"
            name="title"
            rules={[{ required: true, message: 'Vui lòng nhập tiêu đề chương' }]}
          >
            <Input placeholder="Ví dụ: Phần 1: Giới thiệu NestJS" />
          </Form.Item>
          <Form.Item label="Mô tả" name="description">
            <Input.TextArea rows={2} placeholder="Mô tả nội dung chương (tuỳ chọn)" />
          </Form.Item>
          <Form.Item label="Khoá chương" name="locked" valuePropName="checked">
            <Switch checkedChildren="Khoá" unCheckedChildren="Mở" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Lesson Drawer — full-screen với UI khác nhau theo type */}
      <LessonDrawer
        open={lessonDrawer.open}
        mode={lessonDrawer.mode}
        courseId={courseId}
        moduleId={lessonDrawer.moduleId}
        initialData={lessonDrawer.data}
        onClose={() => setLessonDrawer(prev => ({ ...prev, open: false }))}
        onSaved={handleLessonSaved}
      />

      {/* Delete Confirm */}
      <ConfirmDeleteModal
        open={deleteState.open}
        count={1}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteState({ open: false, type: 'module', targetId: '' })}
      />
    </>
  )
}
