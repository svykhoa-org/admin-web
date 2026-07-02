import { ThreadStatus, type ForumComment, type ForumThread } from '@/models/Forum'
import { RoutePath } from '@/router/RoutePath'
import {
  createComment,
  deleteThread,
  getThread,
  listThreadComments,
  setThreadLock,
  setThreadPin,
  setThreadStatus,
  toggleThreadReaction,
} from '@/services/Forum'
import { useAuthStore } from '@/store/authStore'
import { isApiResponseError } from '@/utils/apiResponse'
import {
  ArrowLeftOutlined,
  DeleteOutlined,
  DownOutlined,
  EyeOutlined,
  LikeFilled,
  LikeOutlined,
  LockOutlined,
  MessageOutlined,
  PushpinOutlined,
  SendOutlined,
  UnlockOutlined,
  UserOutlined,
} from '@ant-design/icons'
import {
  App,
  Avatar,
  Button,
  Dropdown,
  Empty,
  Input,
  Skeleton,
  Space,
  Tag,
  theme,
  Tooltip,
  Typography,
} from 'antd'
import type { TextAreaRef } from 'antd/es/input/TextArea'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

const { Text, Title } = Typography

const SOFT_SHADOW = '0 1px 2px rgba(15, 23, 42, 0.04), 0 12px 32px rgba(15, 23, 42, 0.05)'
const MAX_INDENT_DEPTH = 4

const STATUS_ORDER: ThreadStatus[] = [
  ThreadStatus.Published,
  ThreadStatus.Pending,
  ThreadStatus.Hidden,
]

const STATUS_LABEL: Record<ThreadStatus, string> = {
  [ThreadStatus.Published]: 'Xuất bản',
  [ThreadStatus.Pending]: 'Chờ duyệt',
  [ThreadStatus.Hidden]: 'Đã ẩn',
}

// ─── helpers ──────────────────────────────────────────────────────────────────

// Backend timestamps come from `timestamp` columns (no zone) → parse as UTC.
const toDate = (value: string | number) => {
  if (typeof value === 'number') return new Date(value)
  const hasTz = /[zZ]$|[+-]\d{2}:?\d{2}$/.test(value)
  return new Date(hasTz ? value : `${value.replace(' ', 'T')}Z`)
}

const formatDateTime = (value: string | number) =>
  toDate(value).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

const formatRelative = (value: string | number) => {
  const diff = Date.now() - toDate(value).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'Vừa xong'
  if (m < 60) return `${m} phút trước`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} giờ trước`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d} ngày trước`
  return formatDateTime(value)
}

// ─── person avatar ────────────────────────────────────────────────────────────

const PersonAvatar = ({
  name,
  src,
  size = 36,
}: {
  name?: string | null
  src?: string | null
  size?: number
}) => {
  const { token } = theme.useToken()
  if (src) return <Avatar src={src} size={size} />
  const letter = name?.trim().charAt(0).toUpperCase()
  return (
    <Avatar size={size} style={{ backgroundColor: token.colorPrimary }}>
      {letter || <UserOutlined />}
    </Avatar>
  )
}

// ─── status switcher (colored chip + dropdown) ──────────────────────────────────

const StatusSwitcher = ({
  status,
  onChange,
}: {
  status: ThreadStatus
  onChange: (next: ThreadStatus) => void
}) => {
  const { token } = theme.useToken()

  const palette: Record<ThreadStatus, { dot: string; bg: string; fg: string }> = {
    [ThreadStatus.Published]: {
      dot: token.colorSuccess,
      bg: token.colorSuccessBg,
      fg: token.colorSuccessText,
    },
    [ThreadStatus.Pending]: {
      dot: token.colorWarning,
      bg: token.colorWarningBg,
      fg: token.colorWarningText,
    },
    [ThreadStatus.Hidden]: {
      dot: token.colorTextQuaternary,
      bg: token.colorFillSecondary,
      fg: token.colorTextSecondary,
    },
  }

  const current = palette[status]

  const dot = (color: string) => (
    <span
      style={{
        display: 'inline-block',
        width: 7,
        height: 7,
        borderRadius: '50%',
        background: color,
        marginRight: 8,
      }}
    />
  )

  return (
    <Dropdown
      trigger={['click']}
      menu={{
        selectable: true,
        selectedKeys: [status],
        items: STATUS_ORDER.map(s => ({
          key: s,
          label: (
            <span style={{ display: 'inline-flex', alignItems: 'center' }}>
              {dot(palette[s].dot)}
              {STATUS_LABEL[s]}
            </span>
          ),
        })),
        onClick: ({ key }) => key !== status && onChange(key as ThreadStatus),
      }}
    >
      <button
        type="button"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          height: 28,
          padding: '0 10px',
          border: 'none',
          borderRadius: 8,
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 600,
          background: current.bg,
          color: current.fg,
        }}
      >
        {dot(current.dot)}
        {STATUS_LABEL[status]}
        <DownOutlined style={{ fontSize: 10, marginLeft: 6, opacity: 0.65 }} />
      </button>
    </Dropdown>
  )
}

