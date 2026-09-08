import { BulletinImportance } from '@/models/Bulletin'
import { sanitizeHtml } from '@/utils/sanitizeHtml'
import { DownloadOutlined, PaperClipOutlined } from '@ant-design/icons'
import { Tag } from 'antd'
import dayjs from 'dayjs'

export interface BulletinReaderAttachment {
  originalName: string | null
  size: number | null
  url: string | null
}

export interface BulletinReaderData {
  title: string
  summary?: string | null
  content: string
  categoryName?: string | null
  categoryColor?: string | null
  importance: BulletinImportance
  publishedAt?: string | null
  attachments?: BulletinReaderAttachment[]
}

const fmtSize = (bytes?: number | null): string => {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

/**
 * Preview of a bulletin — the reader's-eye view before publishing. Deliberately
 * styled as an OFFICIAL NOTICE (không giống trang đọc article): sans font, header
 * có dải màu theo importance, nhãn "THÔNG BÁO", ngày phát hành nổi bật, viền trái
 * accent, và khối tệp đính kèm. Colors via --color-* tokens / neutral rgba.
 */
export const BulletinReader = ({ data }: { data: BulletinReaderData }) => {
  const urgent = data.importance === BulletinImportance.URGENT
  const accent = urgent ? 'var(--color-danger)' : 'var(--color-primary)'
  const dateLabel = dayjs(data.publishedAt ?? undefined).format('DD/MM/YYYY')
  const attachments = data.attachments ?? []

  return (
    <div
      className="mx-auto max-w-[720px] overflow-hidden rounded-lg bg-white"
      style={{
        fontFamily: "'Be Vietnam Pro', sans-serif",
        borderLeft: `4px solid ${accent}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}
    >
      {/* Header band */}
      <div className="px-6 pt-5 pb-4" style={{ borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
        <div className="mb-2 flex items-center gap-2">
          <span
            className="rounded-md px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-white"
            style={{ background: accent }}
          >
            {urgent ? 'Khẩn' : 'Thông báo'}
          </span>
          {data.categoryName && <Tag color={data.categoryColor || 'blue'}>{data.categoryName}</Tag>}
          <span className="ml-auto text-sm" style={{ color: 'rgba(0,0,0,0.5)' }}>
            Ngày phát hành: <strong style={{ color: 'rgba(0,0,0,0.75)' }}>{dateLabel}</strong>
          </span>
        </div>
        <h1 className="text-2xl font-bold leading-snug" style={{ color: 'rgba(0,0,0,0.88)' }}>
          {data.title || 'Tiêu đề thông báo'}
        </h1>
        {data.summary && (
          <p className="mt-2 text-sm" style={{ color: 'rgba(0,0,0,0.55)' }}>
            {data.summary}
          </p>
        )}
      </div>

      {/* Body */}
      <div
        className="bulletin-content px-6 py-5"
        style={{ color: 'rgba(0,0,0,0.82)', fontSize: 15, lineHeight: 1.75 }}
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(data.content) }}
      />

      {/* Attachments */}
      {attachments.length > 0 && (
        <div className="px-6 pb-6">
          <div
            className="mb-2 flex items-center gap-1.5 text-sm font-semibold"
            style={{ color: 'rgba(0,0,0,0.7)' }}
          >
            <PaperClipOutlined /> Tệp đính kèm ({attachments.length})
          </div>
          <div className="flex flex-col gap-2">
            {attachments.map((f, i) => (
              <a
                key={i}
                href={f.url || undefined}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors"
                style={{ border: '1px solid rgba(0,0,0,0.1)', color: 'var(--color-primary)' }}
              >
                <span className="truncate">{f.originalName || 'Tệp đính kèm'}</span>
                <span
                  className="ml-3 flex items-center gap-2 whitespace-nowrap"
                  style={{ color: 'rgba(0,0,0,0.45)' }}
                >
                  {fmtSize(f.size)}
                  <DownloadOutlined style={{ color: 'var(--color-primary)' }} />
                </span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
