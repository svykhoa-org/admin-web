import { DataTable } from '@/components/DataTable/DataTable'
import {
  AdminThreadSort,
  AdminThreadState,
  ThreadStatus,
  type ForumSubCategory,
  type ForumThread,
} from '@/models/Forum'
import { RoutePath } from '@/router/RoutePath'
import {
  listAdminThreads,
  listSubCategories,
  setThreadLock,
  setThreadPin,
  setThreadStatus,
} from '@/services/Forum'
import { isApiResponseError } from '@/utils/apiResponse'
import { formatTimestamp } from '@/utils/time'
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  EditOutlined,
  EllipsisOutlined,
  EyeOutlined,
  LikeOutlined,
  LockOutlined,
  MessageOutlined,
  UnlockOutlined,
} from '@ant-design/icons'
import {
  App,
  Avatar,
  Button,
  Card,
  Checkbox,
  Dropdown,
  Input,
  Select,
  Space,
  Switch,
  Tag,
  Tooltip,
  Typography,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CreateThreadModal } from './CreateThreadModal'

const STATE_OPTIONS = [
  { label: 'Đã đăng', value: AdminThreadState.Published },
  { label: 'Chờ đăng', value: AdminThreadState.Pending },
  { label: 'Đã khóa', value: AdminThreadState.Locked },
]

const SORT_OPTIONS = [
  { label: 'Mới cập nhật', value: AdminThreadSort.Newest },
  { label: 'Nhiều bình luận', value: AdminThreadSort.MostComments },
  { label: 'Nhiều lượt thích', value: AdminThreadSort.MostLikes },
  { label: 'Nhiều lượt xem', value: AdminThreadSort.MostViews },
]

const plainText = (content: string) =>
  content
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()

const ThreadStateTag = ({ thread }: { thread: ForumThread }) => {
  if (thread.isLocked) {
    return (
      <Tag icon={<LockOutlined />} color="error">
        Đã khóa
      </Tag>
    )
  }
  if (thread.status === ThreadStatus.Pending) {
    return (
      <Tag icon={<ClockCircleOutlined />} color="warning">
        Chờ đăng
      </Tag>
    )
  }
  return (
    <Tag icon={<CheckCircleOutlined />} color="success">
      Đã đăng
    </Tag>
  )
}