// ─── moderation bar (quiet, top of page) ────────────────────────────────────────

const ModerationBar = ({
  thread,
  onModerate,
  onDelete,
}: {
  thread: ForumThread
  onModerate: (fn: () => Promise<void>, successMsg: string) => void
  onDelete: () => void
}) => {
  const { token } = theme.useToken()
  return (
    <Space size={6} wrap align="center">
      <StatusSwitcher
        status={thread.status}
        onChange={next =>
          onModerate(() => setThreadStatus(thread.id, next), 'Đã cập nhật trạng thái')
        }
      />
      <Tooltip title={thread.isPinned ? 'Bỏ ghim' : 'Ghim bài'}>
        <Button
          size="small"
          type={thread.isPinned ? 'primary' : 'text'}
          icon={<PushpinOutlined />}
          onClick={() =>
            onModerate(
              () => setThreadPin(thread.id, !thread.isPinned),
              thread.isPinned ? 'Đã bỏ ghim' : 'Đã ghim',
            )
          }
        />
      </Tooltip>
      <Tooltip title={thread.isLocked ? 'Mở khóa' : 'Khóa bài'}>
        <Button
          size="small"
          type={thread.isLocked ? 'primary' : 'text'}
          icon={thread.isLocked ? <LockOutlined /> : <UnlockOutlined />}
          onClick={() =>
            onModerate(
              () => setThreadLock(thread.id, !thread.isLocked),
              thread.isLocked ? 'Đã mở khóa' : 'Đã khóa',
            )
          }
        />
      </Tooltip>
      <span
        style={{ width: 1, height: 18, background: token.colorBorderSecondary, margin: '0 2px' }}
      />
      <Tooltip title="Xóa bài viết">
        <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={onDelete} />
      </Tooltip>
    </Space>
  )
}

// ─── article reaction (real, persisted) ─────────────────────────────────────────

const ReactionButton = ({ thread }: { thread: ForumThread }) => {
  const { message: toast } = App.useApp()
  const { token } = theme.useToken()
  const [reacted, setReacted] = useState(!!thread.hasReacted)
  const [count, setCount] = useState(thread.reactionCount ?? 0)
  const [busy, setBusy] = useState(false)

  // Re-seed when the thread reloads (e.g. after a moderation action).
  useEffect(() => {
    setReacted(!!thread.hasReacted)
    setCount(thread.reactionCount ?? 0)
  }, [thread.hasReacted, thread.reactionCount])

  const toggle = async () => {
    if (busy) return
    setBusy(true)
    try {
      const res = await toggleThreadReaction(thread.id)
      setReacted(res.reacted)
      setCount(res.count)
    } catch (err) {
      void toast.error(isApiResponseError(err) ? err.message : 'Không thể cập nhật phản ứng')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Button
      onClick={() => void toggle()}
      loading={busy}
      icon={reacted ? <LikeFilled style={{ color: token.colorPrimary }} /> : <LikeOutlined />}
      style={{
        borderRadius: 999,
        color: reacted ? token.colorPrimary : token.colorTextSecondary,
        borderColor: reacted ? token.colorPrimary : token.colorBorder,
      }}
    >
      Thích{count > 0 ? ` · ${count}` : ''}
    </Button>
  )
}

// ─── comment reply box ──────────────────────────────────────────────────────────

const ReplyBox = ({
  threadId,
  parentId,
  onDone,
  onCancel,
}: {
  threadId: string
  parentId: string
  onDone: () => void
  onCancel: () => void
}) => {
  const { message: toast } = App.useApp()
  const { token } = theme.useToken()
  const [value, setValue] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    const content = value.trim()
    if (!content || submitting) return
    setSubmitting(true)
    try {
      await createComment(threadId, content, parentId)
      onDone()
    } catch (err) {
      void toast.error(isApiResponseError(err) ? err.message : 'Không thể gửi trả lời')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ marginTop: 10 }}>
      <Input.TextArea
        autoFocus
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault()
            void submit()
          }
        }}
        autoSize={{ minRows: 2, maxRows: 8 }}
        placeholder="Viết trả lời…"
        style={{ borderRadius: 10, fontSize: 14 }}
      />
      <Space size={8} style={{ marginTop: 8 }}>
        <Button
          type="primary"
          size="small"
          icon={<SendOutlined />}
          loading={submitting}
          disabled={!value.trim()}
          onClick={() => void submit()}
        >
          Trả lời
        </Button>
        <Button
          size="small"
          type="text"
          onClick={onCancel}
          style={{ color: token.colorTextTertiary }}
        >
          Hủy
        </Button>
      </Space>
    </div>
  )
}

