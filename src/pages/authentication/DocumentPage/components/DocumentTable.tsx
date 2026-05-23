import { DataTable } from '@/components/DataTable/DataTable'
import { ConfirmDeleteModal } from '@/components/ModalVariants/ConfirmDeleteModal'
import { DocumentClassifySelect } from '@/components/SelectionVariants'
import { useDelete, useList } from '@/hooks'
import { DocumentStatus, type Document } from '@/models/Document'
import { RoutePath } from '@/router/RoutePath'
import { listDocument, removeDocument } from '@/services/Document'
import { isApiResponseError } from '@/utils/apiResponse'
import { formatTimestamp } from '@/utils/time'
import { DeleteOutlined, EditOutlined, EllipsisOutlined } from '@ant-design/icons'
import { App, Button, Card, Dropdown, Input, Select, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface ListParams {
  page: number
  pageSize: number
  search?: string
  status?: DocumentStatus
  categoryId?: string
}

const statusColorMap: Record<DocumentStatus, string> = {
  [DocumentStatus.DRAFT]: 'default',
  [DocumentStatus.PUBLISHED]: 'success',
}

const statusLabelMap: Record<DocumentStatus, string> = {
  [DocumentStatus.DRAFT]: 'Nháp',
  [DocumentStatus.PUBLISHED]: 'Đã xuất bản',
}

export const DocumentTable = () => {
  const navigate = useNavigate()
  const { message } = App.useApp()

  const [searchValue, setSearchValue] = useState('')

  const {
    items,
    data: listData,
    isLoading: isListLoading,
    params,
    setParams,
    refresh,
  } = useList<Document, ListParams>(
    currentParams => {
      const searcher = {
        ...(currentParams.search
          ? { title: { operator: 'ilike' as const, value: currentParams.search } }
          : {}),
        ...(currentParams.categoryId
          ? { categoryId: { operator: 'eq' as const, value: currentParams.categoryId } }
          : {}),
        ...(currentParams.status
          ? { status: { operator: 'eq' as const, value: currentParams.status } }
          : {}),
      }

      return listDocument({
        page: currentParams.page,
        pageSize: currentParams.pageSize,
        searcher: Object.keys(searcher).length > 0 ? searcher : undefined,
        sorter: { field: 'updatedAt', direction: 'desc' },
      })
    },
    { initialParams: { page: 1, pageSize: 10 } },
  )

  const {
    selectedRowKeys,
    setSelectedRowKeys,
    deleteModal,
    openDeleteModal,
    closeDeleteModal,
    confirmDelete,
    isDeleting,
  } = useDelete<string>(id => removeDocument({ id }))

  const handleConfirmDelete = async () => {
    try {
      const deletedIds = await confirmDelete()
      if (!deletedIds.length) return
      void message.success(
        `Xóa ${deletedIds.length > 1 ? `${deletedIds.length} tài liệu` : 'tài liệu'} thành công`,
      )
      refresh()
    } catch (error) {
      const errorMessage = isApiResponseError(error)
        ? error.message
        : 'Không thể xóa. Vui lòng thử lại.'
      void message.error(errorMessage)
    }
  }

  const statusOptions = Object.entries(statusLabelMap).map(([value, label]) => ({
    label,
    value,
  }))

  const columns: ColumnsType<Document> = [
    {
      title: 'Tiêu đề',
      key: 'title',
      fixed: 'left',
      render: (_, record) => (
        <Typography.Link
          strong
          onClick={() => navigate(RoutePath.DocumentUpdatePage.getPath(record.id))}
        >
          {record.title}
        </Typography.Link>
      ),
    },
    {
      title: 'Slug',
      dataIndex: 'slug',
      key: 'slug',
      render: (value: string) => <Tag>{value}</Tag>,
    },
    {
      title: 'Giá',
      dataIndex: 'price',
      key: 'price',
      width: 140,
      align: 'right',
      render: (value: number) => value.toLocaleString('vi-VN'),
    },
    {
      title: 'Phân loại',
      dataIndex: ['category', 'name'],
      key: 'categoryName',
      render: (value?: string) => value || <Typography.Text type="secondary">-</Typography.Text>,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (value: DocumentStatus) => (
        <Tag color={statusColorMap[value]}>{statusLabelMap[value]}</Tag>
      ),
    },
    {
      title: 'Cập nhật',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 180,
      render: (value: string | number) => formatTimestamp(value),
    },
    {
      title: '',
      key: 'actions',
      width: 48,
      fixed: 'right',
      render: (_, record) => (
        <Dropdown
          trigger={['click']}
          menu={{
            items: [
              { key: 'edit', label: 'Sửa', icon: <EditOutlined /> },
              { key: 'delete', label: 'Xóa', icon: <DeleteOutlined />, danger: true },
            ],
            onClick: ({ key }) => {
              if (key === 'edit') navigate(RoutePath.DocumentUpdatePage.getPath(record.id))
              if (key === 'delete') openDeleteModal([record.id])
            },
          }}
        >
          <Button size="small" icon={<EllipsisOutlined />} />
        </Dropdown>
      ),
    },
  ]

  return (
    <>
      <Card>
        <DataTable<Document>
          title="Danh sách tài liệu"
          columns={columns}
          dataSource={items}
          loading={isListLoading}
          selectionAction={{
            selectedRowKeys,
            onChange: keys => setSelectedRowKeys(keys as string[]),
          }}
          extraAction={{
            items: [
              <Input.Search
                key="search"
                allowClear
                placeholder="Tìm theo tiêu đề"
                value={searchValue}
                onChange={e => setSearchValue(e.target.value)}
                onSearch={value => {
                  const normalized = value.trim()
                  setParams(current => ({ ...current, search: normalized || undefined, page: 1 }))
                }}
                style={{ width: 240 }}
              />,
              <Select
                key="status"
                allowClear
                placeholder="Trạng thái"
                options={statusOptions}
                value={params.status}
                onChange={value =>
                  setParams(current => ({ ...current, status: value || undefined, page: 1 }))
                }
                style={{ width: 160 }}
              />,
              <DocumentClassifySelect
                key="category"
                value={params.categoryId}
                onChange={value =>
                  setParams(current => ({ ...current, categoryId: value || undefined, page: 1 }))
                }
              />,
            ],
          }}
          paginationAction={{
            showPagination: true,
            currentPage: listData?.pagination?.page ?? params.page,
            pageSize: listData?.pagination?.pageSize ?? params.pageSize,
            totalRecords: listData?.pagination?.totalItems ?? 0,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50, 100],
            onPageChange(page, pageSize) {
              setParams(current => ({ ...current, page, pageSize }))
            },
          }}
          createAction={{
            onCreate: () => navigate(RoutePath.DocumentCreatePage.path),
          }}
          deleteAction={{
            onDelete: () => openDeleteModal(selectedRowKeys),
            disabled: selectedRowKeys.length === 0,
          }}
        />
      </Card>

      <ConfirmDeleteModal
        open={deleteModal.open}
        count={deleteModal.ids.length}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={closeDeleteModal}
      />
    </>
  )
}
