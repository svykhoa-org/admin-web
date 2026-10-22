import { USER_ROLE_LABEL, UserRole } from '@/models/User'
import type { FocusEventHandler } from 'react'
import { SearchableSelection } from './SearchableSelection'

interface RoleStatusSelectProps {
  value?: UserRole
  onChange: (value: UserRole | undefined) => void
  onBlur?: FocusEventHandler<HTMLElement>
  placeholder?: string
  disabled?: boolean
}

const roleOptions = Object.values(UserRole).map(value => ({
  label: USER_ROLE_LABEL[value],
  value,
}))

export const RoleStatusSelect = ({
  value,
  onChange,
  onBlur,
  placeholder = 'Lọc theo vai trò',
  disabled,
}: RoleStatusSelectProps) => {
  return (
    <SearchableSelection
      placeholder={placeholder}
      options={roleOptions}
      value={value}
      disabled={disabled}
      onChange={nextValue => onChange(nextValue as UserRole | undefined)}
      onBlur={onBlur}
    />
  )
}
