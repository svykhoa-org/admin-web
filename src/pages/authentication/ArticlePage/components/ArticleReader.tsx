import { readingMinutes } from '@/utils/readingTime'
import { sanitizeHtml } from '@/utils/sanitizeHtml'
import { SafetyCertificateOutlined, UserOutlined } from '@ant-design/icons'
import { Avatar, Tag } from 'antd'
import dayjs from 'dayjs'

export interface ArticleReaderData {
  title: string
  summary?: string
  content: string
  thumbnailUrl?: string | null
  authorName: string
  authorTitle?: string | null
  authorAvatarUrl?: string | null
  categoryName?: string | null
  categoryColor?: string | null
  reviewedByName?: string | null
  reviewedAt?: string | null
  publishedAt?: string | null
}

/**
 * Read-mode preview of an article — the reader's-eye view an admin sees before
 * publishing. Layout mirrors the client reader (cover → title → meta → content →
 * medical-review badge). Uses a system serif to approximate the client's reading
 * typeface (the Readwise-style font picker is a client-only reader feature).
 * Neutral colors use rgba like the existing `.forum-content` convention (admin
 * has no neutral CSS tokens, only --color-primary/success/…).
 */
export const ArticleReader = ({ data }: { data: ArticleReaderData }) => {
  const minutes = readingMinutes(data.content)
  const dateLabel = dayjs(data.publishedAt ?? undefined).format('DD/MM/YYYY')
  const secondary = 'rgba(0, 0, 0, 0.45)'

  return (
    <div className="article-reader mx-auto max-w-[720px] px-2 pb-8">
      <style>{articleReaderCss}</style>

      {data.thumbnailUrl && (
        <img
          src={data.thumbnailUrl}
          alt={data.title}
          className="mb-6 max-h-[380px] w-full rounded-lg object-cover"
        />
      )}

      {data.categoryName && (
        <Tag color={data.categoryColor || 'blue'} className="mb-3">
          {data.categoryName}
        </Tag>
      )}

      <h1 className="article-title mb-4">{data.title || 'Tiêu đề bài viết'}</h1>

      {data.summary && <p className="article-summary mb-6">{data.summary}</p>}

      <div
        className="mb-8 flex flex-wrap items-center justify-between gap-3 pb-6"
        style={{ borderBottom: '1px solid rgba(0, 0, 0, 0.08)' }}
      >
        <div className="flex items-center gap-3">
          <Avatar size={44} src={data.authorAvatarUrl || undefined} icon={<UserOutlined />} />
          <div>
            <div style={{ fontWeight: 600, color: 'rgba(0, 0, 0, 0.88)' }}>{data.authorName}</div>
            <div className="text-sm" style={{ color: secondary }}>
              {[data.authorTitle, `${minutes} phút đọc`].filter(Boolean).join(' · ')}
            </div>
          </div>
        </div>
        <div className="text-sm" style={{ color: secondary }}>
          {dateLabel}
        </div>
      </div>

      <div
        className="article-content"
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(data.content) }}
      />

      {data.reviewedByName && (
        <div
          className="mt-8 flex items-center gap-2 rounded-lg px-4 py-3 text-sm"
          style={{ background: 'rgba(0, 0, 0, 0.04)' }}
        >
          <SafetyCertificateOutlined style={{ color: 'var(--color-success)' }} />
          <span>
            Đã kiểm duyệt y khoa bởi <strong>{data.reviewedByName}</strong>
            {data.reviewedAt && ` · ${dayjs(data.reviewedAt).format('DD/MM/YYYY')}`}
          </span>
        </div>
      )}
    </div>
  )
}

// Scoped reading typography — self-contained (no tailwind typography plugin).
// System serif approximates the client reading font; neutrals as rgba to match
// the admin `.forum-content` convention.
const articleReaderCss = `
.article-reader { font-family: Georgia, 'Times New Roman', serif; color: rgba(0, 0, 0, 0.85); }
.article-reader .article-title { font-size: 2.25rem; line-height: 1.2; font-weight: 700; letter-spacing: -0.02em; color: rgba(0, 0, 0, 0.9); }
.article-reader .article-summary { font-size: 1.2rem; line-height: 1.6; color: rgba(0, 0, 0, 0.55); }
.article-reader .article-content { font-size: 1.125rem; line-height: 1.8; }
.article-reader .article-content h2 { font-size: 1.6rem; font-weight: 700; margin: 1.8rem 0 0.8rem; }
.article-reader .article-content h3 { font-size: 1.3rem; font-weight: 700; margin: 1.4rem 0 0.6rem; }
.article-reader .article-content p { margin: 0 0 1.1rem; }
.article-reader .article-content ul, .article-reader .article-content ol { margin: 0 0 1.1rem 1.4rem; }
.article-reader .article-content li { margin-bottom: 0.4rem; }
.article-reader .article-content blockquote { border-left: 3px solid rgba(0, 0, 0, 0.12); padding-left: 1rem; margin: 1.2rem 0; color: rgba(0, 0, 0, 0.55); font-style: italic; }
.article-reader .article-content img { max-width: 100%; height: auto; border-radius: 8px; margin: 1rem 0; }
.article-reader .article-content a { color: var(--color-primary); text-decoration: underline; }
`
