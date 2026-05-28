import type { FileResource } from '@/models/FileResource'
import { useSiteSettingsStore } from '@/store/siteSettingsStore'
import { isApiResponseError } from '@/utils/apiResponse'
import { App, Button, Col, Form, Input, Row, Typography } from 'antd'
import { useEffect, useState } from 'react'
import { UploadSingleImage } from '@/components/Upload/UploadSingleImage'

const { Title } = Typography
const { TextArea } = Input

// ─── Types ────────────────────────────────────────────────────────────────────

interface FormValues {
  siteName?: string
  tagline?: string
  contactEmail?: string
  contactPhone?: string
  contactAddress?: string
  zaloUrl?: string
  facebookUrl?: string
  youtubeUrl?: string
  tiktokUrl?: string
  instagramUrl?: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SiteSettingsPanel() {
  const { message } = App.useApp()
  const [form] = Form.useForm<FormValues>()

  const { settings, isLoading, isSaving, fetchSettings, saveSettings } = useSiteSettingsStore()

  const [logoId, setLogoId] = useState<string | null>(null)
  const [faviconId, setFaviconId] = useState<string | null>(null)
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | undefined>()
  const [faviconPreviewUrl, setFaviconPreviewUrl] = useState<string | undefined>()

  // Fetch on mount if not yet loaded
  useEffect(() => {
    if (settings === null) {
      void fetchSettings()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync form when settings load
  useEffect(() => {
    if (!settings) return

    form.setFieldsValue({
      siteName: settings.siteName ?? undefined,
      tagline: settings.tagline ?? undefined,
      contactEmail: settings.contactEmail ?? undefined,
      contactPhone: settings.contactPhone ?? undefined,
      contactAddress: settings.contactAddress ?? undefined,
      zaloUrl: settings.zaloUrl ?? undefined,
      facebookUrl: settings.facebookUrl ?? undefined,
      youtubeUrl: settings.youtubeUrl ?? undefined,
      tiktokUrl: settings.tiktokUrl ?? undefined,
      instagramUrl: settings.instagramUrl ?? undefined,
    })

    setLogoId(settings.logoId)
    setFaviconId(settings.faviconId)
    setLogoPreviewUrl(settings.logoUrl ?? undefined)
    setFaviconPreviewUrl(settings.faviconUrl ?? undefined)
  }, [settings, form])

  function handleLogoSuccess(resource: FileResource) {
    setLogoId(resource.id)
    if (resource.url) {
      setLogoPreviewUrl(resource.url)
    }
  }

  function handleFaviconSuccess(resource: FileResource) {
    setFaviconId(resource.id)
    if (resource.url) {
      setFaviconPreviewUrl(resource.url)
    }
  }

  async function handleSave() {
    try {
      const rawValues = await form.validateFields()
      // Strip empty strings so they don't fail @IsUrl()/@IsEmail() validators
      const values = Object.fromEntries(
        Object.entries(rawValues).map(([k, v]) => [k, v === '' ? undefined : v]),
      ) as typeof rawValues
      await saveSettings({
        ...values,
        logoId: logoId ?? undefined,
        faviconId: faviconId ?? undefined,
      })
      void message.success('Đã lưu cài đặt thành công')
    } catch (err) {
      if (err && typeof err === 'object' && 'errorFields' in err) {
        // Ant Design validation error — fields will show inline errors
        return
      }
      const msg = isApiResponseError(err) ? err.message : 'Lưu thất bại. Vui lòng thử lại.'
      void message.error(msg)
    }
  }

  const disabled = isLoading

  return (
    <Form form={form} layout="vertical" disabled={disabled}>
      {/* ── Brand ── */}
      <Title level={5} style={{ marginBottom: 16, marginTop: 0 }}>
        Thương hiệu
      </Title>

      <Form.Item label="Tên trang web" name="siteName">
        <Input maxLength={100} placeholder="Ví dụ: Sức Vóc Khỏe" />
      </Form.Item>

      <Form.Item label="Khẩu hiệu" name="tagline">
        <Input maxLength={255} placeholder="Ví dụ: Sống khỏe mỗi ngày" />
      </Form.Item>

      <Row gutter={24} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Form.Item label="Logo" style={{ marginBottom: 0 }}>
            {logoPreviewUrl && (
              <img
                src={logoPreviewUrl}
                alt="Logo"
                style={{
                  maxHeight: 64,
                  maxWidth: '100%',
                  marginBottom: 8,
                  borderRadius: 4,
                  objectFit: 'contain',
                  display: 'block',
                  border: '1px solid #f0f0f0',
                }}
              />
            )}
            <UploadSingleImage
              onSuccess={handleLogoSuccess}
              disabled={disabled}
              size="sm"
              maxSizeMB={2}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="Favicon" style={{ marginBottom: 0 }}>
            {faviconPreviewUrl && (
              <img
                src={faviconPreviewUrl}
                alt="Favicon"
                style={{
                  maxHeight: 64,
                  maxWidth: '100%',
                  marginBottom: 8,
                  borderRadius: 4,
                  objectFit: 'contain',
                  display: 'block',
                  border: '1px solid #f0f0f0',
                }}
              />
            )}
            <UploadSingleImage
              onSuccess={handleFaviconSuccess}
              disabled={disabled}
              size="sm"
              maxSizeMB={1}
            />
          </Form.Item>
        </Col>
      </Row>

      {/* ── Contact ── */}
      <Title level={5} style={{ marginBottom: 16 }}>
        Liên hệ
      </Title>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="Email" name="contactEmail">
            <Input placeholder="contact@example.com" />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="Điện thoại" name="contactPhone">
            <Input placeholder="0123 456 789" />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item label="Địa chỉ" name="contactAddress">
        <TextArea rows={2} placeholder="Số nhà, đường, quận, thành phố..." />
      </Form.Item>

      <Form.Item label="Zalo URL" name="zaloUrl">
        <Input placeholder="https://zalo.me/..." />
      </Form.Item>

      {/* ── Social ── */}
      <Title level={5} style={{ marginBottom: 16 }}>
        Mạng xã hội
      </Title>

      <Row gutter={16}>
        <Col span={12}>
          <Form.Item label="Facebook" name="facebookUrl">
            <Input placeholder="https://facebook.com/..." />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="YouTube" name="youtubeUrl">
            <Input placeholder="https://youtube.com/..." />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="TikTok" name="tiktokUrl">
            <Input placeholder="https://tiktok.com/..." />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="Instagram" name="instagramUrl">
            <Input placeholder="https://instagram.com/..." />
          </Form.Item>
        </Col>
      </Row>

      {/* ── Save button ── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
        <Button
          type="primary"
          loading={isSaving}
          disabled={disabled}
          onClick={() => void handleSave()}
        >
          Lưu thay đổi
        </Button>
      </div>
    </Form>
  )
}
