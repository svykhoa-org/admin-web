import type { DoctorVerificationDetail } from '@/models/DoctorVerification'
import { VerificationStatus } from '@/models/DoctorVerification'
import { rejectDoctor, verifyDoctor } from '@/services/Verification'
import { getApiErrorMessage } from '@/utils/apiResponse'
import { formatTimestamp } from '@/utils/time'
import {
  CheckOutlined,
  CloseOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  LinkOutlined,
} from '@ant-design/icons'
import { App, Button, Descriptions, Image, Input, Modal, Space, Tag, Typography } from 'antd'
import { useState } from 'react'

const VERIFICATION_STATUS_COLOR: Record<VerificationStatus, string> = {
  [VerificationStatus.PENDING]: 'gold',
  [VerificationStatus.VERIFIED]: 'green',
  [VerificationStatus.REJECTED]: 'red',
}

const VERIFICATION_STATUS_LABEL: Record<VerificationStatus, string> = {
  [VerificationStatus.PENDING]: 'Chờ duyệt',
  [VerificationStatus.VERIFIED]: 'Đã xác minh',
  [VerificationStatus.REJECTED]: 'Từ chối',
}

const mask = (value: string) => `••••${value.slice(-4)}`

// Identity numbers stay hidden until the reviewer explicitly reveals them.
// UI only — access to the data itself is gated by the `verification` permission.
const SensitiveValue = ({ value }: { value?: string | null }) => {
  const [revealed, setRevealed] = useState(false)
  if (!value) return <>-</>
  return (
    <Space size={4}>
      <Typography.Text copyable={revealed ? { text: value } : false}>
        {revealed ? value : mask(value)}
      </Typography.Text>
      <Button
        type="text"
        size="small"
        aria-label={revealed ? 'Ẩn' : 'Hiện'}
        icon={revealed ? <EyeInvisibleOutlined /> : <EyeOutlined />}
        onClick={() => setRevealed(current => !current)}
      />
    </Space>
  )
}

const LicenseFile = ({ url }: { url: string }) => {
  const [isImage, setIsImage] = useState(true)
  const link = (
    <Button type="link" icon={<LinkOutlined />} href={url} target="_blank" style={{ padding: 0 }}>
      Mở giấy phép
    </Button>
  )
  if (!isImage) return link
  return (
    <Space orientation="vertical" size={4}>
      <Image
        src={url}
        width={160}
        className="rounded-lg"
        alt="Ảnh giấy phép hành nghề"
        onError={() => setIsImage(false)}
      />
      {link}
    </Space>
  )
}

interface Props {
  data: DoctorVerificationDetail
  onChanged: () => void | Promise<void>
  showUser?: boolean
}

// Shared by the verification detail page and the admin user detail page.
export const VerificationReview = ({ data, onChanged, showUser = true }: Props) => {
  const { message, modal } = App.useApp()
  const [submitting, setSubmitting] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [reason, setReason] = useState('')
  const v = data.verification

  const onVerify = () => {
    modal.confirm({
      title: 'Xác minh bác sĩ này?',
      content: 'Người dùng sẽ được cấp quyền truy cập các khoá học dành cho bác sĩ đã xác minh.',
      okText: 'Xác minh',
      cancelText: 'Huỷ',
      onOk: async () => {
        setSubmitting(true)
        try {
          await verifyDoctor(v.id)
          void message.success('Đã xác minh bác sĩ')
          await onChanged()
        } catch (error) {
          void message.error(getApiErrorMessage(error, 'Có lỗi xảy ra'))
        } finally {
          setSubmitting(false)
        }
      },
    })
  }

  const onReject = async () => {
    if (!reason.trim()) {
      void message.warning('Vui lòng nhập lý do từ chối')
      return
    }
    setSubmitting(true)
    try {
      await rejectDoctor(v.id, reason.trim())
      void message.success('Đã từ chối hồ sơ')
      setRejectOpen(false)
      setReason('')
      await onChanged()
    } catch (error) {
      void message.error(getApiErrorMessage(error, 'Có lỗi xảy ra'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <Descriptions column={{ xs: 1, sm: 1, md: 2, lg: 2, xl: 2, xxl: 2 }} bordered size="small">
        {showUser && (
          <Descriptions.Item label="Người dùng">
            {v.user?.fullName || '-'}
            <br />
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {v.user?.email}
            </Typography.Text>
          </Descriptions.Item>
        )}
        <Descriptions.Item label="Trạng thái hồ sơ">
          <Tag color={VERIFICATION_STATUS_COLOR[v.status]}>
            {VERIFICATION_STATUS_LABEL[v.status]}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label="Họ tên trên giấy phép">{v.fullNameOnLicense}</Descriptions.Item>
        <Descriptions.Item label="Số CCCD">
          <SensitiveValue value={v.personalId} />
        </Descriptions.Item>
        <Descriptions.Item label="Số giấy phép hành nghề">
          <SensitiveValue value={v.licenseNumber} />
        </Descriptions.Item>
        <Descriptions.Item label="Phạm vi hành nghề">{v.scopeOfPractice}</Descriptions.Item>
        <Descriptions.Item label="Nơi cấp">{v.issuingAuthority}</Descriptions.Item>
        <Descriptions.Item label="Ngày cấp">{v.issuedDate}</Descriptions.Item>
        <Descriptions.Item label="Ngày hết hạn">{v.expiryDate}</Descriptions.Item>
        <Descriptions.Item label="Nơi công tác">{v.workplace || '-'}</Descriptions.Item>
        <Descriptions.Item label="Học hàm/học vị">{v.academicTitle || '-'}</Descriptions.Item>
        <Descriptions.Item label="Điện thoại">
          <SensitiveValue value={v.phone} />
        </Descriptions.Item>
        <Descriptions.Item label="Nộp lúc">{formatTimestamp(v.updatedAt)}</Descriptions.Item>
        {v.reviewedAt && (
          <Descriptions.Item label="Duyệt lúc">{formatTimestamp(v.reviewedAt)}</Descriptions.Item>
        )}
        {v.rejectionReason && (
          <Descriptions.Item label="Lý do từ chối" span={2}>
            <Typography.Text type="danger">{v.rejectionReason}</Typography.Text>
          </Descriptions.Item>
        )}
      </Descriptions>

      <div className="mt-4">
        <Typography.Text type="secondary">Ảnh giấy phép</Typography.Text>
        <div className="mt-2">
          <LicenseFile url={data.licenseFileUrl} />
        </div>
      </div>

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
    </>
  )
}
