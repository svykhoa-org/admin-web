import { useDetail, useRequest } from '@/hooks'
import { DocumentLicenseStatus } from '@/models/DocumentLicense'
import {
  getDocumentLicenseDetail,
  revokeDocumentLicense,
  unrevokeDocumentLicense,
} from '@/services/DocumentLicense'
import { isApiResponseError } from '@/utils/apiResponse'
import { formatTimestamp } from '@/utils/time'
import { App, Button, Card, Descriptions, Input, Space, Spin, Tag, Typography } from 'antd'
import { useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

interface Props {
  id?: string
}

const statusColorMap: Record<DocumentLicenseStatus, string> = {
  [DocumentLicenseStatus.ACTIVE]: 'success',
  [DocumentLicenseStatus.REVOKED]: 'error',
}

const statusLabelMap: Record<DocumentLicenseStatus, string> = {
  [DocumentLicenseStatus.ACTIVE]: 'Đang hiệu lực',
  [DocumentLicenseStatus.REVOKED]: 'Đã thu hồi',
}

export const DocumentLicenseDetail = ({ id }: Props) => {
  const navigate = useNavigate()
  const { message, modal } = App.useApp()

  const fetchDetail = useCallback(
    (detailId: string) => getDocumentLicenseDetail({ id: detailId }),
    [],
  )
  const detailRequest = useDetail(fetchDetail)
  const revokeRequest = useRequest((licenseId: string, reason: string) =>
    revokeDocumentLicense({ id: licenseId, reason }),
  )
  const unrevokeRequest = useRequest((licenseId: string) =>
    unrevokeDocumentLicense({ id: licenseId }),
  )
  const { execute: executeDetail, data: detailData, isLoading } = detailRequest

  useEffect(() => {
    if (!id) return
    void executeDetail(id)
  }, [executeDetail, id])

  useEffect(() => {
    if (detailRequest.error) {
      void message.error('Không thể tải chi tiết license. Vui lòng thử lại.')
    }
  }, [detailRequest.error, message])

  const handleRevoke = async (reason: string) => {
    if (!id) return

    try {
      await revokeRequest.execute(id, reason)
      void message.success('Thu hồi license thành công')
      await executeDetail(id)
    } catch (error) {
      const errorMessage = isApiResponseError(error)
        ? error.message
        : 'Không thể thu hồi license. Vui lòng thử lại.'
      void message.error(errorMessage)
    }
  }

  const openRevokeModal = () => {
    if (!detailData) return

    let reasonValue = ''

    modal.confirm({
      title: 'Thu hồi license',
      content: (
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <Typography.Text>Nhập lý do thu hồi license:</Typography.Text>
          <Input.TextArea
            rows={4}
            placeholder="Ví dụ: Vi phạm điều khoản sử dụng"
            onChange={event => {
              reasonValue = event.target.value
            }}
          />
        </Space>
      ),
      okText: 'Thu hồi',
      okButtonProps: { danger: true },
      cancelText: 'Hủy',
      width: 560,
      onOk: async () => {
        const reason = reasonValue.trim()
        if (!reason) {
          void message.error('Vui lòng nhập lý do thu hồi')
          return Promise.reject(new Error('Reason is required'))
        }
        await handleRevoke(reason)
      },
    })
  }

  const handleUnrevoke = async () => {
    if (!id) return

    try {
      await unrevokeRequest.execute(id)
      void message.success('Hủy thu hồi license thành công')
      await executeDetail(id)
    } catch (error) {
      const errorMessage = isApiResponseError(error)
        ? error.message
        : 'Không thể hủy thu hồi license. Vui lòng thử lại.'
      void message.error(errorMessage)
    }
  }

  return (
    <Card>
      <Space orientation="vertical" size={20} style={{ width: '100%' }}>
        <div>
          <Typography.Title level={3} style={{ marginBottom: 4 }}>
            Chi tiết license tài liệu
          </Typography.Title>
        </div>

        {detailData && (
          <Spin spinning={isLoading || revokeRequest.isLoading || unrevokeRequest.isLoading}>
            <Descriptions bordered column={1} size="middle">
              <Descriptions.Item label="User">
                {detailData.user?.fullName || '-'}
                {detailData.user?.email ? ` (${detailData.user.email})` : ''}
              </Descriptions.Item>
              <Descriptions.Item label="Tài liệu">
                {detailData.document?.title || detailData.documentId}
                {detailData.document?.slug ? ` (${detailData.document.slug})` : ''}
              </Descriptions.Item>
              <Descriptions.Item label="Order ID">{detailData.documentOrderId}</Descriptions.Item>
              <Descriptions.Item label="Trạng thái">
                <Tag color={statusColorMap[detailData.status]}>
                  {statusLabelMap[detailData.status]}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Thu hồi lúc">
                {detailData.revokedAt ? (
                  formatTimestamp(detailData.revokedAt)
                ) : (
                  <Typography.Text type="secondary">-</Typography.Text>
                )}
              </Descriptions.Item>
              <Descriptions.Item label="Thu hồi bởi">
                {detailData.revokedBy || <Typography.Text type="secondary">-</Typography.Text>}
              </Descriptions.Item>
              <Descriptions.Item label="Lý do thu hồi">
                {detailData.revokeReason || <Typography.Text type="secondary">-</Typography.Text>}
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
          {detailData?.status === DocumentLicenseStatus.ACTIVE && (
            <Button danger onClick={openRevokeModal} loading={revokeRequest.isLoading}>
              Thu hồi
            </Button>
          )}
          {detailData?.status === DocumentLicenseStatus.REVOKED && (
            <Button type="primary" onClick={handleUnrevoke} loading={unrevokeRequest.isLoading}>
              Hủy thu hồi
            </Button>
          )}
          <Button onClick={() => navigate('/document-licenses', { replace: true })}>
            Quay lại
          </Button>
        </Space>
      </Space>
    </Card>
  )
}
