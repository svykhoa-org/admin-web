import { DataTable } from '@/components/DataTable/DataTable'
import { ConfirmDeleteModal } from '@/components/ModalVariants/ConfirmDeleteModal'
import { BulletinCategorySelect } from '@/components/SelectionVariants'
import { useDelete, useList } from '@/hooks'
import { BulletinImportance, BulletinStatus, type Bulletin } from '@/models/Bulletin'
import { RoutePath } from '@/router/RoutePath'
import {
  listBulletin,
  publishBulletin,
  removeBulletin,
  unpublishBulletin,
  type ListBulletinInput,
} from '@/services/Bulletin'
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
  status?: BulletinStatus
  categoryId?: string
}

const statusColorMap: Record<BulletinStatus, string> = {
  [BulletinStatus.DRAFT]: 'default',
  [BulletinStatus.PUBLISHED]: 'success',
  [BulletinStatus.ARCHIVED]: 'warning',
}
const statusLabelMap: Record<BulletinStatus, string> = {
  [BulletinStatus.DRAFT]: 'Nháp',
  [BulletinStatus.PUBLISHED]: 'Đã đăng',
  [BulletinStatus.ARCHIVED]: 'Lưu trữ',
}

export const BulletinTable = () => {
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
  } = useList<Bulletin, ListParams>(
    currentParams => {
      const input: ListBulletinInput = {
        page: currentParams.page,
        limit: currentParams.pageSize,
        search: currentParams.search,
        status: currentParams.status,
        categoryId: currentParams.categoryId,
      }
      return listBulletin(input)
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
    await removeBulletin(id)
  })

  const handleConfirmDelete = async () => {
    try {
      const deletedIds = await confirmDelete()
      if (!deletedIds.length) return
      void message.success(
        `Xóa ${deletedIds.length > 1 ? `${deletedIds.length} thông báo` : 'thông báo'} thành công`,
      )
      refresh()
    } catch (error) {
      void message.error(isApiResponseError(error) ? error.message : 'Không thể xóa.')
    }
  }

  const handlePublishToggle = async (record: Bulletin) => {
    try {
      if (record.status === BulletinStatus.PUBLISHED) {
        await unpublishBulletin(record.id)
        void message.success('Gỡ đăng thành công')
      } else {
        await publishBulletin(record.id)
        void message.success('Đăng thành công')
      }
      refresh()
    } catch (error) {
      void message.error(isApiResponseError(error) ? error.message : 'Có lỗi xảy ra')
    }
  }

  const statusOptions = Object.entries(statusLabelMap).map(([value, label]) => ({ label, value }))

  const columns: ColumnsType<Bulletin> = [
    {
      title: 'Tiêu đề',
      key: 'title',
      fixed: 'left',
      render: (_, record) => (
        <Typography.Link
          strong
          onClick={() => navigate(RoutePath.BulletinUpdatePage.getPath(record.id))}
        >
          {record.title}
        </Typography.Link>
      ),
    },
    {
      title: 'Chuyên mục',
      dataIndex: ['category', 'name'],
      key: 'categoryName',
      render: (v?: string) => v || <Typography.Text type="secondary">-</Typography.Text>,
    },
    {
      title: 'Mức độ',
      dataIndex: 'importance',
      key: 'importance',
      width: 100,
      render: (v: BulletinImportance) =>
        v === BulletinImportance.URGENT ? <Tag color="error">Khẩn</Tag> : <Tag>Thường</Tag>,
    },
    {
      title: 'Lượt xem',
      dataIndex: 'viewCount',
      key: 'viewCount',
      width: 100,
      align: 'right',
      render: (v: number) => v.toLocaleString('vi-VN'),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (v: BulletinStatus) => <Tag color={statusColorMap[v]}>{statusLabelMap[v]}</Tag>,
    },
    {
      title: 'Cập nhật',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 170,
      render: (v: string | number) => formatTimestamp(v),
    },
    {
      title: '',
      key: 'actions',
      width: 48,
      fixed: 'right',
      render: (_, record) => {
        const isPublished = record.status === BulletinStatus.PUBLISHED
        return (
          <Dropdown
            trigger={['click']}
            menu={{
              items: [
                { key: 'edit', label: 'Sửa', icon: <EditOutlined /> },
                {
                  key: 'publish',
                  label: isPublished ? 'Gỡ đăng' : 'Đăng',
                  icon: isPublished ? <StopOutlined /> : <CheckCircleOutlined />,
                },
                { key: 'delete', label: 'Xóa', icon: <DeleteOutlined />, danger: true },
              ],
              onClick: ({ key }) => {
                if (key === 'edit') navigate(RoutePath.BulletinUpdatePage.getPath(record.id))
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
        <DataTable<Bulletin>
          title="Danh sách thông báo"
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
                  setParams(cur => ({ ...cur, search: value.trim() || undefined, page: 1 }))
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
                  setParams(cur => ({ ...cur, status: value || undefined, page: 1 }))
                }
                style={{ width: 150 }}
              />,
              <BulletinCategorySelect
                key="category"
                value={params.categoryId}
                onChange={value =>
                  setParams(cur => ({ ...cur, categoryId: value || undefined, page: 1 }))
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
              setParams(cur => ({ ...cur, page, pageSize }))
            },
          }}
          createAction={{ onCreate: () => navigate(RoutePath.BulletinCreatePage.path) }}
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
