import { ConfirmDeleteModal } from '@/components/ModalVariants/ConfirmDeleteModal'
import { useDelete } from '@/hooks'
import { deleteVideo, listVideos, type VideoDto } from '@/services/Video'
import { listUser } from '@/services/User'
import type { User } from '@/models/User'
import { isApiResponseError } from '@/utils/apiResponse'
import type { AxiosError } from 'axios'
import { DeleteOutlined, EditOutlined, EllipsisOutlined, PlusOutlined } from '@ant-design/icons'
import { App, Button, Card, Dropdown, Input, Select, Space, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useCallback, useEffect, useState } from 'react'
import { VideoModal } from './VideoModal'

export const VideoTable = () => {
  const { message } = App.useApp()

  const [videos, setVideos] = useState<VideoDto[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [authorId, setAuthorId] = useState<string | undefined>(undefined)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingVideo, setEditingVideo] = useState<VideoDto | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await listVideos({ search: search || undefined, authorId })
      setVideos(data)
    } catch {
      void message.error('Không thể tải danh sách video')
    } finally {
      setIsLoading(false)
    }
  }, [message, search, authorId])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    listUser({ pageSize: 200 })
      .then(data => setUsers(data.items))
      .catch(() => void message.error('Không thể tải danh sách người dùng'))
  }, [message])

  const {
    selectedRowKeys,
    setSelectedRowKeys,
    deleteModal,
    openDeleteModal,
    closeDeleteModal,
    confirmDelete,
    isDeleting,
  } = useDelete<string>(id => deleteVideo({ id }))

  const handleConfirmDelete = async () => {
    try {
      await confirmDelete()
      void message.success('Xoá video thành công')
      void load()
    } catch (error) {
      const axiosErr = error as AxiosError<{ message?: string }>
      if (axiosErr.response?.status === 409) {
        void message.error('Video đang được dùng trong bài học, không thể xoá')
      } else {
        void message.error(
          isApiResponseError(error) ? error.message : 'Không thể xoá. Vui lòng thử lại.',
        )
      }
    }
  }

  const openCreate = () => {
    setEditingVideo(null)
    setModalOpen(true)
  }

  const openEdit = (video: VideoDto) => {
    setEditingVideo(video)
    setModalOpen(true)
  }

  const userMap = Object.fromEntries(users.map(u => [u.id, u.fullName || u.email]))
  const userOptions = users.map(u => ({ label: u.fullName || u.email, value: u.id }))

  const columns: ColumnsType<VideoDto> = [
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      key: 'title',
      fixed: 'left',
      render: (value: string, record) => (
        <Typography.Link strong onClick={() => openEdit(record)}>
          {value}
        </Typography.Link>
      ),
    },
    {
      title: 'Tác giả',
      dataIndex: 'authorId',
      key: 'authorId',
      render: (value: string | null) =>
        value ? (
          <Typography.Text>{userMap[value] ?? value}</Typography.Text>
        ) : (
          <Typography.Text type="secondary">-</Typography.Text>
        ),
    },
    {
      title: 'Thời lượng (phút)',
      dataIndex: 'durationMinutes',
      key: 'durationMinutes',
      width: 160,
      render: (value: number) =>
        value ? (
          <Tag color="blue">{value} phút</Tag>
        ) : (
          <Typography.Text type="secondary">-</Typography.Text>
        ),
    },
    {
      title: 'Tags',
      dataIndex: 'tags',
      key: 'tags',
      render: (tags: VideoDto['tags']) =>
        tags && tags.length > 0 ? (
          <Space size={4} wrap>
            {tags.map(tag => (
              <Tag key={tag.id} color={tag.color ?? undefined}>
                {tag.name}
              </Tag>
            ))}
          </Space>
        ) : (
          <Typography.Text type="secondary">-</Typography.Text>
        ),
    },
    {
      title: '',
      key: 'actions',
      width: 48,
      fixed: 'right',
      render: (_, record) => (
        <Dropdown
          trigger={['click']}
          menu={{
            items: [
              { key: 'edit', label: 'Sửa', icon: <EditOutlined /> },
              { key: 'delete', label: 'Xoá', icon: <DeleteOutlined />, danger: true },
            ],
            onClick: ({ key }) => {
              if (key === 'edit') openEdit(record)
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
        <Space vertical size={16} className="w-full">
          <Space className="w-full justify-between items-center">
            <Typography.Title level={3} style={{ marginBottom: 0 }}>
              Kho Video
            </Typography.Title>
            <Space>
              <Input.Search
                allowClear
                placeholder="Tìm theo tiêu đề"
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                onSearch={value => setSearch(value.trim())}
                style={{ width: 240 }}
              />
              <Select
                allowClear
                showSearch
                placeholder="Lọc theo tác giả"
                options={userOptions}
                value={authorId}
                onChange={value => setAuthorId(value || undefined)}
                filterOption={(input, opt) =>
                  (opt?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                style={{ width: 200 }}
              />
              <Button
                danger
                icon={<DeleteOutlined />}
                disabled={selectedRowKeys.length === 0}
                onClick={() => openDeleteModal(selectedRowKeys)}
              />
              <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                Thêm video
              </Button>
            </Space>
          </Space>

          <Table<VideoDto>
            rowKey="id"
            columns={columns}
            dataSource={videos}
            loading={isLoading}
            scroll={{ x: 'max-content' }}
            rowSelection={{
              selectedRowKeys,
              onChange: keys => setSelectedRowKeys(keys as string[]),
            }}
            pagination={{ pageSize: 20, showSizeChanger: true, hideOnSinglePage: true }}
          />
        </Space>
      </Card>

      <ConfirmDeleteModal
        open={deleteModal.open}
        count={deleteModal.ids.length}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={closeDeleteModal}
      />

      <VideoModal
        open={modalOpen}
        video={editingVideo}
        onClose={() => setModalOpen(false)}
        onSuccess={() => void load()}
      />
    </>
  )
}
