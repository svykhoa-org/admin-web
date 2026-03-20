import type { Document } from '@/models/Document'
import { listDocument } from '@/services/Document'
import { Empty, Select, Spin } from 'antd'
import type { FocusEventHandler, UIEvent } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

interface DocumentSelectProps {
  value?: string
  onChange: (value: string | undefined) => void
  onBlur?: FocusEventHandler<HTMLElement>
  placeholder?: string
  disabled?: boolean
}

const PAGE_SIZE = 20
const SEARCH_DEBOUNCE_MS = 350

export const DocumentSelect = ({
  value,
  onChange,
  onBlur,
  placeholder = 'Chọn tài liệu',
  disabled,
}: DocumentSelectProps) => {
  const [items, setItems] = useState<Document[]>([])
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
      let fetchedItems: Document[] = []
      let canLoadMore = false

      if (!keyword) {
        const result = await listDocument({
          page: nextPage,
          pageSize: PAGE_SIZE,
          sorter: {
            field: 'updatedAt',
            direction: 'desc',
          },
        })

        fetchedItems = result.items
        canLoadMore = result.pagination.page < result.pagination.totalPages
      } else {
        const [byTitle, bySlug] = await Promise.all([
          listDocument({
            page: nextPage,
            pageSize: PAGE_SIZE,
            searcher: {
              title: { operator: 'ilike', value: keyword },
            },
            sorter: {
              field: 'updatedAt',
              direction: 'desc',
            },
          }),
          listDocument({
            page: nextPage,
            pageSize: PAGE_SIZE,
            searcher: {
              slug: { operator: 'ilike', value: keyword },
            },
            sorter: {
              field: 'updatedAt',
              direction: 'desc',
            },
          }),
        ])

        const unique = new Map<string, Document>()
        for (const document of [...byTitle.items, ...bySlug.items])
          unique.set(document.id, document)

        fetchedItems = [...unique.values()]
        canLoadMore =
          byTitle.pagination.page < byTitle.pagination.totalPages ||
          bySlug.pagination.page < bySlug.pagination.totalPages
      }

      if (currentRequestId !== requestIdRef.current) return

      setItems(previousItems => {
        if (!append) return fetchedItems

        const unique = new Map<string, Document>()
        for (const document of [...previousItems, ...fetchedItems])
          unique.set(document.id, document)
        return [...unique.values()]
      })
      setPage(nextPage)
      setHasMore(canLoadMore)
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
    () =>
      items.map(document => ({
        value: document.id,
        label: `${document.title} (${document.slug})`,
      })),
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