// ─── comment node (nested) ──────────────────────────────────────────────────────

const CommentNode = ({
  comment,
  threadId,
  depth,
  onReplied,
}: {
  comment: ForumComment
  threadId: string
  depth: number
  onReplied: () => void
}) => {
  const { token } = theme.useToken()
  const [replying, setReplying] = useState(false)
  const replies = comment.replies ?? []

  return (
    <div>
      <div className="comment-row" style={{ display: 'flex', gap: 12 }}>
        <PersonAvatar name={comment.author?.fullName} src={comment.author?.avatar} size={32} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <Space size={8} align="center" style={{ marginBottom: 4 }}>
            <Text strong style={{ fontSize: 13 }}>
              {comment.author?.fullName ?? 'Ẩn danh'}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {formatRelative(comment.createdAt)}
            </Text>
            {comment.isEdited && (
              <Text type="secondary" style={{ fontSize: 11 }}>
                (đã sửa)
              </Text>
            )}
          </Space>

          <div
            className="forum-content forum-content--compact"
            dangerouslySetInnerHTML={{ __html: comment.content }}
          />

          <Button
            type="text"
            size="small"
            icon={<MessageOutlined />}
            onClick={() => setReplying(v => !v)}
            style={{ color: token.colorTextTertiary, marginTop: 6, paddingInline: 4 }}
          >
            Trả lời
          </Button>

          {replying && (
            <ReplyBox
              threadId={threadId}
              parentId={comment.id}
              onDone={() => {
                setReplying(false)
                onReplied()
              }}
              onCancel={() => setReplying(false)}
            />
          )}
        </div>
      </div>

      {replies.length > 0 && (
        <div
          style={{
            marginLeft: depth < MAX_INDENT_DEPTH ? 28 : 0,
            paddingLeft: depth < MAX_INDENT_DEPTH ? 16 : 0,
            borderLeft:
              depth < MAX_INDENT_DEPTH ? `1px solid ${token.colorBorderSecondary}` : undefined,
          }}
        >
          {replies.map(reply => (
            <CommentNode
              key={reply.id}
              comment={reply}
              threadId={threadId}
              depth={depth + 1}
              onReplied={onReplied}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── root composer ──────────────────────────────────────────────────────────────

const Composer = ({
  threadId,
  disabled,
  onPosted,
}: {
  threadId: string
  disabled: boolean
  onPosted: () => void
}) => {
  const { message: toast } = App.useApp()
  const { token } = theme.useToken()
  const user = useAuthStore(s => s.user)
  const [value, setValue] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const textareaRef = useRef<TextAreaRef>(null)

  const submit = async () => {
    const content = value.trim()
    if (!content || submitting) return
    setSubmitting(true)
    try {
      await createComment(threadId, content)
      setValue('')
      onPosted()
      void toast.success('Đã gửi bình luận')
    } catch (error) {
      void toast.error(isApiResponseError(error) ? error.message : 'Không thể gửi bình luận')
    } finally {
      setSubmitting(false)
    }
  }

  if (disabled) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '12px 16px',
          borderRadius: token.borderRadiusLG,
          background: token.colorFillTertiary,
          color: token.colorTextSecondary,
          fontSize: 13,
        }}
      >
        <LockOutlined />
        Chủ đề đã bị khóa — không thể thêm bình luận.
      </div>
    )
  }

  return (
    <div
      style={{
        border: `1px solid ${token.colorBorderSecondary}`,
        borderRadius: 14,
        background: token.colorBgContainer,
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', gap: 12, padding: '14px 16px 0' }}>
        <PersonAvatar name={user?.fullName} src={user?.avatar} size={32} />
        <Input.TextArea
          ref={textareaRef}
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              e.preventDefault()
              void submit()
            }
          }}
          autoSize={{ minRows: 3, maxRows: 12 }}
          placeholder="Viết bình luận của bạn…"
          variant="borderless"
          style={{ padding: 0, resize: 'none', fontSize: 14 }}
          disabled={submitting}
        />
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          borderTop: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        <Text type="secondary" style={{ fontSize: 12 }}>
          Ctrl + Enter để gửi nhanh
        </Text>
        <Button
          type="primary"
          icon={<SendOutlined />}
          loading={submitting}
          disabled={!value.trim()}
          onClick={() => void submit()}
        >
          Gửi
        </Button>
      </div>
    </div>
  )
}

// ─── comments section ───────────────────────────────────────────────────────────

const countComments = (nodes: ForumComment[]): number =>
  nodes.reduce((sum, n) => sum + 1 + countComments(n.replies ?? []), 0)

const CommentsSection = ({ thread }: { thread: ForumThread }) => {
  const { token } = theme.useToken()
  const { message: toast } = App.useApp()
  const [comments, setComments] = useState<ForumComment[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      setComments(await listThreadComments(thread.id))
    } catch {
      void toast.error('Không thể tải bình luận')
    } finally {
      setLoading(false)
    }
  }, [thread.id, toast])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <section style={{ marginTop: 28 }}>
      <Title level={4} style={{ margin: '0 0 16px', fontSize: 16 }}>
        Bình luận{' '}
        <Text type="secondary" style={{ fontWeight: 400, fontVariantNumeric: 'tabular-nums' }}>
          {countComments(comments)}
        </Text>
      </Title>

      {/* Composer first — participate without leaving the reading flow */}
      <Composer threadId={thread.id} disabled={thread.isLocked} onPosted={load} />

      {loading ? (
        <div style={{ marginTop: 12 }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{ padding: '18px 0' }}>
              <Skeleton avatar active paragraph={{ rows: 2 }} title={{ width: '30%' }} />
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <Empty
          style={{ padding: '48px 0' }}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <span style={{ color: token.colorTextTertiary }}>
              Chưa có bình luận nào. Hãy là người đầu tiên chia sẻ ý kiến.
            </span>
          }
        />
      ) : (
        // newest -> oldest roots (ordered by backend); replies nested chronologically
        <div style={{ marginTop: 8 }}>
          {comments.map(c => (
            <CommentNode key={c.id} comment={c} threadId={thread.id} depth={0} onReplied={load} />
          ))}
        </div>
      )}
    </section>
  )
}

