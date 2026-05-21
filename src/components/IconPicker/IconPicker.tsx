import { ICON_OPTIONS } from './renderIcon'

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
