import {
  AlertOutlined,
  BookOutlined,
  ClockCircleOutlined,
  ExperimentOutlined,
  FileTextOutlined,
  HeartOutlined,
  MedicineBoxOutlined,
  SafetyOutlined,
  StarOutlined,
  TeamOutlined,
} from '@ant-design/icons'
import type { AntdIconProps } from '@ant-design/icons/lib/components/AntdIcon'
import type { ComponentType } from 'react'

// ─── Icon registry ────────────────────────────────────────────────────────────

export const ICON_OPTIONS: { value: string; Icon: ComponentType<AntdIconProps>; label: string }[] =
  [
    { value: 'HeartOutlined', Icon: HeartOutlined, label: 'Tim' },
    { value: 'MedicineBoxOutlined', Icon: MedicineBoxOutlined, label: 'Y tế' },
    { value: 'ExperimentOutlined', Icon: ExperimentOutlined, label: 'Thí nghiệm' },
    { value: 'SafetyOutlined', Icon: SafetyOutlined, label: 'An toàn' },
    { value: 'AlertOutlined', Icon: AlertOutlined, label: 'Cảnh báo' },
    { value: 'TeamOutlined', Icon: TeamOutlined, label: 'Nhóm' },
    { value: 'FileTextOutlined', Icon: FileTextOutlined, label: 'Tài liệu' },
    { value: 'BookOutlined', Icon: BookOutlined, label: 'Sách' },
    { value: 'StarOutlined', Icon: StarOutlined, label: 'Nổi bật' },
    { value: 'ClockCircleOutlined', Icon: ClockCircleOutlined, label: 'Thời gian' },
  ]

// ─── Renderer helper ──────────────────────────────────────────────────────────

/**
 * Renders an icon component given its stored name string (e.g. "HeartOutlined").
 * Used in table/display contexts. Returns null if iconValue is falsy.
 */
export function renderIcon(iconValue?: string | null, style?: React.CSSProperties) {
  if (!iconValue) return null
  const entry = ICON_OPTIONS.find(o => o.value === iconValue)
  if (!entry) return <span style={style}>{iconValue}</span>
  return <entry.Icon style={{ fontSize: 16, ...style }} />
}
