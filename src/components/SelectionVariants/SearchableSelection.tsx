import { Select } from 'antd'
import type { FocusEventHandler } from 'react'

export interface SelectionOption {
  label: string
  value: string
}

interface SearchableSelectionProps {
  placeholder?: string
  loading?: boolean
  options: SelectionOption[]
  value?: string
  disabled?: boolean
  onChange: (value: string | undefined) => void
  onBlur?: FocusEventHandler<HTMLElement>
}

export const SearchableSelection = ({
  placeholder,
  loading,
  options,
  value,
  disabled,
  onChange,
  onBlur,
}: SearchableSelectionProps) => {
  return (
    <Select
      allowClear
      showSearch
      placeholder={placeholder}
      loading={loading}
      options={options}
      value={value}
      disabled={disabled}
      filterOption={(input, option) =>
        (option?.label ?? '').toString().toLowerCase().includes(input.toLowerCase())
      }
      onChange={nextValue => onChange(nextValue ?? undefined)}
      onBlur={onBlur}
    />
  )
}
