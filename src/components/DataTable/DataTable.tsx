import type { AbstractModel } from '@/models/AbstractModel'
import { Space, Table, Typography } from 'antd'
import type { TableProps } from 'antd/es/table'

import { CreateAction, type CreateActionProps } from './CreateAction'
import { DeleteAction, type DeleteActionProps } from './DeleteAction'
import { ExtraAction, type ExtraActionProps } from './ExtraAction'
import './style.css'
import type { TableRowSelection } from 'antd/es/table/interface'
import { useTranslation } from 'react-i18next'

interface DataTableProps<RecordType extends AbstractModel = AbstractModel> extends Pick<
  TableProps<RecordType>,
  /** Sử dụng rowKey để định nghĩa khoá, nếu không có thì sẽ sử dụng id */
  'rowKey' | 'columns' | 'dataSource' | 'loading' | 'bordered' | 'rowSelection' | 'onChange'
> {
  title?: React.ReactNode
  /** Tự động thêm số thứ tự cho mỗi hàng */
  autoIndex?: boolean

  createAction?: CreateActionProps
  deleteAction?: DeleteActionProps
  extraAction?: ExtraActionProps

  selectionAction?: {
    selectedRowKeys: Array<AbstractModel['id']>
    onChange: (selectedRowKeys: Array<AbstractModel['id']>) => void
    disabled?: (record: RecordType) => boolean
    checkStrictly?: boolean // Cho phép chọn cả parent và child khi có rowSelection kiểu tree
  }
  paginationAction?: {
    showPagination?: boolean
    currentPage: number
    pageSize: number
    totalRecords: number
    showSizeChanger?: boolean
    pageSizeOptions?: number[]
    onPageChange: (page: number, pageSize: number) => void
  }
}

/**
 * DataTable sẽ đảm nhận việc render & quản lý state cho:
 * - Table
 * - Pagination
 * - Search
 * - Filter (Drawer)
 * - Extra Action (Trong case nếu muốn filter mà không dùng drawer, hoặc có những action extra nào đó)
 */
export const DataTable = <RecordType extends AbstractModel = AbstractModel>({
  title,
  autoIndex = true,
  rowKey = 'id',
  columns,
  dataSource,
  bordered = true,
  loading = false,

  createAction,
  deleteAction,
  extraAction,

  selectionAction,
  paginationAction,
}: DataTableProps<RecordType>) => {
  const { t } = useTranslation(['ComponentLocales'])

  return (
    <Space className="DataTable__container w-full" vertical size={16}>
      <Space className="DataTable_header w-full justify-between" align="center">
        <Typography.Title level={3}>{title}</Typography.Title>
        <Space size={16} align="center">
          <ExtraAction items={extraAction?.items || []} />
          <DeleteAction onDelete={deleteAction?.onDelete} disabled={deleteAction?.disabled} />
          <CreateAction onCreate={createAction?.onCreate} />
        </Space>
      </Space>
      <Table<RecordType>
        rowKey={rowKey}
        columns={columns}
        dataSource={dataSource}
        pagination={
          !paginationAction?.showPagination
            ? false
            : {
                simple: false, // Sử dụng pagination mặc định của Ant Design
                showLessItems: true, // Ẩn một số trang khi có nhiều trang
                hideOnSinglePage: true, // Ẩn pagination nếu chỉ có một trang
                current: paginationAction.currentPage,
                pageSize: paginationAction.pageSize,
                total: paginationAction.totalRecords,
                showSizeChanger: paginationAction.showSizeChanger || false,
                pageSizeOptions: paginationAction.pageSizeOptions,
                onChange: paginationAction.onPageChange,
                showTotal: total => {
                  if (!total) return null

                  return t('ComponentLocales:DataTable.show_total', {
                    from: (paginationAction.currentPage - 1) * paginationAction.pageSize + 1,
                    to: Math.min(paginationAction.currentPage * paginationAction.pageSize, total),
                    total,
                  })
                },
              }
        }
        bordered={bordered}
        loading={loading}
        scroll={{ x: 'max-content' }}
        rowSelection={
          selectionAction
            ? {
                fixed: 'left', // Cố định cột checkbox ở bên trái
                getCheckboxProps(record) {
                  return {
                    // Nếu có hàm disabled thì sẽ disable checkbox dựa trên logic của hàm đó, nếu không thì mặc định là false (không disable)
                    disabled: selectionAction.disabled ? selectionAction.disabled(record) : false,
                  }
                },
                selectedRowKeys: selectionAction.selectedRowKeys,
                onChange: selectionAction.onChange as TableRowSelection<RecordType>['onChange'],
                renderCell(_value, _record, index, originNode) {
                  if (autoIndex && paginationAction) {
                    const recordIndex =
                      paginationAction?.currentPage * (paginationAction?.currentPage - 1) +
                      index +
                      1
                    return (
                      <div className="DataTable__indexCell">
                        {originNode} {recordIndex}
                      </div>
                    )
                  } else {
                    return originNode
                  }
                },
              }
            : undefined
        }
        className="DataTable__inner w-full"
      />
    </Space>
  )
}
