import { useDetail, useRequest } from '@/hooks'
import {
  CommercialOrderStatus,
  FulfillmentProjection,
  OrderPaymentMethod,
  OrderPaymentProjection,
  OrderProductType,
  OrderStatus,
} from '@/models/Order'
import type { Order } from '@/models/Order'
import { getOrderDetail, refundOrder } from '@/services/Order'
import { isApiResponseError } from '@/utils/apiResponse'
import { formatOrderAmount } from '@/utils/formatOrderAmount'
import { formatTimestamp } from '@/utils/time'
import { Alert, App, Button, Card, Descriptions, Modal, Space, Spin, Tag, Typography } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface Props {
  id?: string
}

const statusColorMap: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'processing',
  [OrderStatus.COMPLETED]: 'success',
  [OrderStatus.CANCELLED]: 'error',
  [OrderStatus.REFUNDED]: 'warning',
}

const statusLabelMap: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'Chờ xử lý',
  [OrderStatus.COMPLETED]: 'Hoàn tất',
  [OrderStatus.CANCELLED]: 'Đã hủy',
  [OrderStatus.REFUNDED]: 'Hoàn tiền',
}

const productTypeLabelMap: Record<OrderProductType, string> = {
  [OrderProductType.COURSE]: 'Khoá học',
  [OrderProductType.DOCUMENT]: 'Tài liệu',
}

const paymentMethodLabelMap: Record<OrderPaymentMethod, string> = {
  [OrderPaymentMethod.SEPAY]: 'SePay',
  [OrderPaymentMethod.FREE]: 'Miễn phí',
}

const canonicalStatusLabel: Record<CommercialOrderStatus, string> = {
  [CommercialOrderStatus.OPEN]: 'Đang mở',
  [CommercialOrderStatus.CONFIRMED]: 'Đã xác nhận',
  [CommercialOrderStatus.CANCELLED]: 'Đã hủy',
  [CommercialOrderStatus.EXPIRED]: 'Hết hạn',
}

const paymentStatusLabel: Record<OrderPaymentProjection, string> = {
  [OrderPaymentProjection.NOT_REQUIRED]: 'Không cần thanh toán',
  [OrderPaymentProjection.UNPAID]: 'Chưa thanh toán',
  [OrderPaymentProjection.PAID]: 'Đã thanh toán',
  [OrderPaymentProjection.PARTIALLY_REFUNDED]: 'Hoàn một phần',
  [OrderPaymentProjection.REFUNDED]: 'Đã hoàn tiền',
  [OrderPaymentProjection.REVIEW_REQUIRED]: 'Cần kiểm tra',
}

const fulfillmentStatusLabel: Record<FulfillmentProjection, string> = {
  [FulfillmentProjection.NOT_STARTED]: 'Chưa bắt đầu',
  [FulfillmentProjection.PENDING]: 'Đang cấp quyền',
  [FulfillmentProjection.FULFILLED]: 'Đã cấp quyền',
  [FulfillmentProjection.FAILED]: 'Cấp quyền lỗi',
  [FulfillmentProjection.REVOKED]: 'Đã thu hồi',
}

