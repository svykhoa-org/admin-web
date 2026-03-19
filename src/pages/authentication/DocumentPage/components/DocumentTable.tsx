import { ConfirmDeleteModal } from '@/components/ModalVariants/ConfirmDeleteModal'
import { DocumentClassifySelect } from '@/components/SelectionVariants'
import { useDelete, useList } from '@/hooks'
import { DocumentStatus, type Document } from '@/models/Document'
import { listDocument, removeDocument } from '@/services/Document'
import { isApiResponseError } from '@/utils/apiResponse'
import { formatTimestamp } from '@/utils/time'
import { DeleteOutlined, EditOutlined, EllipsisOutlined, PlusOutlined } from '@ant-design/icons'
import { App, Button, Card, Dropdown, Input, Space, Table, Tag, Typography } from 'antd'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface ListParams {
  page: number
  pageSize: number
  search?: string
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
          ? {
              title: { operator: 'ilike' as const, value: currentParams.search },
            }
          : {}),
        ...(currentParams.categoryId
          ? {
              categoryId: { operator: 'eq' as const, value: currentParams.categoryId },
            }
          : {}),
      }

      return listDocument({
        page: currentParams.page,
        pageSize: currentParams.pageSize,
        searcher: Object.keys(searcher).length > 0 ? searcher : undefined,
        sorter: {
          field: 'updatedAt',
          direction: 'desc',
        },
      })
    },
    {
      initialParams: { page: 1, pageSize: 10, search: '', categoryId: undefined },
    },
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
        `Xóa ${deletedIds.length > 1 ? `${deletedIds.length} bản ghi` : 'bản ghi'} thành công`,
      )
      refresh()
    } catch (error) {
      const errorMessage = isApiResponseError(error)
        ? error.message
        : 'Không thể xóa. Vui lòng thử lại.'
      void message.error(errorMessage)
    }
  }

  const columns: ColumnsType<Document> = [
    {
      title: 'Tiêu đề',
      dataIndex: 'title',
      key: 'title',
      fixed: 'left',
      render: (value: string) => <Typography.Text strong>{value}</Typography.Text>,
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
              {
                key: 'edit',
                label: 'Sửa',
                icon: <EditOutlined />,
              },
              {
                key: 'delete',
                label: 'Xóa',
                icon: <DeleteOutlined />,
                danger: true,
              },
            ],
            onClick: ({ key }) => {
              if (key === 'edit') navigate(`/documents/${record.id}/edit`)
              if (key === 'delete') openDeleteModal([record.id])
            },
          }}
        >
          <Button size="small" icon={<EllipsisOutlined />} />
        </Dropdown>
      ),
    },
  ]

  const handleSearch = (value: string) => {
    const normalized = value.trim()
    setParams(current => ({
      ...current,
      search: normalized || undefined,
      page: 1,
    }))
  }

  const handlePaginationChange = (pagination: TablePaginationConfig) => {
    setParams(current => ({
      ...current,
      page: pagination.current ?? current.page,
      pageSize: pagination.pageSize ?? current.pageSize,
    }))
  }

  return (
    <>
      <Card>
        <Space vertical size={16} className="w-full">
          <Space className="w-full justify-between items-center">
            <div>
              <Typography.Title level={3} style={{ marginBottom: 4 }}>
                Danh sách tài liệu
              </Typography.Title>
            </div>

            <Space>
              <Input.Search
                allowClear
                placeholder="Tìm theo tiêu đề"
                value={searchValue}
                onChange={event => setSearchValue(event.target.value)}
                onSearch={handleSearch}
                style={{ maxWidth: 420 }}
              />
              <DocumentClassifySelect
                onChange={value =>
                  setParams(current => ({ ...current, categoryId: value || undefined, page: 1 }))
                }
                value={params.categoryId}
              />
              <Button
                danger
                icon={<DeleteOutlined />}
                disabled={selectedRowKeys.length === 0}
                onClick={() => openDeleteModal(selectedRowKeys)}
              />
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => navigate('/documents/create')}
              />
            </Space>
          </Space>

          <Table<Document>
            rowKey="id"
            columns={columns}
            dataSource={items}
            loading={isListLoading}
            scroll={{ x: 'max-content' }}
            rowSelection={{
              selectedRowKeys,
              onChange: keys => setSelectedRowKeys(keys as string[]),
            }}
            pagination={{
              current: listData?.pagination.page ?? params.page,
              pageSize: listData?.pagination.pageSize ?? params.pageSize,
              total: listData?.pagination.totalItems ?? 0,
              showSizeChanger: true,
              showTotal: total => `Tổng ${total} bản ghi`,
            }}
            onChange={handlePaginationChange}
          />
        </Space>
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
