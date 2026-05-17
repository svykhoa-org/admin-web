import { DataTable } from '@/components/DataTable/DataTable'
import { ConfirmDeleteModal } from '@/components/ModalVariants/ConfirmDeleteModal'
import { useDelete } from '@/hooks'
import type { CourseCategory } from '@/models/CourseCategory'
import { listCourseCategory, removeCourseCategory } from '@/services/CourseCategory'
import { isApiResponseError } from '@/utils/apiResponse'
import { DeleteOutlined, EditOutlined, EllipsisOutlined } from '@ant-design/icons'
import { App, Button, Card, Dropdown, Space, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export const CourseCategoryTable = () => {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [categories, setCategories] = useState<CourseCategory[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const items = await listCourseCategory()
      setCategories(items)
    } catch {
      void message.error('Không thể tải danh sách danh mục')
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
  } = useDelete<string>(id => removeCourseCategory({ id }))

  const handleConfirmDelete = async () => {
    try {
      await confirmDelete()
      void message.success('Xóa danh mục thành công')
      void load()
    } catch (error) {
      void message.error(
        isApiResponseError(error) ? error.message : 'Không thể xóa. Vui lòng thử lại.',
      )
    }
  }

  const columns: ColumnsType<CourseCategory> = [
    {
      title: 'Tên danh mục',
      key: 'name',
      render: (_, record) => (
        <Space>
          {record.icon && <span>{record.icon}</span>}
          <Typography.Link onClick={() => navigate(`/course-categories/${record.id}`)}>
            {record.name}
          </Typography.Link>
          {!record.parentId && <Tag color="blue">Gốc</Tag>}
        </Space>
      ),
    },
    {
      title: 'Đường dẫn',
      dataIndex: 'path',
      key: 'path',
      render: (value: string) => (
        <Typography.Text code style={{ fontSize: 11 }}>
          {value}
        </Typography.Text>
      ),
    },
    {
      title: 'Slug',
      dataIndex: 'slug',
      key: 'slug',
    },
    {
      title: 'Khoá học',
      key: 'counts',
      width: 160,
      render: (_, record) => (
        <Space>
          <Tag>{record.publishedCourseCount} đã xuất bản</Tag>
          <Tag color="default">{record.totalCourseCount} tổng</Tag>
        </Space>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 48,
      render: (_, record) => (
        <Dropdown
          trigger={['click']}
          menu={{
            items: [
              { key: 'edit', label: 'Chi tiết', icon: <EditOutlined /> },
              { key: 'delete', label: 'Xóa', icon: <DeleteOutlined />, danger: true },
            ],
            onClick: ({ key }) => {
              if (key === 'edit') navigate(`/course-categories/${record.id}`)
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
        <DataTable<CourseCategory>
          title="Danh sách danh mục khoá học"
          columns={columns}
          dataSource={categories}
          loading={isLoading}
          rowSelection={{
            selectedRowKeys,
            onChange: keys => setSelectedRowKeys(keys as string[]),
          }}
          createAction={{ onCreate: () => navigate('/course-categories/create') }}
          deleteAction={{
            onDelete: () => openDeleteModal(selectedRowKeys),
            disabled: selectedRowKeys.length === 0,
          }}
        />
      </Card>
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
