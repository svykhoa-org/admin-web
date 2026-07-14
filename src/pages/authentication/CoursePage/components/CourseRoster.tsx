import {
  getCourseRoster,
  type CourseRoster as CourseRosterData,
  type RosterLearner,
} from '@/services/Course'
import { isApiResponseError } from '@/utils/apiResponse'
import { formatTimestamp } from '@/utils/time'
import { DownloadOutlined } from '@ant-design/icons'
import { App, Button, Card, Descriptions, Empty, Space, Spin, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useCallback, useEffect, useMemo, useState } from 'react'

interface Props {
  courseId: string
}

const ENROLLMENT_STATUS: Record<string, { label: string; color: string }> = {
  active: { label: 'Đang học', color: 'blue' },
  completed: { label: 'Hoàn thành', color: 'green' },
  expired: { label: 'Hết hạn', color: 'default' },
  refunded: { label: 'Đã hoàn tiền', color: 'red' },
}

const VERIFICATION_STATUS: Record<string, { label: string; color: string }> = {
  verified: { label: 'Đã xác minh', color: 'green' },
  pending: { label: 'Chờ duyệt', color: 'orange' },
  rejected: { label: 'Từ chối', color: 'red' },
}

/** Escape a CSV cell (RFC 4180): wrap in quotes, double any inner quotes. */
function csvCell(value: string | number | null | undefined): string {
  const s = value == null ? '' : String(value)
  return `"${s.replace(/"/g, '""')}"`
}

function downloadRosterCsv(roster: CourseRosterData) {
  const verified = roster.course.requiresVerification
  const header = [
    'STT',
    'Họ tên',
    'Email',
    ...(verified ? ['Họ tên trên CCHN', 'Số CCHN', 'Trạng thái xác minh'] : []),
    'Trạng thái',
    'Tiến độ (%)',
    'Ngày đăng ký',
    'Hoàn thành',
    'Mã chứng chỉ',
  ]
  const rows = roster.learners.map((l, i) => [
    i + 1,
    l.fullName ?? '',
    l.email ?? '',
    ...(verified
      ? [l.licenseFullName ?? '', l.licenseNumber ?? '', l.verificationStatus ?? '']
      : []),
    ENROLLMENT_STATUS[l.status]?.label ?? l.status,
    l.progress,
    l.enrolledAt ? formatTimestamp(l.enrolledAt) : '',
    l.completedAt ? formatTimestamp(l.completedAt) : '',
    l.certificateCode ?? '',
  ])
  const csv = [header, ...rows].map(r => r.map(csvCell).join(',')).join('\r\n')
  // UTF-8 BOM so Excel opens Vietnamese text correctly.
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `roster-${roster.course.title}.csv`.replace(/[/\\?%*:|"<>]/g, '-')
  a.click()
  URL.revokeObjectURL(url)
}

export function CourseRoster({ courseId }: Props) {
  const { message } = App.useApp()
  const [roster, setRoster] = useState<CourseRosterData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchRoster = useCallback(async () => {
    setIsLoading(true)
    try {
      setRoster(await getCourseRoster(courseId))
    } catch (error) {
      void message.error(
        isApiResponseError(error) ? error.message : 'Không thể tải danh sách học viên',
      )
    } finally {
      setIsLoading(false)
    }
  }, [courseId, message])

  useEffect(() => {
    void fetchRoster()
  }, [fetchRoster])

  const verified = roster?.course.requiresVerification ?? false

  const columns = useMemo<ColumnsType<RosterLearner>>(() => {
    const cols: ColumnsType<RosterLearner> = [
      { title: 'STT', width: 60, render: (_v, _r, i) => i + 1 },
      { title: 'Họ tên', dataIndex: 'fullName', render: (v: string | null) => v ?? '—' },
      { title: 'Email', dataIndex: 'email', render: (v: string | null) => v ?? '—' },
    ]
    if (verified) {
      cols.push(
        {
          title: 'Họ tên trên CCHN',
          dataIndex: 'licenseFullName',
          render: (v: string | null) => v ?? '—',
        },
        { title: 'Số CCHN', dataIndex: 'licenseNumber', render: (v: string | null) => v ?? '—' },
        {
          title: 'Xác minh',
          dataIndex: 'verificationStatus',
          render: (v: string | null) => {
            if (!v) return '—'
            const m = VERIFICATION_STATUS[v]
            return <Tag color={m?.color ?? 'default'}>{m?.label ?? v}</Tag>
          },
        },
      )
    }
    cols.push(
      {
        title: 'Trạng thái',
        dataIndex: 'status',
        render: (v: string) => {
          const m = ENROLLMENT_STATUS[v]
          return <Tag color={m?.color ?? 'default'}>{m?.label ?? v}</Tag>
        },
      },
      { title: 'Tiến độ', dataIndex: 'progress', width: 90, render: (v: number) => `${v}%` },
      {
        title: 'Ngày đăng ký',
        dataIndex: 'enrolledAt',
        render: (v: string) => (v ? formatTimestamp(v) : '—'),
      },
      {
        title: 'Chứng chỉ',
        dataIndex: 'certificateCode',
        render: (v: string | null) => v ?? '—',
      },
    )
    return cols
  }, [verified])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Spin size="large" />
      </div>
    )
  }

  if (!roster) {
    return <Empty description="Không có dữ liệu học viên" />
  }

  const { course, instructors, learners } = roster

  return (
    <Space vertical size={16} style={{ width: '100%' }}>
      <Card size="small">
        <Descriptions column={{ xs: 1, sm: 2, md: 3 }} size="small">
          <Descriptions.Item label="Loại khoá">
            {course.isScheduled ? <Tag color="purple">Theo đợt</Tag> : <Tag>Thường</Tag>}
            {course.requiresVerification && <Tag color="gold">Verified-only</Tag>}
          </Descriptions.Item>
          <Descriptions.Item label="Học viên">
            {course.currentEnrollments}
            {course.maxEnrollments != null ? ` / ${course.maxEnrollments}` : ''}
          </Descriptions.Item>
          <Descriptions.Item label="Giảng viên">
            {instructors.length > 0 ? (
              <Space size={4} wrap>
                {instructors.map(i => (
                  <Tag key={i.id}>{i.fullName}</Tag>
                ))}
              </Space>
            ) : (
              '—'
            )}
          </Descriptions.Item>
          {course.isScheduled && (
            <>
              <Descriptions.Item label="Khai giảng">
                {course.startDate ? formatTimestamp(course.startDate) : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="Kết thúc">
                {course.endDate ? formatTimestamp(course.endDate) : '—'}
              </Descriptions.Item>
            </>
          )}
        </Descriptions>
      </Card>

      <div className="flex justify-between items-center">
        <Typography.Text type="secondary">{learners.length} học viên</Typography.Text>
        <Button
          icon={<DownloadOutlined />}
          onClick={() => downloadRosterCsv(roster)}
          disabled={learners.length === 0}
        >
          Xuất CSV
        </Button>
      </div>

      <Table<RosterLearner>
        rowKey="userId"
        columns={columns}
        dataSource={learners}
        size="small"
        pagination={{ pageSize: 20, hideOnSinglePage: true }}
        scroll={{ x: true }}
      />
    </Space>
  )
}
