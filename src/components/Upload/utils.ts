import {
  FileExcelOutlined,
  FileOutlined,
  FilePdfOutlined,
  FilePptOutlined,
  FileTextOutlined,
  FileWordOutlined,
} from '@ant-design/icons'
import type { ComponentType } from 'react'

// ─── Byte formatting ──────────────────────────────────────────────────────────

export function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`
  if (b < 1073741824) return `${(b / 1048576).toFixed(1)} MB`
  return `${(b / 1073741824).toFixed(2)} GB`
}

export function formatEta(secs: number): string {
  if (!isFinite(secs) || secs < 0) return '—'
  if (secs < 60) return `${Math.round(secs)}s`
  if (secs < 3600) return `${Math.floor(secs / 60)}m ${Math.round(secs % 60)}s`
  return `${Math.floor(secs / 3600)}h ${Math.floor((secs % 3600) / 60)}m`
}

// ─── File icon resolution ─────────────────────────────────────────────────────

export interface FileIconInfo {
  Icon: ComponentType<{ style?: React.CSSProperties; className?: string }>
  colorClass: string
  label: string
}

export function getFileIconInfo(name: string, mimeType?: string): FileIconInfo {
  const lower = name.toLowerCase()
  if (mimeType === 'application/pdf' || lower.endsWith('.pdf'))
    return { Icon: FilePdfOutlined, colorClass: 'text-danger', label: 'PDF' }
  if (lower.match(/\.(doc|docx)$/))
    return { Icon: FileWordOutlined, colorClass: 'text-blue-600', label: 'Word' }
  if (lower.match(/\.(xls|xlsx)$/))
    return { Icon: FileExcelOutlined, colorClass: 'text-green-600', label: 'Excel' }
  if (lower.match(/\.(ppt|pptx)$/))
    return { Icon: FilePptOutlined, colorClass: 'text-orange-600', label: 'PPT' }
  if (lower.endsWith('.txt'))
    return { Icon: FileTextOutlined, colorClass: 'text-gray-500', label: 'TXT' }
  return { Icon: FileOutlined, colorClass: 'text-gray-500', label: 'File' }
}

// ─── UID generator ────────────────────────────────────────────────────────────

let uidCounter = 0
export function makeUid(): string {
  return `upload-${Date.now()}-${++uidCounter}`
}
