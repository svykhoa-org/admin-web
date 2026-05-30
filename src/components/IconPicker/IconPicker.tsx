import { SearchOutlined } from '@ant-design/icons'
import { Input, Popover, Tooltip } from 'antd'
import { useState } from 'react'
import { ICON_OPTIONS } from './renderIcon'

// ─── Props ────────────────────────────────────────────────────────────────────

export interface IconPickerProps {
  value?: string
  onChange?: (value: string | undefined) => void
  placeholder?: string
}

// ─── Picker panel ─────────────────────────────────────────────────────────────

function PickerPanel({
  value,
  onSelect,
}: {
  value?: string
  onSelect: (v: string | undefined) => void
}) {
  const [search, setSearch] = useState('')

  const filtered = search.trim()
    ? ICON_OPTIONS.filter(
        o =>
          o.label.toLowerCase().includes(search.toLowerCase()) ||
          o.value.toLowerCase().includes(search.toLowerCase()) ||
          o.category.toLowerCase().includes(search.toLowerCase()),
      )
    : ICON_OPTIONS

  return (
    <div style={{ width: 320 }}>
      <Input
        prefix={<SearchOutlined />}
        placeholder="Tìm icon..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        allowClear
        style={{ marginBottom: 10 }}
        autoFocus
      />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 4,
          maxHeight: 260,
          overflowY: 'auto',
        }}
      >
        {filtered.length === 0 ? (
          <div
            style={{
              gridColumn: 'span 7',
              textAlign: 'center',
              padding: '16px 0',
              color: '#999',
              fontSize: 13,
            }}
          >
            Không tìm thấy icon
          </div>
        ) : (
          filtered.map(({ value: iconValue, Icon, label }) => {
            const isSelected = value === iconValue
            return (
              <Tooltip key={iconValue} title={label} mouseEnterDelay={0.4}>
                <button
                  type="button"
                  onClick={() => onSelect(isSelected ? undefined : iconValue)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    aspectRatio: '1',
                    border: isSelected
                      ? '2px solid var(--ant-color-primary, #1677ff)'
                      : '1px solid transparent',
                    borderRadius: 8,
                    background: isSelected ? 'var(--ant-color-primary-bg, #e6f4ff)' : 'transparent',
                    cursor: 'pointer',
                    color: isSelected ? 'var(--ant-color-primary, #1677ff)' : '#555',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => {
                    if (!isSelected)
                      (e.currentTarget as HTMLButtonElement).style.background = '#f5f5f5'
                  }}
                  onMouseLeave={e => {
                    if (!isSelected)
                      (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
                  }}
                >
                  <Icon size={18} />
                </button>
              </Tooltip>
            )
          })
        )}
      </div>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function IconPicker({ value, onChange, placeholder = 'Chọn icon' }: IconPickerProps) {
  const [open, setOpen] = useState(false)

  const selected = ICON_OPTIONS.find(o => o.value === value)

  const handleSelect = (v: string | undefined) => {
    onChange?.(v)
    if (v) setOpen(false)
  }

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      trigger="click"
      placement="bottomLeft"
      content={<PickerPanel value={value} onSelect={handleSelect} />}
    >
      <button
        type="button"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          height: 32,
          padding: '0 11px',
          border: '1px solid var(--ant-color-border, #d9d9d9)',
          borderRadius: 6,
          background: '#fff',
          cursor: 'pointer',
          fontSize: 14,
          color: selected ? '#222' : '#bbb',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
        {selected ? (
          <>
            <selected.Icon size={16} style={{ color: '#555', flexShrink: 0 }} />
            <span>{selected.label}</span>
          </>
        ) : (
          <span>{placeholder}</span>
        )}
      </button>
    </Popover>
  )
}
