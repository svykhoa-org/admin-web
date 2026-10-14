import { listVideos, type VideoDto } from '@/services/Video'
import { Empty, Select, Spin } from 'antd'
import type { FocusEventHandler } from 'react'
import { useEffect, useState } from 'react'

interface VideoSelectProps {
  value?: string | null
  onChange: (value: string | undefined) => void
  onBlur?: FocusEventHandler<HTMLElement>
  placeholder?: string
  disabled?: boolean
  // The current selection may fall outside the first page of results; seed it
  // so the Select shows a title instead of a raw id.
  selected?: { id: string; title: string } | null
}

const PAGE_SIZE = 20
const SEARCH_DEBOUNCE_MS = 350

export const VideoSelect = ({
  value,
  onChange,
  onBlur,
  placeholder = 'Chọn video từ kho',
  disabled,
  selected,
}: VideoSelectProps) => {
  // Loading is derived (loaded.search !== debouncedSearch) so the effect only
  // sets state from the async callback, not synchronously.
  const [loaded, setLoaded] = useState<{ search: string; items: VideoDto[] } | null>(null)
  const [searchValue, setSearchValue] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(searchValue.trim()), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timeout)
  }, [searchValue])

  useEffect(() => {
    let cancelled = false
    listVideos({ page: 1, pageSize: PAGE_SIZE, search: debouncedSearch || undefined })
      .then(result => {
        if (!cancelled) setLoaded({ search: debouncedSearch, items: result })
      })
      .catch(() => {
        if (!cancelled) setLoaded({ search: debouncedSearch, items: [] })
      })
    return () => {
      cancelled = true
    }
  }, [debouncedSearch])

  const isLoading = loaded?.search !== debouncedSearch

  // Cheap (<= PAGE_SIZE rows) — computed inline instead of memoized.
  const labels = new Map<string, string>()
  if (selected) labels.set(selected.id, selected.title)
  for (const video of loaded?.items ?? []) {
    labels.set(video.id, `${video.title} (${video.durationMinutes} phút)`)
  }
  const options = [...labels.entries()].map(([id, label]) => ({ value: id, label }))

  return (
    <Select
      allowClear
      showSearch
      filterOption={false}
      placeholder={placeholder}
      loading={isLoading}
      options={options}
      value={value ?? undefined}
      disabled={disabled}
      onSearch={setSearchValue}
      notFoundContent={
        isLoading ? <Spin size="small" /> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
      }
      onChange={next => onChange(next ?? undefined)}
      onBlur={onBlur}
    />
  )
}
