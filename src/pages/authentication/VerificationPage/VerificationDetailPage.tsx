import type { DoctorVerificationDetail } from '@/models/DoctorVerification'
import { VerificationStatus } from '@/models/DoctorVerification'
import { getVerificationDetail, rejectDoctor, verifyDoctor } from '@/services/Verification'
import { isApiResponseError } from '@/utils/apiResponse'
import { formatTimestamp } from '@/utils/time'
import { CheckOutlined, CloseOutlined, LinkOutlined } from '@ant-design/icons'
import { App, Button, Card, Descriptions, Input, Modal, Space, Spin, Tag, Typography } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

const statusColors: Record<VerificationStatus, string> = {
  [VerificationStatus.PENDING]: 'gold',
  [VerificationStatus.VERIFIED]: 'green',
  [VerificationStatus.REJECTED]: 'red',
}
const statusLabels: Record<VerificationStatus, string> = {
  [VerificationStatus.PENDING]: 'Chờ duyệt',
  [VerificationStatus.VERIFIED]: 'Đã xác minh',
  [VerificationStatus.REJECTED]: 'Từ chối',
}

export const VerificationDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { message, modal } = App.useApp()

  const [data, setData] = useState<DoctorVerificationDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [reason, setReason] = useState('')

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      setData(await getVerificationDetail({ id }))
    } catch (error) {
      void message.error(isApiResponseError(error) ? error.message : 'Không thể tải hồ sơ')
    } finally {
      setLoading(false)
    }
  }, [id, message])

  useEffect(() => {
    void load()
  }, [load])

  const onVerify = () => {
    if (!id) return
    modal.confirm({
      title: 'Xác minh bác sĩ này?',
      content: 'Người dùng sẽ được cấp quyền truy cập các khoá học dành cho bác sĩ đã xác minh.',
      okText: 'Xác minh',
      cancelText: 'Huỷ',
      onOk: async () => {
        setSubmitting(true)
        try {
          await verifyDoctor(id)
          void message.success('Đã xác minh bác sĩ')
          await load()
        } catch (error) {
          void message.error(isApiResponseError(error) ? error.message : 'Có lỗi xảy ra')
        } finally {
          setSubmitting(false)
        }
      },
    })
  }

  const onReject = async () => {
    if (!id || !reason.trim()) {
      void message.warning('Vui lòng nhập lý do từ chối')
      return
    }
    setSubmitting(true)
    try {
      await rejectDoctor(id, reason.trim())
      void message.success('Đã từ chối hồ sơ')
      setRejectOpen(false)
      setReason('')
      await load()
    } catch (error) {
      void message.error(isApiResponseError(error) ? error.message : 'Có lỗi xảy ra')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 48 }}>
        <Spin />
      </div>
    )
  }
  if (!data) return null

  const v = data.verification

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card
        title={
          <Space>
            <Typography.Text strong>Hồ sơ xác minh bác sĩ</Typography.Text>
            <Tag color={statusColors[v.status]}>{statusLabels[v.status]}</Tag>
          </Space>
        }
        extra={<Button onClick={() => navigate('/verifications')}>Quay lại</Button>}
      >
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="Người dùng">
            {v.user?.fullName || '-'}
            <br />
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {v.user?.email}
            </Typography.Text>
          </Descriptions.Item>
          <Descriptions.Item label="Họ tên trên giấy phép">{v.fullNameOnLicense}</Descriptions.Item>
          <Descriptions.Item label="Số CCCD">{v.personalId}</Descriptions.Item>
          <Descriptions.Item label="Số giấy phép hành nghề">{v.licenseNumber}</Descriptions.Item>
          <Descriptions.Item label="Phạm vi hành nghề">{v.scopeOfPractice}</Descriptions.Item>
          <Descriptions.Item label="Nơi cấp">{v.issuingAuthority}</Descriptions.Item>
          <Descriptions.Item label="Ngày cấp">{v.issuedDate}</Descriptions.Item>
          <Descriptions.Item label="Ngày hết hạn">{v.expiryDate}</Descriptions.Item>
          <Descriptions.Item label="Nơi công tác">{v.workplace || '-'}</Descriptions.Item>
          <Descriptions.Item label="Học hàm/học vị">{v.academicTitle || '-'}</Descriptions.Item>
          <Descriptions.Item label="Điện thoại">{v.phone || '-'}</Descriptions.Item>
          <Descriptions.Item label="Ảnh giấy phép">
            <Button
              type="link"
              icon={<LinkOutlined />}
              href={data.licenseFileUrl}
              target="_blank"
              style={{ padding: 0 }}
            >
              Mở giấy phép
            </Button>
          </Descriptions.Item>
          {v.reviewedAt && (
            <Descriptions.Item label="Duyệt lúc">{formatTimestamp(v.reviewedAt)}</Descriptions.Item>
          )}
          {v.rejectionReason && (
            <Descriptions.Item label="Lý do từ chối" span={2}>
              <Typography.Text type="danger">{v.rejectionReason}</Typography.Text>
            </Descriptions.Item>
          )}
        </Descriptions>

        <Space style={{ marginTop: 16 }}>
          <Button
            type="primary"
            icon={<CheckOutlined />}
            loading={submitting}
            disabled={v.status === VerificationStatus.VERIFIED}
            onClick={onVerify}
          >
            Xác minh
          </Button>
          <Button
            danger
            icon={<CloseOutlined />}
            loading={submitting}
            disabled={v.status === VerificationStatus.REJECTED}
            onClick={() => setRejectOpen(true)}
          >
            Từ chối
          </Button>
        </Space>
      </Card>

      <Modal
        title="Từ chối hồ sơ"
        open={rejectOpen}
        onOk={onReject}
        confirmLoading={submitting}
        onCancel={() => setRejectOpen(false)}
        okText="Từ chối"
        cancelText="Huỷ"
        okButtonProps={{ danger: true }}
      >
        <Typography.Paragraph type="secondary">
          Lý do sẽ hiển thị cho người dùng để họ sửa và nộp lại.
        </Typography.Paragraph>
        <Input.TextArea
          rows={3}
          value={reason}
          onChange={e => setReason(e.target.value)}
          placeholder="Nhập lý do từ chối…"
        />
      </Modal>
    </Space>
  )
}