// ─── article (OP) ───────────────────────────────────────────────────────────────

const ThreadArticle = ({ thread }: { thread: ForumThread }) => {
  const { token } = theme.useToken()
  return (
    <article
      style={{
        padding: '34px 40px 40px',
        borderRadius: 18,
        background: token.colorBgContainer,
        boxShadow: SOFT_SHADOW,
      }}
    >
      {thread.prefixTag && (
        <Tag
          style={{
            color: '#fff',
            background: thread.prefixTag.colorHex,
            border: 'none',
            borderRadius: 6,
            marginBottom: 14,
          }}
        >
          {thread.prefixTag.name}
        </Tag>
      )}

      <Title
        level={1}
        className="thread-title"
        style={{ margin: '0 0 20px', fontSize: 30, fontWeight: 700, lineHeight: 1.25 }}
      >
        {thread.title}
      </Title>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <PersonAvatar name={thread.author?.fullName} src={thread.author?.avatar} size={40} />
        <div>
          <Text strong>{thread.author?.fullName ?? 'Ẩn danh'}</Text>
          <div style={{ color: token.colorTextTertiary, fontSize: 12, marginTop: 2 }}>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>
              {formatDateTime(thread.createdAt)}
            </span>
            <span style={{ margin: '0 6px' }}>·</span>
            <span style={{ fontVariantNumeric: 'tabular-nums' }}>
              <EyeOutlined /> {thread.viewCount.toLocaleString()} lượt xem
            </span>
          </div>
        </div>
      </div>

      <div style={{ height: 1, background: token.colorBorderSecondary, margin: '24px 0' }} />

      <div className="forum-content" dangerouslySetInnerHTML={{ __html: thread.content }} />

      <div style={{ marginTop: 28 }}>
        <ReactionButton thread={thread} />
      </div>
    </article>
  )
}

