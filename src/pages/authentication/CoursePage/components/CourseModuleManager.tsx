import dayjs from 'dayjs'
import { ConfirmDeleteModal } from '@/components/ModalVariants/ConfirmDeleteModal'
import { LessonType, type CourseModule, type Lesson } from '@/models/Course'
import {
  createCourseModule,
  listCourseModule,
  removeCourseModule,
  updateCourseModule,
} from '@/services/CourseModule'
import { listLesson, removeLesson } from '@/services/Lesson'
import { isApiResponseError } from '@/utils/apiResponse'
import {
  BookOutlined,
  DeleteOutlined,
  EditOutlined,
  FileTextOutlined,
  PlusOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons'
import {
  App,
  Button,
  Collapse,
  Form,
  Input,
  InputNumber,
  Modal,
  Space,
  Spin,
  Switch,
  Table,
  Tag,
  Typography,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { ReactNode } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { LessonDrawer } from './LessonDrawer'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  courseId: string
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

const lessonTypeColorMap: Record<LessonType, string> = {
  [LessonType.VIDEO]: 'blue',
  [LessonType.QUIZ]: 'purple',
  [LessonType.DOCUMENT]: 'green',
}

const lessonTypeLabelMap: Record<LessonType, string> = {
  [LessonType.VIDEO]: 'Video',
  [LessonType.QUIZ]: 'Quiz',
  [LessonType.DOCUMENT]: 'Tài liệu',
}

const lessonTypeIconMap: Record<LessonType, ReactNode> = {
  [LessonType.VIDEO]: <VideoCameraOutlined />,
  [LessonType.QUIZ]: <BookOutlined />,
  [LessonType.DOCUMENT]: <FileTextOutlined />,
}

// ─── Sub-component: LessonTable ───────────────────────────────────────────────

interface LessonTableProps {
  moduleId: string
  lessons: Lesson[]
  isLoading: boolean
  onAddLesson: (moduleId: string) => void
  onEditLesson: (moduleId: string, lesson: Lesson) => void
  onDeleteLesson: (lesson: Lesson) => void
}

const LessonTable = ({
  moduleId,
  lessons,
  isLoading,
  onAddLesson,
  onEditLesson,
  onDeleteLesson,
}: LessonTableProps) => {
  const columns: ColumnsType<Lesson> = [
    {
      title: '#',
      dataIndex: 'order',
      key: 'order',
      width: 48,
      render: (value: number) => <Typography.Text type="secondary">{value}</Typography.Text>,
    },
    {
      title: 'Tiêu đề bài học',
      dataIndex: 'title',
      key: 'title',
      render: (value: string, record) => (
        <Space size={6}>
          <Typography.Text type="secondary">{lessonTypeIconMap[record.type]}</Typography.Text>
          <Typography.Text>{value}</Typography.Text>
        </Space>
      ),
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (value: LessonType) => (
        <Tag color={lessonTypeColorMap[value]}>{lessonTypeLabelMap[value]}</Tag>
      ),
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (value: string | number) => (
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {dayjs(value).format('DD/MM/YYYY HH:mm')}
        </Typography.Text>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 80,
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => onEditLesson(moduleId, record)}
          />
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => onDeleteLesson(record)}
          />
        </Space>
      ),
    },
  ]

  return (
    <Space direction="vertical" size={8} style={{ width: '100%' }}>
      <Table<Lesson>
        rowKey="id"
        size="small"
        columns={columns}
        dataSource={lessons}
        loading={isLoading}
        pagination={false}
        locale={{ emptyText: 'Chưa có bài học nào' }}
      />
      <Button
        type="dashed"
        icon={<PlusOutlined />}
        size="small"
        onClick={() => onAddLesson(moduleId)}
      >
        Thêm bài học
      </Button>
    </Space>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const CourseModuleManager = ({ courseId }: Props) => {
  const { message } = App.useApp()

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
      void message.error('Không thể tải danh sách module')
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
        order: data.order,
        description: data.description ?? '',
        locked: data.locked ?? false,
      })
    } else {
      moduleForm.setFieldsValue({
        title: '',
        order: (modules ?? []).length + 1,
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
          order: values.order as number,
          description: (values.description as string | undefined) || undefined,
          locked: (values.locked as boolean | undefined) ?? false,
        })
        void message.success('Tạo module thành công')
      } else if (moduleModal.data) {
        await updateCourseModule({
          courseId,
          id: moduleModal.data.id,
          title: values.title as string,
          order: values.order as number,
          description: (values.description as string | undefined) || undefined,
          locked: (values.locked as boolean | undefined) ?? false,
        })
        void message.success('Cập nhật module thành công')
      }

      setModuleModal({ open: false, mode: 'create' })
      moduleForm.resetFields()
      void loadModules()
    } catch (error) {
      if (error && typeof error === 'object' && 'errorFields' in error) return
      const errorMessage = isApiResponseError(error) ? error.message : 'Có lỗi xảy ra'
      void message.error(errorMessage)
    } finally {
      setIsSavingModule(false)
    }
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
        void message.success('Xóa module thành công')
        void loadModules()
      } else {
        await removeLesson({ id: deleteState.targetId })
        void message.success('Xóa bài học thành công')
        if (deleteState.moduleId) void loadLessons(deleteState.moduleId)
      }
      setDeleteState({ open: false, type: 'module', targetId: '' })
    } catch (error) {
      const errorMessage = isApiResponseError(error) ? error.message : 'Không thể xóa'
      void message.error(errorMessage)
    } finally {
      setIsDeleting(false)
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  const collapseItems = (modules ?? []).map(mod => ({
    key: mod.id,
    label: (
      <Space>
        <Tag>{mod.order}</Tag>
        <Typography.Text strong>{mod.title}</Typography.Text>
        {mod.locked && <Tag color="orange">Khoá</Tag>}
        <Typography.Text type="secondary">
          ({(lessonsByModule[mod.id] ?? []).length} bài học)
        </Typography.Text>
      </Space>
    ),
    extra: (
      <Space onClick={e => e.stopPropagation()}>
        <Button size="small" icon={<EditOutlined />} onClick={() => openModuleModal('edit', mod)} />
        <Button
          size="small"
          danger
          icon={<DeleteOutlined />}
          onClick={() => setDeleteState({ open: true, type: 'module', targetId: mod.id })}
        />
      </Space>
    ),
    children: (
      <LessonTable
        moduleId={mod.id}
        lessons={lessonsByModule[mod.id] ?? []}
        isLoading={loadingLessons[mod.id] ?? false}
        onAddLesson={mid => openLessonDrawer('create', mid)}
        onEditLesson={(mid, lesson) => openLessonDrawer('edit', mid, lesson)}
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
          <Typography.Text type="secondary">{(modules ?? []).length} module</Typography.Text>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => openModuleModal('create')}>
            Thêm module
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
              border: '1px dashed #d9d9d9',
              borderRadius: 8,
            }}
          >
            <Typography.Text type="secondary">
              Chưa có module nào. Nhấn &quot;Thêm module&quot; để bắt đầu.
            </Typography.Text>
          </div>
        ) : (
          <Collapse items={collapseItems} />
        )}
      </Space>

      {/* Module Modal */}
      <Modal
        title={moduleModal.mode === 'create' ? 'Thêm module' : 'Cập nhật module'}
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
            label="Tiêu đề module"
            name="title"
            rules={[{ required: true, message: 'Vui lòng nhập tiêu đề module' }]}
          >
            <Input placeholder="Ví dụ: Phần 1: Giới thiệu NestJS" />
          </Form.Item>
          <Form.Item
            label="Thứ tự"
            name="order"
            rules={[{ required: true, message: 'Vui lòng nhập thứ tự' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Mô tả" name="description">
            <Input.TextArea rows={2} placeholder="Mô tả nội dung module (tuỳ chọn)" />
          </Form.Item>
          <Form.Item label="Khoá module" name="locked" valuePropName="checked">
            <Switch checkedChildren="Khoá" unCheckedChildren="Mở" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Lesson Drawer — full-screen với UI khác nhau theo type */}
      <LessonDrawer
        open={lessonDrawer.open}
        mode={lessonDrawer.mode}
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
