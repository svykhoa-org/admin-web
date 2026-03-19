import { useCallback, useState } from 'react'
import { useRequest } from './useRequest'
import type { Identifier, UseRequestOptions } from './types'

interface DeleteModalState<TId extends Identifier> {
  open: boolean
  ids: TId[]
}

/**
 * Hook xóa hỗ trợ trọn quy trình:
 * - Xóa nhiều item cùng lúc qua `execute(ids)`
 * - Quản lý state chọn dòng
 * - Quản lý state modal xác nhận xóa
 */
export function useDelete<TId extends Identifier = string>(
  requestFn: (id: TId) => Promise<void>,
  options?: UseRequestOptions<void, [TId[]]>,
) {
  const [selectedRowKeys, setSelectedRowKeys] = useState<TId[]>([])
  const [deleteModal, setDeleteModal] = useState<DeleteModalState<TId>>({
    open: false,
    ids: [],
  })

  const batchFn = useCallback(
    async (ids: TId[]) => {
      await Promise.all(ids.map(id => requestFn(id)))
    },
    [requestFn],
  )

  const request = useRequest<void, [TId[]]>(batchFn, options)

  const openDeleteModal = useCallback((ids: TId[]) => {
    setDeleteModal({ open: true, ids })
  }, [])

  const closeDeleteModal = useCallback(() => {
    setDeleteModal({ open: false, ids: [] })
  }, [])

  const confirmDelete = useCallback(async () => {
    const ids = deleteModal.ids
    if (!ids.length) return [] as TId[]

    await request.execute(ids)
    setSelectedRowKeys([])
    closeDeleteModal()
    return ids
  }, [closeDeleteModal, deleteModal.ids, request])

  return {
    ...request,
    selectedRowKeys,
    setSelectedRowKeys,
    deleteModal,
    openDeleteModal,
    closeDeleteModal,
    confirmDelete,
    isDeleting: request.isLoading,
  }
}
