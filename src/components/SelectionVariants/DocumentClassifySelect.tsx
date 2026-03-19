import { useList } from '@/hooks'
import type { DocumentClassify } from '@/models/DocumentClassify'
import { listDocumentClassify, type ListDocumentClassifyInput } from '@/services/DocumentClassify'
import type { FocusEventHandler } from 'react'
import { useMemo } from 'react'
import { SearchableSelection } from './SearchableSelection'

interface DocumentClassifySelectProps {
  value?: string
  onChange: (value: string | undefined) => void
  onBlur?: FocusEventHandler<HTMLElement>
  placeholder?: string
  disabled?: boolean
  excludeId?: string
}

export const DocumentClassifySelect = ({
  value,
  onChange,
  onBlur,
  placeholder = 'Chọn loại tài liệu cha',
  disabled,
  excludeId,
}: DocumentClassifySelectProps) => {
  const parentListRequest = useList<DocumentClassify, ListDocumentClassifyInput>(
    listDocumentClassify,
    {
      initialParams: { page: 1, pageSize: 200 },
    },
  )

  const options = useMemo(
    () =>
      parentListRequest.items
        .filter(item => item.id !== excludeId)
        .map(item => ({
          label: `${item.name} (${item.slug})`,
          value: item.id,
        })),
    [excludeId, parentListRequest.items],
  )

  return (
    <SearchableSelection
      placeholder={placeholder}
      loading={parentListRequest.isLoading}
      options={options}
      value={value}
      disabled={disabled}
      onChange={onChange}
      onBlur={onBlur}
    />
  )
}
