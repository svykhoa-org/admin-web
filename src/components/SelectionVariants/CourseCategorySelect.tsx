import type { CourseCategory } from '@/models/CourseCategory'
import { listCourseCategory } from '@/services/CourseCategory'
import type { FocusEventHandler } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { SearchableSelection } from './SearchableSelection'

interface CourseCategorySelectProps {
  value?: string
  onChange: (value: string | undefined) => void
  onBlur?: FocusEventHandler<HTMLElement>
  placeholder?: string
  disabled?: boolean
}

export const CourseCategorySelect = ({
  value,
  onChange,
  onBlur,
  placeholder = 'Danh mục khoá học',
  disabled,
}: CourseCategorySelectProps) => {
  const [categories, setCategories] = useState<CourseCategory[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setIsLoading(true)
    listCourseCategory()
      .then(setCategories)
      .finally(() => setIsLoading(false))
  }, [])

  const options = useMemo(
    () => categories.map(item => ({ label: item.name, value: item.id })),
    [categories],
  )

  return (
    <SearchableSelection
      placeholder={placeholder}
      loading={isLoading}
      options={options}
      value={value}
      disabled={disabled}
      onChange={onChange}
      onBlur={onBlur}
    />
  )
}