// ─── page shell ─────────────────────────────────────────────────────────────────

export const ThreadDetailView = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { message: toast, modal } = App.useApp()
  const { token } = theme.useToken()

  const [thread, setThread] = useState<ForumThread | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const loadThread = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(false)
    try {
      setThread(await getThread(id))
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    void loadThread()
  }, [loadThread])

  const handleModerate = useCallback(
    async (fn: () => Promise<void>, successMsg: string) => {
      try {
        await fn()
        void toast.success(successMsg)
        await loadThread()
      } catch (err) {
        void toast.error(isApiResponseError(err) ? err.message : 'Có lỗi xảy ra')
      }
    },
    [toast, loadThread],
  )

  const handleDelete = useCallback(() => {
    if (!thread) return
    modal.confirm({
      title: 'Xóa bài viết',
      content: 'Bài viết và toàn bộ bình luận sẽ bị xóa. Bạn có chắc chắn?',
      okText: 'Xóa',
      okButtonProps: { danger: true },
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await deleteThread(thread.id)
          void toast.success('Đã xóa bài viết')
          navigate(RoutePath.ForumThreadModerationPage.path)
        } catch (err) {
          void toast.error(isApiResponseError(err) ? err.message : 'Không thể xóa')
        }
      },
    })
  }, [thread, modal, toast, navigate])

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '4px 4px 48px' }}>
      {/* Top bar: back on the left, moderation on the right */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
          marginBottom: 18,
        }}
      >
        <Space size={8} style={{ color: token.colorTextTertiary, fontSize: 13, minWidth: 0 }}>
          <Typography.Link
            onClick={() => navigate(RoutePath.ForumThreadModerationPage.path)}
            style={{ color: token.colorTextSecondary }}
          >
            <ArrowLeftOutlined /> Kiểm duyệt bài viết
          </Typography.Link>
          {thread?.subCategory?.name && (
            <>
              <span>·</span>
              <span
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: 220,
                }}
              >
                {thread.subCategory.name}
              </span>
            </>
          )}
        </Space>

        {thread && (
          <ModerationBar thread={thread} onModerate={handleModerate} onDelete={handleDelete} />
        )}
      </div>

      {loading ? (
        <div
          style={{
            padding: '34px 40px',
            borderRadius: 18,
            background: token.colorBgContainer,
            boxShadow: SOFT_SHADOW,
          }}
        >
          <Skeleton active avatar paragraph={{ rows: 8 }} title={{ width: '60%' }} />
        </div>
      ) : error || !thread ? (
        <Empty
          style={{
            padding: '64px 0',
            borderRadius: 18,
            background: token.colorBgContainer,
            boxShadow: SOFT_SHADOW,
          }}
          description={
            <Space vertical>
              <Text type="secondary">Không tìm thấy bài viết.</Text>
              <Typography.Link onClick={() => navigate(RoutePath.ForumThreadModerationPage.path)}>
                Quay lại danh sách
              </Typography.Link>
            </Space>
          }
        />
      ) : (
        <>
          <ThreadArticle thread={thread} />
          <CommentsSection thread={thread} />
        </>
      )}
    </div>
  )
}
