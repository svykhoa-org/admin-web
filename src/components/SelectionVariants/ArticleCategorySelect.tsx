import type { ArticleCategory } from '@/models/Article'
import { listArticleCategories } from '@/services/Article'
import type { FocusEventHandler } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { SearchableSelection } from './SearchableSelection'

interface ArticleCategorySelectProps {
  value?: string
  onChange: (value: string | undefined) => void
  onBlur?: FocusEventHandler<HTMLElement>
  placeholder?: string
  disabled?: boolean
}

export const ArticleCategorySelect = ({
  value,
  onChange,
  onBlur,
  placeholder = 'Chọn chuyên mục',
  disabled,
}: ArticleCategorySelectProps) => {
  const [items, setItems] = useState<ArticleCategory[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    listArticleCategories()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false))
  }, [])

  const options = useMemo(() => items.map(item => ({ label: item.name, value: item.id })), [items])

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
