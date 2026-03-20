import { useDetail } from '@/hooks'
import { DocumentPaymentMethod, DocumentOrderStatus } from '@/models/DocumentOrder'
import { getDocumentOrderDetail } from '@/services/DocumentOrder'
import { formatTimestamp } from '@/utils/time'
import { App, Button, Card, Descriptions, Space, Spin, Tag, Typography } from 'antd'
import { useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

interface Props {
  id?: string
}

const statusColorMap: Record<DocumentOrderStatus, string> = {
  [DocumentOrderStatus.PENDING]: 'processing',
  [DocumentOrderStatus.COMPLETED]: 'success',
  [DocumentOrderStatus.CANCELLED]: 'error',
  [DocumentOrderStatus.REFUNDED]: 'warning',
}

const statusLabelMap: Record<DocumentOrderStatus, string> = {
  [DocumentOrderStatus.PENDING]: 'Chờ xử lý',
  [DocumentOrderStatus.COMPLETED]: 'Hoàn tất',
  [DocumentOrderStatus.CANCELLED]: 'Đã hủy',
  [DocumentOrderStatus.REFUNDED]: 'Hoàn tiền',
}

const paymentMethodLabelMap: Record<DocumentPaymentMethod, string> = {
  [DocumentPaymentMethod.SEPAY]: 'SePay',
}

export const DocumentOrderDetail = ({ id }: Props) => {
  const navigate = useNavigate()
  const { message } = App.useApp()

  const fetchDetail = useCallback(
    (detailId: string) => getDocumentOrderDetail({ id: detailId }),
    [],
  )
  const detailRequest = useDetail(fetchDetail)
  const { execute: executeDetail, data: detailData, isLoading } = detailRequest

  useEffect(() => {
    if (!id) return
    void executeDetail(id)
  }, [executeDetail, id])

  useEffect(() => {
    if (detailRequest.error) {
      void message.error('Không thể tải chi tiết đơn hàng. Vui lòng thử lại.')
    }
  }, [detailRequest.error, message])

  return (
    <Card>
      <Space orientation="vertical" size={20} style={{ width: '100%' }}>
        <div>
          <Typography.Title level={3} style={{ marginBottom: 4 }}>
            Chi tiết đơn hàng tài liệu
          </Typography.Title>
        </div>

        {detailData && (
          <Spin spinning={isLoading}>
            <Descriptions bordered column={1} size="middle">
              <Descriptions.Item label="Mã đơn">{detailData.orderCode}</Descriptions.Item>
              <Descriptions.Item label="Khách hàng">
                {detailData.user?.fullName || '-'}
                {detailData.user?.email ? ` (${detailData.user.email})` : ''}
              </Descriptions.Item>
              <Descriptions.Item label="Tài liệu">
                {detailData.document?.title || detailData.documentId}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color={statusColorMap[detailData.status]}>
                  {statusLabelMap[detailData.status]}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Phương thức thanh toán">
                {paymentMethodLabelMap[detailData.paymentMethod]}
              </Descriptions.Item>
              <Descriptions.Item label="Tổng tiền">
                {detailData.totalAmount.toLocaleString('vi-VN')} {detailData.currency}
              </Descriptions.Item>
              <Descriptions.Item label="Thanh toán lúc">
                {detailData.paidAt ? (
                  formatTimestamp(detailData.paidAt)
                ) : (
                  <Typography.Text type="secondary">-</Typography.Text>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Provider transaction ID">
                {detailData.providerTransactionId || (
                  <Typography.Text type="secondary">-</Typography.Text>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Metadata thanh toán">
                {detailData.paymentMetadata ? (
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                    {JSON.stringify(detailData.paymentMetadata, null, 2)}
                  </pre>
                ) : (
                  <Typography.Text type="secondary">-</Typography.Text>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Tạo lúc">
                {formatTimestamp(detailData.createdAt)}
              </Descriptions.Item>
              <Descriptions.Item label="Cập nhật lúc">
                {formatTimestamp(detailData.updatedAt)}
              </Descriptions.Item>
            </Descriptions>
          </Spin>
        )}

        <Space>
          <Button onClick={() => navigate('/document-orders', { replace: true })}>Quay lại</Button>
        </Space>
      </Space>
    </Card>
  )
}
