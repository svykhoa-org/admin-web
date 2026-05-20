import { DataTable } from '@/components/DataTable/DataTable'
import { ConfirmDeleteModal } from '@/components/ModalVariants/ConfirmDeleteModal'
import { useDelete } from '@/hooks'
import type { CourseTag } from '@/models/CourseTag'
import { listCourseTag, removeCourseTag } from '@/services/CourseTag'
import { isApiResponseError } from '@/utils/apiResponse'
import { DeleteOutlined, EditOutlined, EllipsisOutlined } from '@ant-design/icons'
import { App, Button, Card, Dropdown, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export const CourseTagTable = () => {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [tags, setTags] = useState<CourseTag[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      setTags(await listCourseTag())
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
  } = useDelete<string>(id => removeCourseTag({ id }))

  const handleConfirmDelete = async () => {
    try {
      await confirmDelete()
      void message.success('Xóa tag thành công')
      void load()
    } catch (error) {
      void message.error(isApiResponseError(error) ? error.message : 'Không thể xóa')
    }
  }

  const columns: ColumnsType<CourseTag> = [
    {
      title: 'Tên tag',
      key: 'name',
      render: (_, record) => (
        <Tag
          color={record.color ?? undefined}
          style={{ cursor: 'pointer' }}
          onClick={() => navigate(`/course-tags/${record.id}`)}
        >
          {record.name}
        </Tag>
      ),
    },
    {
      title: 'Slug',
      dataIndex: 'slug',
      key: 'slug',
      width: 200,
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: v => new Date(v).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }),
      width: 200,
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
              if (key === 'edit') navigate(`/course-tags/${record.id}`)
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
        <DataTable<CourseTag>
          title="Danh sách tag khoá học"
          columns={columns}
          dataSource={tags}
          loading={isLoading}
          selectionAction={{
            selectedRowKeys,
            onChange: keys => setSelectedRowKeys(keys as string[]),
          }}
          createAction={{ onCreate: () => navigate('/course-tags/create') }}
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
