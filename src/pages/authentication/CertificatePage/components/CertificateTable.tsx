import { DataTable } from '@/components/DataTable/DataTable'
import { useList, useRequest } from '@/hooks'
import type { Certificate } from '@/models/Certificate'
import { PhysicalCertificateStatus } from '@/models/Certificate'
import { deliverCertificate, listCertificate, shipCertificate } from '@/services/Certificate'
import { isApiResponseError } from '@/utils/apiResponse'
import { formatTimestamp } from '@/utils/time'
import { App, Button, Card, Popconfirm, Select, Space, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'

const physicalStatusColors: Record<PhysicalCertificateStatus, string> = {
  [PhysicalCertificateStatus.NONE]: 'default',
  [PhysicalCertificateStatus.PENDING]: 'orange',
  [PhysicalCertificateStatus.SHIPPED]: 'blue',
  [PhysicalCertificateStatus.DELIVERED]: 'green',
}

const physicalStatusLabels: Record<PhysicalCertificateStatus, string> = {
  [PhysicalCertificateStatus.NONE]: 'Không có',
  [PhysicalCertificateStatus.PENDING]: 'Chờ giao',
  [PhysicalCertificateStatus.SHIPPED]: 'Đã gửi',
  [PhysicalCertificateStatus.DELIVERED]: 'Đã nhận',
}

interface ListParams {
  page: number
  pageSize: number
  physicalStatus?: PhysicalCertificateStatus
}

export const CertificateTable = () => {
  const { message } = App.useApp()

  const { items, data: listData, isLoading, params, setParams, refresh } = useList<
    Certificate,
    ListParams
  >(
    currentParams => {
      const searcher: Record<string, unknown> = {}
      if (currentParams.physicalStatus)
        searcher.physicalStatus = { operator: 'eq', value: currentParams.physicalStatus }

      return listCertificate({
        page: currentParams.page,
        pageSize: currentParams.pageSize,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        searcher: Object.keys(searcher).length > 0 ? (searcher as any) : undefined,
        sorter: { field: 'issuedAt', direction: 'desc' },
      })
    },
    { initialParams: { page: 1, pageSize: 20 } },
  )

  const shipRequest = useRequest((id: string) => shipCertificate({ id }))
  const deliverRequest = useRequest((id: string) => deliverCertificate({ id }))

  const handleShip = async (id: string) => {
    try {
      await shipRequest.execute(id)
      void message.success('Đã đánh dấu đã gửi')
      refresh()
    } catch (err) {
      void message.error(isApiResponseError(err) ? err.message : 'Có lỗi xảy ra')
    }
  }

  const handleDeliver = async (id: string) => {
    try {
      await deliverRequest.execute(id)
      void message.success('Đã đánh dấu đã nhận')
      refresh()
    } catch (err) {
      void message.error(isApiResponseError(err) ? err.message : 'Có lỗi xảy ra')
    }
  }

  const columns: ColumnsType<Certificate> = [
    {
      title: 'Mã chứng chỉ',
      dataIndex: 'certificateCode',
      key: 'certificateCode',
      render: (v: string) => <Typography.Text code copyable>{v}</Typography.Text>,
    },
    {
      title: 'User ID',
      dataIndex: 'userId',
      key: 'userId',
      width: 160,
      render: (v: string) => (
        <Typography.Text code style={{ fontSize: 11 }}>
          {v.slice(0, 8)}...
        </Typography.Text>
      ),
    },
    {
      title: 'Ngày cấp',
      dataIndex: 'issuedAt',
      key: 'issuedAt',
      width: 160,
      render: (v: string) => formatTimestamp(v),
    },
    {
      title: 'Chứng chỉ vật lý',
      dataIndex: 'physicalStatus',
      key: 'physicalStatus',
      width: 130,
      render: (v: PhysicalCertificateStatus) => (
        <Tag color={physicalStatusColors[v]}>{physicalStatusLabels[v]}</Tag>
      ),
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space>
          {record.physicalStatus === PhysicalCertificateStatus.PENDING && (
            <Popconfirm
              title="Đánh dấu đã gửi?"
              onConfirm={() => handleShip(record.id)}
              okText="Xác nhận"
              cancelText="Hủy"
            >
              <Button size="small" type="primary">
                Đánh dấu đã gửi
              </Button>
            </Popconfirm>
          )}
          {record.physicalStatus === PhysicalCertificateStatus.SHIPPED && (
            <Popconfirm
              title="Đánh dấu đã nhận?"
              onConfirm={() => handleDeliver(record.id)}
              okText="Xác nhận"
              cancelText="Hủy"
            >
              <Button size="small" type="primary" ghost>
                Đánh dấu đã nhận
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ]

  return (
    <Card>
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <Space>
          <Select
            allowClear
            placeholder="Trạng thái vật lý"
            style={{ width: 160 }}
            onChange={v => setParams(p => ({ ...p, physicalStatus: v || undefined, page: 1 }))}
            options={Object.values(PhysicalCertificateStatus).map(s => ({
              label: physicalStatusLabels[s],
              value: s,
            }))}
          />
        </Space>

        <DataTable<Certificate>
          title="Danh sách Chứng chỉ"
          columns={columns}
          dataSource={items}
          loading={isLoading}
          paginationAction={{
            currentPage: listData?.pagination?.page ?? params.page,
            pageSize: listData?.pagination?.pageSize ?? params.pageSize,
            totalRecords: listData?.pagination?.totalItems ?? 0,
            showSizeChanger: true,
            pageSizeOptions: [20, 50, 100],
            onPageChange(page, pageSize) {
              setParams(p => ({ ...p, page, pageSize }))
            },
          }}
        />
      </Space>
    </Card>
  )
}
