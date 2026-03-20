import { listUser } from '@/services/User'
import type { User } from '@/models/User'
import { Empty, Select, Spin } from 'antd'
import type { FocusEventHandler, UIEvent } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

interface UserSelectProps {
  value?: string
  onChange: (value: string | undefined) => void
  onBlur?: FocusEventHandler<HTMLElement>
  placeholder?: string
  disabled?: boolean
}

const PAGE_SIZE = 10
const SEARCH_DEBOUNCE_MS = 350

export const UserSelect = ({
  value,
  onChange,
  onBlur,
  placeholder = 'Chọn người dùng',
  disabled,
}: UserSelectProps) => {
  const [items, setItems] = useState<User[]>([])
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
      let fetchedItems: User[] = []
      let canLoadMore = false

      if (!keyword) {
        const result = await listUser({
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
        const [byName, byEmail] = await Promise.all([
          listUser({
            page: nextPage,
            pageSize: PAGE_SIZE,
            searcher: {
              fullName: { operator: 'ilike', value: keyword },
            },
            sorter: {
              field: 'updatedAt',
              direction: 'desc',
            },
          }),
          listUser({
            page: nextPage,
            pageSize: PAGE_SIZE,
            searcher: {
              email: { operator: 'ilike', value: keyword },
            },
            sorter: {
              field: 'updatedAt',
              direction: 'desc',
            },
          }),
        ])

        const unique = new Map<string, User>()
        for (const user of [...byName.items, ...byEmail.items]) unique.set(user.id, user)

        fetchedItems = [...unique.values()]
        canLoadMore =
          byName.pagination.page < byName.pagination.totalPages ||
          byEmail.pagination.page < byEmail.pagination.totalPages
      }

      if (currentRequestId !== requestIdRef.current) return

      setItems(previousItems => {
        if (!append) return fetchedItems

        const unique = new Map<string, User>()
        for (const user of [...previousItems, ...fetchedItems]) unique.set(user.id, user)
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
      items.map(user => ({
        value: user.id,
        label: `${user.fullName} (${user.email})`,
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