export const OrderDetail = ({ id }: Props) => {
  const navigate = useNavigate()
  const { message, modal } = App.useApp()
  const [metadataModalOpen, setMetadataModalOpen] = useState(false)

  const fetchDetail = useCallback((detailId: string) => getOrderDetail({ id: detailId }), [])
  const detailRequest = useDetail(fetchDetail)
  const { execute: executeDetail, data: order, isLoading } = detailRequest

  const refundRequest = useRequest((input: { id: string }) => refundOrder(input))

  useEffect(() => {
    if (!id) return
    void executeDetail(id)
  }, [executeDetail, id])

  useEffect(() => {
    if (detailRequest.error) {
      void message.error('Không thể tải chi tiết đơn hàng. Vui lòng thử lại.')
    }
  }, [detailRequest.error, message])

  const handleRefund = useCallback(
    (currentOrder: Order) => {
      void modal.confirm({
        title: 'Xác nhận hoàn tiền',
        content: (
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Alert
              type="warning"
              showIcon
              message="Quy trình hoàn tiền thủ công"
              description="Hệ thống chưa tự động chuyển tiền. Bạn cần thực hiện hoàn tiền cho khách qua kênh thanh toán bên ngoài, sau đó xác nhận tại đây để đánh dấu trạng thái đơn."
            />
            <Typography.Text>
              Xác nhận đánh dấu hoàn tiền đơn{' '}
              <Typography.Text strong>{currentOrder.orderCode}</Typography.Text>? Hành động này sẽ
              thu hồi quyền truy cập của người dùng.
            </Typography.Text>
          </Space>
        ),
        width: 640,
        okText: 'Đã hoàn tiền',
        okButtonProps: { danger: true },
        cancelText: 'Hủy',
        onOk: async () => {
          try {
            await refundRequest.execute({ id: currentOrder.id })
            void message.success('Hoàn tiền thành công.')
            void executeDetail(currentOrder.id)
          } catch (err) {
            if (isApiResponseError(err)) {
              void message.error(err.message)
            } else {
              void message.error('Hoàn tiền thất bại. Vui lòng thử lại.')
            }
          }
        },
      })
    },
    [executeDetail, message, modal, refundRequest],
  )

  return (
    <Card>
      <Space orientation="vertical" size={20} style={{ width: '100%' }}>
        <div>
          <Typography.Title level={3} style={{ marginBottom: 4 }}>
            Chi tiết đơn hàng
          </Typography.Title>
        </div>

        {order && (
          <Spin spinning={isLoading}>
            <Descriptions bordered column={1} size="middle">
              <Descriptions.Item label="Mã đơn">
                <strong>{order.orderCode}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="Khách hàng">
                {order.user?.fullName || '-'}
                {order.user?.email ? ` (${order.user.email})` : ''}
              </Descriptions.Item>
              <Descriptions.Item label="Loại sản phẩm">
                {productTypeLabelMap[order.productType]}
              </Descriptions.Item>
              <Descriptions.Item label="Sản phẩm">{order.productName}</Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color={statusColorMap[order.status]}>{statusLabelMap[order.status]}</Tag>
              </Descriptions.Item>
              {order.commercialStatus && (
                <Descriptions.Item label="Trạng thái thương mại">
                  <Tag>{canonicalStatusLabel[order.commercialStatus]}</Tag>
                </Descriptions.Item>
              )}
              {order.paymentStatus && (
                <Descriptions.Item label="Trạng thái thanh toán canonical">
                  <Tag
                    color={
                      order.paymentStatus === OrderPaymentProjection.PAID ? 'success' : 'processing'
                    }
                  >
                    {paymentStatusLabel[order.paymentStatus]}
                  </Tag>
                </Descriptions.Item>
              )}
              {order.fulfillmentStatus && (
                <Descriptions.Item label="Trạng thái cấp quyền">
                  <Tag
                    color={
                      order.fulfillmentStatus === FulfillmentProjection.FULFILLED
                        ? 'success'
                        : 'processing'
                    }
                  >
                    {fulfillmentStatusLabel[order.fulfillmentStatus]}
                  </Tag>
                </Descriptions.Item>
              )}
              <Descriptions.Item label="Phương thức thanh toán">
                {paymentMethodLabelMap[order.paymentMethod]}
              </Descriptions.Item>
              <Descriptions.Item label="Tổng tiền">
                {formatOrderAmount(order.totalMinor, order.totalAmount)} {order.currency}
              </Descriptions.Item>
              <Descriptions.Item label="Thanh toán lúc">
                {order.paidAt ? (
                  formatTimestamp(order.paidAt)
                ) : (
                  <Typography.Text type="secondary">-</Typography.Text>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Provider transaction ID">
                {order.providerTransactionId || (
                  <Typography.Text type="secondary">-</Typography.Text>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Metadata thanh toán">
                {order.paymentMetadata ? (
                  <>
                    <Button size="small" onClick={() => setMetadataModalOpen(true)}>
                      Xem metadata
                    </Button>
                    <Modal
                      title="Payment Metadata"
                      open={metadataModalOpen}
                      onCancel={() => setMetadataModalOpen(false)}
                      footer={<Button onClick={() => setMetadataModalOpen(false)}>Đóng</Button>}
                      width={700}
                      centered
                    >
                      <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: 12 }}>
                        {JSON.stringify(order.paymentMetadata, null, 2)}
                      </pre>
                    </Modal>
                  </>
                ) : (
                  <Typography.Text type="secondary">-</Typography.Text>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Tạo lúc">
                {formatTimestamp(order.createdAt)}
              </Descriptions.Item>
              <Descriptions.Item label="Cập nhật lúc">
                {formatTimestamp(order.updatedAt)}
              </Descriptions.Item>
            </Descriptions>
          </Spin>
        )}

        <Space>
          {order?.status === OrderStatus.COMPLETED && (
            <Button danger onClick={() => handleRefund(order)}>
              Hoàn tiền
            </Button>
          )}
          <Button onClick={() => navigate('/orders')}>Quay lại</Button>
        </Space>
      </Space>
    </Card>
  )
}
