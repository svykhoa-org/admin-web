import { DataTable } from '@/components/DataTable/DataTable'
import { ConfirmDeleteModal } from '@/components/ModalVariants/ConfirmDeleteModal'
import { ArticleCategorySelect } from '@/components/SelectionVariants'
import { useDelete, useList } from '@/hooks'
import { ArticleStatus, type Article } from '@/models/Article'
import { RoutePath } from '@/router/RoutePath'
import {
  listArticle,
  publishArticle,
  removeArticle,
  unpublishArticle,
  type ListArticleInput,
} from '@/services/Article'
import { isApiResponseError } from '@/utils/apiResponse'
import { formatTimestamp } from '@/utils/time'
import {
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  EllipsisOutlined,
  StopOutlined,
} from '@ant-design/icons'
import { App, Button, Card, Dropdown, Input, Select, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface ListParams {
  page: number
  pageSize: number
  search?: string
  status?: ArticleStatus
  categoryId?: string
}

const statusColorMap: Record<ArticleStatus, string> = {
  [ArticleStatus.DRAFT]: 'default',
  [ArticleStatus.PUBLISHED]: 'success',
  [ArticleStatus.ARCHIVED]: 'warning',
}

const statusLabelMap: Record<ArticleStatus, string> = {
  [ArticleStatus.DRAFT]: 'Nháp',
  [ArticleStatus.PUBLISHED]: 'Đã xuất bản',
  [ArticleStatus.ARCHIVED]: 'Lưu trữ',
}

export const ArticleTable = () => {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [searchValue, setSearchValue] = useState('')

  const {
    items,
    data: listData,
    isLoading,
    params,
    setParams,
    refresh,
  } = useList<Article, ListParams>(
    currentParams => {
      const input: ListArticleInput = {
        page: currentParams.page,
        limit: currentParams.pageSize,
        search: currentParams.search,
        status: currentParams.status,
        categoryId: currentParams.categoryId,
      }
      return listArticle(input)
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
  } = useDelete<string>(async id => {
    await removeArticle(id)
  })

  const handleConfirmDelete = async () => {
    try {
      const deletedIds = await confirmDelete()
      if (!deletedIds.length) return
      void message.success(
        `Xóa ${deletedIds.length > 1 ? `${deletedIds.length} bài` : 'bài'} thành công`,
      )
      refresh()
    } catch (error) {
      void message.error(
        isApiResponseError(error) ? error.message : 'Không thể xóa. Vui lòng thử lại.',
      )
    }
  }

  const handlePublishToggle = async (record: Article) => {
    try {
      if (record.status === ArticleStatus.PUBLISHED) {
        await unpublishArticle(record.id)
        void message.success('Thu hồi xuất bản thành công')
      } else {
        await publishArticle(record.id)
        void message.success('Xuất bản thành công')
      }
      refresh()
    } catch (error) {
      void message.error(isApiResponseError(error) ? error.message : 'Có lỗi xảy ra')
    }
  }

  const statusOptions = Object.entries(statusLabelMap).map(([value, label]) => ({ label, value }))

  const columns: ColumnsType<Article> = [
    {
      title: 'Tiêu đề',
      key: 'title',
      fixed: 'left',
      render: (_, record) => (
        <Typography.Link
          strong
          onClick={() => navigate(RoutePath.ArticleUpdatePage.getPath(record.id))}
        >
          {record.title}
        </Typography.Link>
      ),
    },
    {
      title: 'Chuyên mục',
      dataIndex: ['category', 'name'],
      key: 'categoryName',
      render: (value?: string) => value || <Typography.Text type="secondary">-</Typography.Text>,
    },
    {
      title: 'Tác giả',
      dataIndex: 'authorName',
      key: 'authorName',
      render: (value: string) => value || <Typography.Text type="secondary">-</Typography.Text>,
    },
    {
      title: 'Nổi bật',
      dataIndex: 'isFeatured',
      key: 'isFeatured',
      width: 90,
      align: 'center',
      render: (value: boolean) => (value ? <Tag color="gold">Nổi bật</Tag> : null),
    },
    {
      title: 'Lượt xem',
      dataIndex: 'viewCount',
      key: 'viewCount',
      width: 110,
      align: 'right',
      render: (value: number) => value.toLocaleString('vi-VN'),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (value: ArticleStatus) => (
        <Tag color={statusColorMap[value]}>{statusLabelMap[value]}</Tag>
      ),
    },
    {
      title: 'Cập nhật',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 170,
      render: (value: string | number) => formatTimestamp(value),
    },
    {
      title: '',
      key: 'actions',
      width: 48,
      fixed: 'right',
      render: (_, record) => {
        const isPublished = record.status === ArticleStatus.PUBLISHED
        return (
          <Dropdown
            trigger={['click']}
            menu={{
              items: [
                { key: 'edit', label: 'Sửa', icon: <EditOutlined /> },
                {
                  key: 'publish',
                  label: isPublished ? 'Thu hồi xuất bản' : 'Xuất bản',
                  icon: isPublished ? <StopOutlined /> : <CheckCircleOutlined />,
                },
                { key: 'delete', label: 'Xóa', icon: <DeleteOutlined />, danger: true },
              ],
              onClick: ({ key }) => {
                if (key === 'edit') navigate(RoutePath.ArticleUpdatePage.getPath(record.id))
                if (key === 'publish') void handlePublishToggle(record)
                if (key === 'delete') openDeleteModal([record.id])
              },
            }}
          >
            <Button size="small" icon={<EllipsisOutlined />} />
          </Dropdown>
        )
      },
    },
  ]

  return (
    <>
      <Card>
        <DataTable<Article>
          title="Danh sách bài viết"
          columns={columns}
          dataSource={items}
          loading={isLoading}
          selectionAction={{
            selectedRowKeys,
            onChange: keys => setSelectedRowKeys(keys as string[]),
          }}
          extraAction={{
            items: [
              <Input.Search
                key="search"
                allowClear
                placeholder="Tìm theo tiêu đề / nội dung"
                value={searchValue}
                onChange={e => setSearchValue(e.target.value)}
                onSearch={value =>
                  setParams(current => ({ ...current, search: value.trim() || undefined, page: 1 }))
                }
                style={{ width: 260 }}
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
              <ArticleCategorySelect
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
            onCreate: () => navigate(RoutePath.ArticleCreatePage.path),
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
