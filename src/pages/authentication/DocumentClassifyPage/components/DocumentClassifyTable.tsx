import { ConfirmDeleteModal } from '@/components/ModalVariants/ConfirmDeleteModal'
import { useDelete, useList } from '@/hooks'
import type { DocumentClassify } from '@/models/DocumentClassify'
import { listDocumentClassify, removeDocumentClassify } from '@/services/DocumentClassify'
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
}

export const DocumentClassifyTable = () => {
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
  } = useList<DocumentClassify, ListParams>(
    params => {
      return listDocumentClassify({
        page: params.page,
        pageSize: params.pageSize,
        searcher: params.search
          ? {
              name: { operator: 'ilike', value: params.search },
            }
          : undefined,
        sorter: {
          field: 'updatedAt',
          direction: 'desc',
        },
      })
    },
    {
      initialParams: { page: 1, pageSize: 10, search: '' },
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
  } = useDelete<string>(id => removeDocumentClassify({ id }))

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

  const columns: ColumnsType<DocumentClassify> = [
    {
      title: 'Tên phân loại',
      dataIndex: 'name',
      key: 'name',
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
      title: 'Phân loại cha',
      dataIndex: ['parent', 'name'],
      key: 'parentName',
      render: (value?: string) => value || <Typography.Text type="secondary">-</Typography.Text>,
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
              if (key === 'edit') navigate(`/document-classify/${record.id}/edit`)
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
                Danh sách phân loại tài liệu
              </Typography.Title>
            </div>

            <Space>
              <Input.Search
                allowClear
                placeholder="Tìm theo tên hoặc slug"
                value={searchValue}
                onChange={event => setSearchValue(event.target.value)}
                onSearch={handleSearch}
                style={{ maxWidth: 420 }}
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
                onClick={() => navigate('/document-classify/create')}
              />
            </Space>
          </Space>

          <Table<DocumentClassify>
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
