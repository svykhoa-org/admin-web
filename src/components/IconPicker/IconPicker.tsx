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

const ICON_OPTIONS: { value: string; Icon: ComponentType<AntdIconProps>; label: string }[] = [
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

// ─── Props ────────────────────────────────────────────────────────────────────

export interface IconPickerProps {
  value?: string
  onChange?: (value: string | undefined) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function IconPicker({ value, onChange }: IconPickerProps) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {ICON_OPTIONS.map(({ value: iconValue, Icon, label }) => {
        const isSelected = value === iconValue
        return (
          <button
            key={iconValue}
            type="button"
            title={label}
            onClick={() => onChange?.(isSelected ? undefined : iconValue)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              width: 64,
              height: 64,
              border: isSelected
                ? '2px solid var(--color-primary)'
                : '1px solid var(--color-border, #e5e7eb)',
              borderRadius: 8,
              background: isSelected ? 'var(--color-primary-bg, #e6f4ff)' : '#fff',
              cursor: 'pointer',
              fontSize: 11,
              color: isSelected ? 'var(--color-primary)' : '#666',
            }}
          >
            <Icon style={{ fontSize: 22, color: isSelected ? 'var(--color-primary)' : '#555' }} />
            {label}
          </button>
        )
      })}
    </div>
  )
}

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
