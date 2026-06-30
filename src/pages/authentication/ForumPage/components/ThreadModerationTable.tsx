import { ConfirmDeleteModal } from '@/components/ModalVariants/ConfirmDeleteModal'
import { DataTable } from '@/components/DataTable/DataTable'
import { useDelete } from '@/hooks'
import { ThreadStatus, type ForumSubCategory, type ForumThread } from '@/models/Forum'
import {
  deleteThread,
  listAdminThreads,
  listSubCategories,
  setThreadLock,
  setThreadPin,
  setThreadStatus,
} from '@/services/Forum'
import { isApiResponseError } from '@/utils/apiResponse'
import { DeleteOutlined, LockOutlined, PushpinOutlined, UnlockOutlined } from '@ant-design/icons'
import { App, Button, Card, Select, Space, Switch, Tooltip, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useCallback, useEffect, useState } from 'react'

const STATUS_OPTIONS = [
  { label: 'Tất cả', value: '' },
  { label: 'Đã xuất bản', value: ThreadStatus.Published },
  { label: 'Chờ duyệt', value: ThreadStatus.Pending },
  { label: 'Đã ẩn', value: ThreadStatus.Hidden },
]

export const ThreadModerationTable = () => {
  const { message } = App.useApp()
  const [items, setItems] = useState<ForumThread[]>([])
  const [subCats, setSubCats] = useState<ForumSubCategory[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [filterSubCat, setFilterSubCat] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const PAGE_SIZE = 20

  useEffect(() => {
    listSubCategories()
      .then(setSubCats)
      .catch(() => void message.error('Không thể tải danh mục'))
  }, [message])

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const result = await listAdminThreads({
        subCategoryId: filterSubCat || undefined,
        status: (filterStatus as ThreadStatus) || undefined,
        page,
        limit: PAGE_SIZE,
      })
      setItems(result.items)
      setTotal(result.total)
    } catch {
      void message.error('Không thể tải danh sách bài viết')
    } finally {
      setIsLoading(false)
    }
  }, [message, filterSubCat, filterStatus, page])

  useEffect(() => {
    void load()
  }, [load])

  const { deleteModal, openDeleteModal, closeDeleteModal, confirmDelete, isDeleting } =
    useDelete<string>(deleteThread)

  const handleAction = async (fn: () => Promise<void>, successMsg: string) => {
    try {
      await fn()
      void message.success(successMsg)
      void load()
    } catch (error) {
      void message.error(isApiResponseError(error) ? error.message : 'Có lỗi xảy ra')
    }
  }

  const columns: ColumnsType<ForumThread> = [
    {
      title: 'Tiêu đề',
      key: 'title',
      render: (_, r) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong style={{ fontSize: 13 }}>
            {r.title}
          </Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {r.author?.fullName ?? r.authorId} · {r.subCategory?.name ?? r.subCategoryId}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: 'Trạng thái',
      key: 'status',
      width: 160,
      render: (_, r) => (
        <Select
          size="small"
          value={r.status}
          style={{ width: 140 }}
          options={STATUS_OPTIONS.filter(o => o.value !== '').map(o => ({
            label: o.label,
            value: o.value,
          }))}
          onChange={val =>
            handleAction(() => setThreadStatus(r.id, val as ThreadStatus), 'Đã cập nhật trạng thái')
          }
        />
      ),
    },
    {
      title: 'Ghim',
      key: 'isPinned',
      width: 70,
      render: (_, r) => (
        <Tooltip title={r.isPinned ? 'Bỏ ghim' : 'Ghim bài'}>
          <Switch
            size="small"
            checked={r.isPinned}
            checkedChildren={<PushpinOutlined />}
            onChange={val =>
              handleAction(() => setThreadPin(r.id, val), val ? 'Đã ghim' : 'Đã bỏ ghim')
            }
          />
        </Tooltip>
      ),
    },
    {
      title: 'Khóa',
      key: 'isLocked',
      width: 70,
      render: (_, r) => (
        <Tooltip title={r.isLocked ? 'Mở khóa' : 'Khóa bài'}>
          <Switch
            size="small"
            checked={r.isLocked}
            checkedChildren={<LockOutlined />}
            unCheckedChildren={<UnlockOutlined />}
            onChange={val =>
              handleAction(() => setThreadLock(r.id, val), val ? 'Đã khóa' : 'Đã mở khóa')
            }
          />
        </Tooltip>
      ),
    },
    {
      title: 'Lượt xem',
      dataIndex: 'viewCount',
      key: 'viewCount',
      width: 90,
    },
    {
      title: '',
      key: 'actions',
      width: 48,
      render: (_, record) => (
        <Tooltip title="Xóa bài viết">
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={() => openDeleteModal([record.id])}
          />
        </Tooltip>
      ),
    },
  ]

  return (
    <>
      <Card>
        <Space className="mb-4">
          <Select
            placeholder="Lọc theo danh mục"
            allowClear
            style={{ width: 200 }}
            value={filterSubCat || undefined}
            options={subCats.map(s => ({ label: s.name, value: s.id }))}
            onChange={val => {
              setFilterSubCat(val ?? '')
              setPage(1)
            }}
          />
          <Select
            placeholder="Lọc theo trạng thái"
            allowClear
            style={{ width: 160 }}
            value={filterStatus || undefined}
            options={STATUS_OPTIONS.filter(o => o.value !== '')}
            onChange={val => {
              setFilterStatus(val ?? '')
              setPage(1)
            }}
          />
        </Space>
        <DataTable<ForumThread>
          title="Kiểm duyệt bài viết diễn đàn"
          columns={columns}
          dataSource={items}
          loading={isLoading}
          paginationAction={{
            showPagination: true,
            currentPage: page,
            pageSize: PAGE_SIZE,
            totalRecords: total,
            onPageChange: p => setPage(p),
          }}
        />
      </Card>

      <ConfirmDeleteModal
        open={deleteModal.open}
        count={deleteModal.ids.length}
        isLoading={isDeleting}
        onConfirm={async () => {
          try {
            await confirmDelete()
            void message.success('Đã xóa bài viết')
            void load()
          } catch {
            void message.error('Không thể xóa')
          }
        }}
        onCancel={closeDeleteModal}
      />
    </>
  )
}
