import {
  selectActiveCount,
  useUploadStore,
  type UploadTask,
  type UploadTaskStatus,
} from '@/store/uploadStore'
import {
  CheckCircleFilled,
  CloseCircleFilled,
  CloseOutlined,
  DownOutlined,
  ExclamationCircleFilled,
  MinusOutlined,
  ReloadOutlined,
  StopOutlined,
  UpOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons'
import { App, Button, Progress, Tooltip, Typography } from 'antd'
import { useEffect, useRef, useState } from 'react'

const { Text } = Typography

// ─── Status icon ──────────────────────────────────────────────────────────────

function StatusIcon({ status }: { status: UploadTaskStatus }) {
  if (status === 'done')
    return <CheckCircleFilled style={{ color: 'var(--color-success, #52c41a)' }} />
  if (status === 'error')
    return <CloseCircleFilled style={{ color: 'var(--color-danger, #ff4d4f)' }} />
  if (status === 'cancelled') return <ExclamationCircleFilled style={{ color: '#faad14' }} />
  return <VideoCameraOutlined style={{ color: 'var(--color-primary)' }} />
}

// ─── Status label ─────────────────────────────────────────────────────────────

function statusLabel(task: UploadTask): string {
  if (task.status === 'done') return 'Hoàn tất'
  if (task.status === 'error') return task.errorMsg || 'Lỗi'
  if (task.status === 'cancelled') return 'Đã hủy'
  if (task.status === 'confirming') return 'Đang xác nhận...'
  if (task.isMultipart)
    return `${task.completedParts}/${task.totalParts} parts · ${task.speedText} · còn ${task.etaText}`
  return `${task.speedText} · còn ${task.etaText}`
}

// ─── Task row ─────────────────────────────────────────────────────────────────

function TaskRow({ task }: { task: UploadTask }) {
  const cancel = useUploadStore(s => s.cancel)
  const retry = useUploadStore(s => s.retry)
  const dismiss = useUploadStore(s => s.dismiss)

  const isActive = task.status === 'uploading' || task.status === 'confirming'
  const isTerminal =
    task.status === 'done' || task.status === 'cancelled' || task.status === 'error'

  return (
    <div className="flex flex-col gap-1 border-b border-gray-100 px-3 py-2 last:border-0">
      <div className="flex items-center gap-2">
        <StatusIcon status={task.status} />

        {/* Label + filename */}
        <div className="min-w-0 flex-1">
          <Tooltip title={task.label !== task.filename ? task.filename : undefined}>
            <Text
              ellipsis
              strong={isActive}
              style={{ fontSize: 12, display: 'block', lineHeight: '1.4' }}
            >
              {task.label}
            </Text>
          </Tooltip>
          <Text type="secondary" ellipsis style={{ fontSize: 11, display: 'block' }}>
            {statusLabel(task)}
          </Text>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1">
          {isActive && (
            <Tooltip title="Hủy upload">
              <Button
                type="text"
                size="small"
                icon={<StopOutlined />}
                danger
                onClick={() => void cancel(task.id)}
                style={{ padding: '0 4px' }}
              />
            </Tooltip>
          )}
          {task.status === 'error' && task.failedPartsCount > 0 && (
            <Tooltip title="Thử lại">
              <Button
                type="text"
                size="small"
                icon={<ReloadOutlined />}
                onClick={() => void retry(task.id)}
                style={{ padding: '0 4px' }}
              />
            </Tooltip>
          )}
          {isTerminal && (
            <Tooltip title="Đóng">
              <Button
                type="text"
                size="small"
                icon={<CloseOutlined />}
                onClick={() => dismiss(task.id)}
                style={{ padding: '0 4px' }}
              />
            </Tooltip>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {isActive && (
        <Progress
          percent={Math.round(task.progress)}
          size="small"
          showInfo={false}
          strokeColor="var(--color-primary)"
          style={{ margin: 0 }}
        />
      )}
      {task.status === 'done' && (
        <Progress
          percent={100}
          size="small"
          showInfo={false}
          strokeColor="var(--color-success, #52c41a)"
          style={{ margin: 0 }}
        />
      )}
    </div>
  )
}

// ─── Tray ─────────────────────────────────────────────────────────────────────

export function UploadTray() {
  const { notification } = App.useApp()
  const tasks = useUploadStore(s => s.tasks)
  const dismiss = useUploadStore(s => s.dismiss)
  const activeCount = selectActiveCount(tasks)
  const taskList = Object.values(tasks)

  const [collapsed, setCollapsed] = useState(false)

  // Track previous statuses to fire notifications on transitions
  const prevStatusRef = useRef<Record<string, UploadTaskStatus>>({})

  useEffect(() => {
    const prev = prevStatusRef.current

    for (const task of taskList) {
      const wasActive = prev[task.id] === 'uploading' || prev[task.id] === 'confirming'

      if (wasActive && task.status === 'done') {
        notification.success({
          message: 'Upload hoàn tất',
          description: task.label,
          placement: 'bottomRight',
          // offset to sit above the tray
          style: { marginBottom: 220 },
        })
      }

      if (wasActive && task.status === 'error') {
        notification.error({
          message: 'Upload thất bại',
          description: `${task.label}: ${task.errorMsg}`,
          placement: 'bottomRight',
          style: { marginBottom: 220 },
        })
      }
    }

    prevStatusRef.current = Object.fromEntries(taskList.map(t => [t.id, t.status]))
  }, [tasks, taskList, notification])

  // Auto-dismiss done/cancelled tasks after 8 s (only when tray is collapsed)
  useEffect(() => {
    if (!collapsed) return
    const terminalIds = taskList
      .filter(t => t.status === 'done' || t.status === 'cancelled')
      .map(t => t.id)
    if (!terminalIds.length) return

    const timer = setTimeout(() => {
      terminalIds.forEach(id => dismiss(id))
    }, 8000)
    return () => clearTimeout(timer)
  }, [collapsed, tasks, taskList, dismiss])

  // beforeunload warning when uploads are active
  useEffect(() => {
    if (activeCount === 0) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [activeCount])

  if (taskList.length === 0) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        width: 320,
        zIndex: 1050,
        borderRadius: 8,
        overflow: 'hidden',
        boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
        border: '1px solid var(--color-border, #e5e7eb)',
        backgroundColor: 'var(--color-bg-container, #fff)',
      }}
    >
      {/* ── Header ── */}
      <div
        className="flex cursor-pointer items-center justify-between px-3 py-2"
        style={{
          backgroundColor: 'var(--color-bg-elevated, #fafafa)',
          borderBottom: collapsed ? 'none' : '1px solid var(--color-border, #e5e7eb)',
        }}
        onClick={() => setCollapsed(c => !c)}
      >
        <div className="flex items-center gap-2">
          <VideoCameraOutlined style={{ color: 'var(--color-primary)' }} />
          <Text strong style={{ fontSize: 13 }}>
            {activeCount > 0 ? `Đang upload (${activeCount})` : 'Upload video'}
          </Text>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="text"
            size="small"
            icon={collapsed ? <UpOutlined /> : <DownOutlined />}
            style={{ padding: '0 4px' }}
            onClick={e => {
              e.stopPropagation()
              setCollapsed(c => !c)
            }}
          />
          {activeCount === 0 && (
            <Button
              type="text"
              size="small"
              icon={<CloseOutlined />}
              style={{ padding: '0 4px' }}
              onClick={e => {
                e.stopPropagation()
                taskList.forEach(t => dismiss(t.id))
              }}
            />
          )}
        </div>
      </div>

      {/* ── Task list ── */}
      {!collapsed && (
        <div style={{ maxHeight: 320, overflowY: 'auto' }}>
          {taskList.map(task => (
            <TaskRow key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  )
}
