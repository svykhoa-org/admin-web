import { DataTable } from '@/components/DataTable/DataTable'
import { ConfirmDeleteModal } from '@/components/ModalVariants/ConfirmDeleteModal'
import { useDelete, useList } from '@/hooks'
import type { CourseStatus } from '@/models/Course'
import {
  CourseStatusMappingToColors,
  getCourseStatusMappingToLabels,
  type Course,
} from '@/models/Course'
import { RoutePath } from '@/router/RoutePath'
import { listCourse, removeCourse } from '@/services/Course'
import { isApiResponseError } from '@/utils/apiResponse'
import { formatTimestamp } from '@/utils/time'
import { DeleteOutlined, EditOutlined, EllipsisOutlined } from '@ant-design/icons'
import { App, Button, Card, Dropdown, Space, Tag, Typography } from 'antd'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

interface ListParams {
  page: number
  pageSize: number
  search?: string
  status?: CourseStatus
}

// const statusOptions = [
//   { label: 'Tất cả', value: undefined },
//   { label: 'Nháp', value: CourseStatus.DRAFT },
//   { label: 'Đã xuất bản', value: CourseStatus.PUBLISHED },
//   { label: 'Lưu trữ', value: CourseStatus.ARCHIVED },
// ]

export const CourseTable = () => {
  const navigate = useNavigate()
  const { t } = useTranslation(['CourseLocales', 'CommonLocales'])
  const CourseStatusMappingToLabels = useMemo(() => {
    return getCourseStatusMappingToLabels(t)
  }, [t])
  const { message } = App.useApp()

  const {
    items,
    data: listData,
    isLoading: isListLoading,
    params,
    setParams,
    refresh,
  } = useList<Course, ListParams>(
    currentParams => {
      const searcher = {
        ...(currentParams.search
          ? { title: { operator: 'ilike' as const, value: currentParams.search } }
          : {}),
        ...(currentParams.status
          ? { status: { operator: 'eq' as const, value: currentParams.status } }
          : {}),
      }

      return listCourse({
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
  } = useDelete<string>(id => removeCourse({ id }))

  const handleConfirmDelete = async () => {
    try {
      const deletedIds = await confirmDelete()
      if (!deletedIds.length) return
      void message.success(
        `Xóa ${deletedIds.length > 1 ? `${deletedIds.length} khoá học` : 'khoá học'} thành công`,
      )
      refresh()
    } catch (error) {
      const errorMessage = isApiResponseError(error)
        ? error.message
        : 'Không thể xóa. Vui lòng thử lại.'
      void message.error(errorMessage)
    }
  }

  const columns: ColumnsType<Course> = [
    {
      title: t('CourseLocales:title'),
      key: 'title',
      fixed: 'left',
      render: (_, record) => (
        <Typography.Link
          strong
          onClick={() => {
            navigate(RoutePath.CourseDetailPage.getPath(record.id))
          }}
        >
          {record.title}
        </Typography.Link>
      ),
    },
    {
      title: t('CourseLocales:short_code'),
      dataIndex: 'shortCode',
      key: 'shortCode',
      render: (value: string) => <Tag>{value}</Tag>,
    },
    {
      title: t('CourseLocales:price'),
      dataIndex: 'price',
      key: 'price',
      width: 140,
      align: 'right',
      render: (value: number) => value.toLocaleString('vi-VN'),
    },
    {
      title: t('CourseLocales:status'),
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (value: CourseStatus) => (
        <Tag color={CourseStatusMappingToColors[value]}>{CourseStatusMappingToLabels[value]}</Tag>
      ),
    },
    {
      title: t('CommonLocales:updated'),
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
              { key: 'edit', label: t('CommonLocales:detail'), icon: <EditOutlined /> },
              {
                key: 'delete',
                label: t('CommonLocales:delete'),
                icon: <DeleteOutlined />,
                danger: true,
              },
            ],
            onClick: ({ key }) => {
              if (key === 'edit') navigate(RoutePath.CourseDetailPage.getPath(record.id))
              if (key === 'delete') openDeleteModal([record.id])
            },
          }}
        >
          <Button size="small" icon={<EllipsisOutlined />} />
        </Dropdown>
      ),
    },
  ]

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
          {/* <Space className="w-full justify-between items-center">
            <div>
              <Typography.Title level={3} style={{ marginBottom: 4 }}>
                {t('CommonLocales:list_title', {
                  entity: t('CourseLocales:course').toLowerCase(),
                })}
              </Typography.Title>
            </div>

            <Space>
              <Input.Search
                allowClear
                placeholder="Tìm theo tiêu đề"
                value={searchValue}
                onChange={event => setSearchValue(event.target.value)}
                onSearch={handleSearch}
                style={{ maxWidth: 320 }}
              />
              <Select
                allowClear
                placeholder="Trạng thái"
                options={statusOptions}
                value={params.status}
                onChange={value =>
                  setParams(current => ({ ...current, status: value || undefined, page: 1 }))
                }
                style={{ width: 160 }}
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
                onClick={() => navigate('/courses/create')}
              />
            </Space>
          </Space> */}

          <DataTable<Course>
            title={t('CommonLocales:list_title', {
              entity: t('CourseLocales:course').toLowerCase(),
            })}
            columns={columns}
            dataSource={items}
            loading={isListLoading}
            rowSelection={{
              selectedRowKeys,
              onChange: keys => setSelectedRowKeys(keys as string[]),
            }}
            paginationAction={{
              currentPage: listData?.pagination?.page ?? params.page,
              pageSize: listData?.pagination?.pageSize ?? params.pageSize,
              totalRecords: listData?.pagination?.totalItems ?? 0,
              showSizeChanger: true,
              pageSizeOptions: [10, 20, 50, 100],
              onPageChange(page, pageSize) {
                setParams(current => ({ ...current, page, pageSize }))
              },
            }}
            onChange={handlePaginationChange}
            createAction={{
              onCreate: () => navigate(RoutePath.CourseCreatePage.path),
            }}
            deleteAction={{
              onDelete: () => openDeleteModal(selectedRowKeys),
              disabled: selectedRowKeys.length === 0,
            }}
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
