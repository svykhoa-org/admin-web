import axiosInstance from '@/lib/axios'
import type { Course } from '@/models/Course'
import type { ApiListResponse } from '@/types/api'
import { unwrapList } from '@/utils/apiResponse'
import { Empty, Select, Spin } from 'antd'
import type { FocusEventHandler, UIEvent } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

interface CourseSelectProps {
  value?: string
  onChange: (value: string | undefined) => void
  onBlur?: FocusEventHandler<HTMLElement>
  placeholder?: string
  disabled?: boolean
}

const PAGE_SIZE = 10
const SEARCH_DEBOUNCE_MS = 350

export const CourseSelect = ({
  value,
  onChange,
  onBlur,
  placeholder = 'Chọn khoá học',
  disabled,
}: CourseSelectProps) => {
  const [items, setItems] = useState<Course[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [searchValue, setSearchValue] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const requestIdRef = useRef(0)

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(searchValue.trim())
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timeout)
  }, [searchValue])

  const fetchPage = useCallback(async (nextPage: number, append: boolean, keyword: string) => {
    const currentRequestId = ++requestIdRef.current

    if (append) {
      setIsLoadingMore(true)
    } else {
      setIsLoading(true)
    }

    try {
      const params: Record<string, unknown> = { page: nextPage, limit: PAGE_SIZE }
      if (keyword) params.title = keyword

      const response = await axiosInstance.get<ApiListResponse<Course>>('/courses', { params })
      const result = unwrapList(response.data)

      if (currentRequestId !== requestIdRef.current) return

      setItems(prev => {
        if (!append) return result.items
        const unique = new Map<string, Course>()
        for (const course of [...prev, ...result.items]) unique.set(course.id, course)
        return [...unique.values()]
      })
      setPage(nextPage)
      setHasMore(result.pagination.page < result.pagination.totalPages)
    } finally {
      if (currentRequestId === requestIdRef.current) {
        setIsLoading(false)
        setIsLoadingMore(false)
      }
    }
  }, [])

  useEffect(() => {
    void fetchPage(1, false, debouncedSearch)
  }, [debouncedSearch, fetchPage])

  const handlePopupScroll = (event: UIEvent<HTMLElement>) => {
    const target = event.target as HTMLElement
    const isAtBottom = target.scrollTop + target.offsetHeight >= target.scrollHeight - 16
    if (!isAtBottom || isLoading || isLoadingMore || !hasMore) return
    void fetchPage(page + 1, true, debouncedSearch)
  }

  const options = useMemo(
    () => items.map(course => ({ value: course.id, label: course.title })),
    [items],
  )

  return (
    <Select
      allowClear
      showSearch
      filterOption={false}
      placeholder={placeholder}
      loading={isLoading}
      options={options}
      value={value}
      disabled={disabled}
      onSearch={setSearchValue}
      onPopupScroll={handlePopupScroll}
      notFoundContent={
        isLoading ? <Spin size="small" /> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
      }
      dropdownRender={menu => (
        <>
          {menu}
          {isLoadingMore && (
            <div style={{ textAlign: 'center', padding: 8 }}>
              <Spin size="small" />
            </div>
          )}
        </>
      )}
      onChange={nextValue => onChange(nextValue ?? undefined)}
      onBlur={onBlur}
    />
  )
}