export const ThreadModerationTable = () => {
  const { message } = App.useApp()
  const navigate = useNavigate()
  const [items, setItems] = useState<ForumThread[]>([])
  const [subCats, setSubCats] = useState<ForumSubCategory[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [filterSubCat, setFilterSubCat] = useState<string>('')
  const [filterState, setFilterState] = useState<AdminThreadState | undefined>()
  const [sort, setSort] = useState(AdminThreadSort.Newest)
  const [pinnedFirst, setPinnedFirst] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [createModalOpen, setCreateModalOpen] = useState(false)
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
        state: filterState,
        sort,
        q: searchQuery || undefined,
        pinnedFirst,
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
  }, [filterState, filterSubCat, message, page, pinnedFirst, searchQuery, sort])

  useEffect(() => {
    void load()
  }, [load])

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
      title: 'Bài viết',
      key: 'thread',
      width: 330,
      render: (_, thread) => (
        <div className="max-w-[330px]">
          <Typography.Link
            strong
            onClick={() => navigate(RoutePath.ForumThreadDetailPage.getPath(thread.id))}
          >
            {thread.title}
          </Typography.Link>
          <Typography.Paragraph
            type="secondary"
            ellipsis={{ rows: 2 }}
            className="!mb-0 !mt-1 text-xs"
          >
            {plainText(thread.content)}
          </Typography.Paragraph>
        </div>
      ),
    },
    {
      title: 'Người đăng',
      key: 'author',
      width: 150,
      render: (_, thread) => (
        <Space size={8}>
          <Avatar src={thread.author?.avatar} size={30}>
            {thread.author?.fullName?.trim().charAt(0).toUpperCase()}
          </Avatar>
          <Typography.Text>{thread.author?.fullName ?? 'Ẩn danh'}</Typography.Text>
        </Space>
      ),
    },
    {
      title: 'Trạng thái',
      key: 'state',
      width: 105,
      render: (_, thread) => <ThreadStateTag thread={thread} />,
    },
    {
      title: 'Cập nhật',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 132,
      render: value => <span className="tabular-nums">{formatTimestamp(value)}</span>,
    },
    {
      title: 'Tương tác',
      key: 'engagement',
      width: 140,
      render: (_, thread) => (
        <Space size={14} className="tabular-nums text-xs">
          <Tooltip title="Lượt thích">
            <span>
              <LikeOutlined /> {thread.reactionCount ?? 0}
            </span>
          </Tooltip>
          <Tooltip title="Bình luận">
            <span>
              <MessageOutlined /> {thread.commentCount ?? 0}
            </span>
          </Tooltip>
          <Tooltip title="Lượt xem">
            <span>
              <EyeOutlined /> {thread.viewCount}
            </span>
          </Tooltip>
        </Space>
      ),
    },
    {
      title: 'Ghim',
      key: 'isPinned',
      width: 60,
      align: 'center',
      render: (_, thread) => (
        <Tooltip title={thread.isPinned ? 'Bỏ ghim' : 'Ghim bài'}>
          <Switch
            size="small"
            checked={thread.isPinned}
            onChange={checked =>
              handleAction(
                () => setThreadPin(thread.id, checked),
                checked ? 'Đã ghim bài viết' : 'Đã bỏ ghim',
              )
            }
          />
        </Tooltip>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 48,
      fixed: 'right',
      render: (_, thread) => (
        <Dropdown
          trigger={['click']}
          menu={{
            items: [
              { key: 'detail', label: 'Xem chi tiết', icon: <EyeOutlined /> },
              {
                key: 'status',
                label:
                  thread.status === ThreadStatus.Published
                    ? 'Chuyển về chờ đăng'
                    : 'Đăng công khai',
                icon:
                  thread.status === ThreadStatus.Published ? (
                    <ClockCircleOutlined />
                  ) : (
                    <CheckCircleOutlined />
                  ),
              },
              {
                key: 'lock',
                label: thread.isLocked ? 'Mở khóa bài viết' : 'Khóa bài viết',
                icon: thread.isLocked ? <UnlockOutlined /> : <LockOutlined />,
              },
            ],
            onClick: ({ key }) => {
              if (key === 'detail') {
                navigate(RoutePath.ForumThreadDetailPage.getPath(thread.id))
              }
              if (key === 'status') {
                const nextStatus =
                  thread.status === ThreadStatus.Published
                    ? ThreadStatus.Pending
                    : ThreadStatus.Published
                void handleAction(
                  () => setThreadStatus(thread.id, nextStatus),
                  nextStatus === ThreadStatus.Published
                    ? 'Đã đăng công khai'
                    : 'Đã chuyển về chờ đăng',
                )
              }
              if (key === 'lock') {
                void handleAction(
                  () => setThreadLock(thread.id, !thread.isLocked),
                  thread.isLocked ? 'Đã mở khóa bài viết' : 'Đã khóa bài viết',
                )
              }
            },
          }}
        >
          <Button size="small" icon={<EllipsisOutlined />} />
        </Dropdown>
      ),
    },
  ]

  const applySearch = (value: string) => {
    setSearchQuery(value.trim())
    setPage(1)
  }

  return (
    <>
      <Card>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <Space wrap size={8}>
            <Input.Search
              allowClear
              placeholder="Tìm theo tiêu đề hoặc nội dung"
              value={searchValue}
              onChange={event => {
                const value = event.target.value
                setSearchValue(value)
                if (!value) applySearch('')
              }}
              onSearch={applySearch}
              style={{ width: 220 }}
            />
            <Select
              placeholder="Tất cả danh mục"
              allowClear
              style={{ width: 160 }}
              value={filterSubCat || undefined}
              options={subCats.map(subCategory => ({
                label: subCategory.name,
                value: subCategory.id,
              }))}
              onChange={value => {
                setFilterSubCat(value ?? '')
                setPage(1)
              }}
            />
            <Select
              placeholder="Tất cả trạng thái"
              allowClear
              style={{ width: 130 }}
              value={filterState}
              options={STATE_OPTIONS}
              onChange={value => {
                setFilterState(value)
                setPage(1)
              }}
            />
            <Select
              value={sort}
              style={{ width: 150 }}
              options={SORT_OPTIONS}
              onChange={value => {
                setSort(value)
                setPage(1)
              }}
            />
            <Checkbox
              checked={pinnedFirst}
              onChange={event => {
                setPinnedFirst(event.target.checked)
                setPage(1)
              }}
            >
              Ưu tiên bài ghim
            </Checkbox>
          </Space>
          <Button type="primary" icon={<EditOutlined />} onClick={() => setCreateModalOpen(true)}>
            Viết bài
          </Button>
        </div>

        <DataTable<ForumThread>
          title="Bài viết diễn đàn"
          columns={columns}
          dataSource={items}
          loading={isLoading}
          paginationAction={{
            showPagination: true,
            currentPage: page,
            pageSize: PAGE_SIZE,
            totalRecords: total,
            onPageChange: nextPage => setPage(nextPage),
          }}
        />
      </Card>

      <CreateThreadModal
        open={createModalOpen}
        subCategories={subCats}
        onClose={() => setCreateModalOpen(false)}
        onCreated={() => {
          setCreateModalOpen(false)
          setPage(1)
          void load()
        }}
      />
    </>
  )
}
