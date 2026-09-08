import type { BulletinCategory } from '@/models/Bulletin'
import { listBulletinCategories } from '@/services/Bulletin'
import type { FocusEventHandler } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { SearchableSelection } from './SearchableSelection'

interface BulletinCategorySelectProps {
  value?: string
  onChange: (value: string | undefined) => void
  onBlur?: FocusEventHandler<HTMLElement>
  placeholder?: string
  disabled?: boolean
}

export const BulletinCategorySelect = ({
  value,
  onChange,
  onBlur,
  placeholder = 'Chọn chuyên mục',
  disabled,
}: BulletinCategorySelectProps) => {
  const [items, setItems] = useState<BulletinCategory[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    listBulletinCategories()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])

  const options = useMemo(() => items.map(i => ({ label: i.name, value: i.id })), [items])

  return (
    <SearchableSelection
      placeholder={placeholder}
      loading={loading}
      options={options}
      value={value}
      disabled={disabled}
      onChange={onChange}
      onBlur={onBlur}
    />
  )
}
