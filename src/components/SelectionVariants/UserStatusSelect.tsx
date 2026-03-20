import { UserStatus } from '@/models/User'
import type { FocusEventHandler } from 'react'
import { SearchableSelection } from './SearchableSelection'

interface UserStatusSelectProps {
  value?: UserStatus
  onChange: (value: UserStatus | undefined) => void
  onBlur?: FocusEventHandler<HTMLElement>
  placeholder?: string
  disabled?: boolean
}

const statusOptions = [
  { label: 'Active', value: UserStatus.Active },
  { label: 'Blocked', value: UserStatus.Blocked },
]

export const UserStatusSelect = ({
  value,
  onChange,
  onBlur,
  placeholder = 'Lọc theo trạng thái',
  disabled,
}: UserStatusSelectProps) => {
  return (
    <SearchableSelection
      placeholder={placeholder}
      options={statusOptions}
      value={value}
      disabled={disabled}
      onChange={nextValue => onChange(nextValue as UserStatus | undefined)}
      onBlur={onBlur}
    />
  )
}
