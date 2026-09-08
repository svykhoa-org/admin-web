import { UploadSingleImage } from '@/components/Upload'
import { BulletinCategorySelect } from '@/components/SelectionVariants'
import { useCreate, useDetail, useUpdate } from '@/hooks'
import {
  BulletinImportance,
  BulletinStatus,
  type BulletinAttachment,
  type BulletinCategory,
} from '@/models/Bulletin'
import {
  createBulletin,
  getBulletinDetail,
  listBulletinCategories,
  publishBulletin,
  unpublishBulletin,
  updateBulletin,
  uploadBulletinFile,
  type BulletinWriteInput,
} from '@/services/Bulletin'
import { isApiResponseError } from '@/utils/apiResponse'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  EyeOutlined,
  PaperClipOutlined,
  StopOutlined,
  UploadOutlined,
} from '@ant-design/icons'
import {
  App,
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Segmented,
  Space,
  Spin,
  Switch,
  Tag,
  Typography,
  Upload,
} from 'antd'
import dayjs from 'dayjs'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Controller, useForm, type SubmitErrorHandler } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import {
  BULLETIN_FORM_DEFAULT_VALUES,
  bulletinFormSchema,
  type BulletinFormSubmitValues,
  type BulletinFormValues,
} from '../schemas/bulletinFormSchema'
import { BulletinEditor } from './BulletinEditor'
import { BulletinReader } from './BulletinReader'

interface Props {
  id?: string
}

type AttachmentItem = Pick<BulletinAttachment, 'assetId' | 'originalName' | 'size' | 'url'>

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

export const BulletinForm = ({ id }: Props) => {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const isEditMode = !!id

  const [thumbUrl, setThumbUrl] = useState<string | undefined>()
  const [attachments, setAttachments] = useState<AttachmentItem[]>([])
  const [categories, setCategories] = useState<BulletinCategory[]>([])
  const [previewOpen, setPreviewOpen] = useState(false)
  const [currentStatus, setCurrentStatus] = useState<BulletinStatus>(BulletinStatus.DRAFT)
  const [isStatusLoading, setIsStatusLoading] = useState(false)

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<BulletinFormValues, unknown, BulletinFormSubmitValues>({
    resolver: zodResolver(bulletinFormSchema),
    defaultValues: BULLETIN_FORM_DEFAULT_VALUES,
  })

  const fetchDetail = useCallback((d: string) => getBulletinDetail(d), [])
  const updateById = useCallback(
    (updateId: string, payload: Partial<BulletinWriteInput>) => updateBulletin(updateId, payload),
    [],
  )
  const detailRequest = useDetail(fetchDetail)
  const createRequest = useCreate(createBulletin)
  const updateRequest = useUpdate(updateById)
  const { execute: executeDetail, data: detailData, isLoading: isDetailLoading } = detailRequest

  useEffect(() => {
    listBulletinCategories()
      .then(setCategories)
      .catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    if (isEditMode && id) void executeDetail(id)
  }, [executeDetail, id, isEditMode])

  useEffect(() => {
    if (!detailData) return
    setThumbUrl(detailData.thumbnail || undefined)
    setCurrentStatus(detailData.status)
    setAttachments(
      (detailData.attachments ?? []).map(a => ({
        assetId: a.assetId,
        originalName: a.originalName,
        size: a.size,
        url: a.url,
      })),
    )
    reset({
      title: detailData.title,
      summary: detailData.summary || undefined,
      content: detailData.content,
      thumbnailAssetId: detailData.thumbnailAssetId ?? null,
      categoryId: detailData.categoryId ?? null,
      importance: detailData.importance,
      pinnedUntil: detailData.pinnedUntil ?? null,
      expiresAt: detailData.expiresAt ?? null,
      isFeatured: detailData.isFeatured,
      featuredRank: detailData.featuredRank ?? null,
    })
  }, [detailData, reset])

  const buildPayload = (
    v: BulletinFormSubmitValues,
    status?: BulletinStatus,
  ): BulletinWriteInput => ({
    title: v.title,
    summary: v.summary?.trim() || null,
    content: v.content,
    thumbnailAssetId: v.thumbnailAssetId ?? null,
    categoryId: v.categoryId ?? null,
    importance: v.importance,
    pinnedUntil: v.pinnedUntil ?? null,
    expiresAt: v.expiresAt ?? null,
    isFeatured: v.isFeatured ?? false,
    featuredRank: v.featuredRank ?? null,
    attachmentAssetIds: attachments.map(a => a.assetId),
    ...(status ? { status } : {}),
  })

  const submit = (status: BulletinStatus) =>
    handleSubmit(async values => {
      try {
        if (isEditMode && id) {
          await updateRequest.execute(id, buildPayload(values, status))
          void message.success('Cập nhật thông báo thành công')
        } else {
          await createRequest.execute(buildPayload(values, status))
          void message.success(
            status === BulletinStatus.PUBLISHED ? 'Đăng thông báo thành công' : 'Đã lưu nháp',
          )
        }
        navigate('/bulletins', { replace: true })
      } catch (error) {
        void message.error(
          isApiResponseError(error) ? error.message : 'Có lỗi xảy ra khi lưu thông báo',
        )
      }
    }, onInvalid)

  const onInvalid: SubmitErrorHandler<BulletinFormValues> = () =>
    void message.warning('Vui lòng kiểm tra lại các trường bắt buộc.')

  const handleToggleStatus = async () => {
    if (!id) return
    setIsStatusLoading(true)
    try {
      const updated =
        currentStatus === BulletinStatus.PUBLISHED
          ? await unpublishBulletin(id)
          : await publishBulletin(id)
      setCurrentStatus(updated.status)
      void message.success(
        updated.status === BulletinStatus.PUBLISHED ? 'Đã đăng' : 'Đã chuyển về nháp',
      )
    } catch (error) {
      void message.error(isApiResponseError(error) ? error.message : 'Có lỗi xảy ra')
    } finally {
      setIsStatusLoading(false)
    }
  }

  const uploadAttachment = async (file: File) => {
    try {
      const res = await uploadBulletinFile(file)
      setAttachments(prev => [
        ...prev,
        { assetId: res.assetId, originalName: res.originalName, size: res.size, url: res.url },
      ])
    } catch {
      void message.error('Tải tệp lên thất bại')
    }
  }

  const isSubmitting = createRequest.isLoading || updateRequest.isLoading
  const watched = watch()
  const selectedCategory = useMemo(
    () => categories.find(c => c.id === watched.categoryId),
    [categories, watched.categoryId],
  )

  const previewData = {
    title: watched.title || '',
    summary: watched.summary,
    content: watched.content || '',
    categoryName: selectedCategory?.name,
    categoryColor: selectedCategory?.color,
    importance: watched.importance ?? BulletinImportance.NORMAL,
    publishedAt: detailData?.publishedAt,
    attachments,
  }

  const formBody = (
    <Form layout="vertical">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="col-span-full">
          <Form.Item label="Ảnh bìa (tuỳ chọn)">
            <Controller
              name="thumbnailAssetId"
              control={control}
              render={({ field }) => (
                <div className="w-48">
                  <UploadSingleImage
                    onSuccess={r => {
                      field.onChange(r.id)
                      setThumbUrl(r.url || undefined)
                    }}
                    onRemove={() => {
                      field.onChange(null)
                      setThumbUrl(undefined)
                    }}
                    maxSizeMB={5}
                  />
                  {thumbUrl && (
                    <img
                      src={thumbUrl}
                      alt="cover"
                      className="mt-2 w-full rounded-lg object-cover"
                      style={{ maxHeight: 120 }}
                    />
                  )}
                </div>
              )}
            />
          </Form.Item>
        </div>

        <div className="col-span-full">
          <Form.Item
            label="Tiêu đề"
            required
            validateStatus={errors.title ? 'error' : ''}
            help={errors.title?.message}
          >
            <Controller
              name="title"
              control={control}
              render={({ field }) => (
                <Input {...field} placeholder="Ví dụ: Thông báo lịch bảo trì hệ thống" />
              )}
            />
          </Form.Item>
        </div>

        <div className="col-span-full">
          <Form.Item
            label="Mô tả ngắn"
            validateStatus={errors.summary ? 'error' : ''}
            help={errors.summary?.message}
          >
            <Controller
              name="summary"
              control={control}
              render={({ field }) => (
                <Input.TextArea
                  {...field}
                  value={field.value ?? ''}
                  rows={2}
                  placeholder="Tóm tắt hiển thị ở list"
                />
              )}
            />
          </Form.Item>
        </div>

        <div className="col-span-full">
          <Form.Item
            label="Nội dung"
            required
            validateStatus={errors.content ? 'error' : ''}
            help={errors.content?.message}
          >
            <Controller
              name="content"
              control={control}
              render={({ field }) => (
                <BulletinEditor value={field.value} onChange={field.onChange} />
              )}
            />
          </Form.Item>
        </div>

        <Form.Item label="Chuyên mục">
          <Controller
            name="categoryId"
            control={control}
            render={({ field }) => (
              <BulletinCategorySelect
                value={field.value ?? undefined}
                onChange={v => field.onChange(v ?? null)}
                onBlur={field.onBlur}
              />
            )}
          />
        </Form.Item>

        <Form.Item label="Mức độ">
          <Controller
            name="importance"
            control={control}
            render={({ field }) => (
              <Segmented
                value={field.value}
                onChange={field.onChange}
                options={[
                  { label: 'Thường', value: BulletinImportance.NORMAL },
                  { label: 'Khẩn', value: BulletinImportance.URGENT },
                ]}
              />
            )}
          />
        </Form.Item>

        <Form.Item label="Ghim đến (pinnedUntil)">
          <Controller
            name="pinnedUntil"
            control={control}
            render={({ field }) => (
              <DatePicker
                className="w-full"
                showTime
                value={field.value ? dayjs(field.value) : null}
                onChange={d => field.onChange(d ? d.toISOString() : null)}
                format="DD/MM/YYYY HH:mm"
              />
            )}
          />
        </Form.Item>

        <Form.Item label="Hết hạn (expiresAt)">
          <Controller
            name="expiresAt"
            control={control}
            render={({ field }) => (
              <DatePicker
                className="w-full"
                showTime
                value={field.value ? dayjs(field.value) : null}
                onChange={d => field.onChange(d ? d.toISOString() : null)}
                format="DD/MM/YYYY HH:mm"
              />
            )}
          />
        </Form.Item>

        <Form.Item label="Nổi bật">
          <Space>
            <Controller
              name="isFeatured"
              control={control}
              render={({ field }) => <Switch checked={!!field.value} onChange={field.onChange} />}
            />
            <Controller
              name="featuredRank"
              control={control}
              render={({ field }) => (
                <InputNumber
                  placeholder="Thứ tự"
                  value={field.value ?? undefined}
                  onChange={v => field.onChange(v ?? null)}
                  disabled={!watched.isFeatured}
                  min={0}
                />
              )}
            />
          </Space>
        </Form.Item>

        {/* Attachments */}
        <div className="col-span-full">
          <Form.Item label="Tệp đính kèm">
            <Upload
              multiple
              showUploadList={false}
              beforeUpload={file => {
                void uploadAttachment(file as unknown as File)
                return false
              }}
            >
              <Button icon={<UploadOutlined />}>Tải tệp lên</Button>
            </Upload>
            {attachments.length > 0 && (
              <div className="mt-3 flex flex-col gap-2">
                {attachments.map((a, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm"
                  >
                    <span className="flex items-center gap-2 truncate">
                      <PaperClipOutlined /> {a.originalName}
                    </span>
                    <Button
                      size="small"
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}
                    />
                  </div>
                ))}
              </div>
            )}
          </Form.Item>
        </div>
      </div>

      <Space wrap>
        <Button icon={<EyeOutlined />} onClick={() => setPreviewOpen(true)}>
          Xem trước
        </Button>
        <Button onClick={() => submit(BulletinStatus.DRAFT)()} loading={isSubmitting}>
          Lưu nháp
        </Button>
        <Button
          type="primary"
          onClick={() => submit(BulletinStatus.PUBLISHED)()}
          loading={isSubmitting}
        >
          {isEditMode ? 'Lưu & đăng' : 'Đăng thông báo'}
        </Button>
      </Space>
    </Form>
  )

  if (isEditMode && isDetailLoading && !detailData) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spin size="large" />
      </div>
    )
  }

  return (
    <Space vertical size={16} style={{ width: '100%' }}>
      <Card>
        <Space className="w-full justify-between" wrap>
          <Space>
            <Button
              icon={<ArrowLeftOutlined />}
              type="text"
              onClick={() => navigate('/bulletins')}
            />
            <Typography.Title level={4} style={{ margin: 0 }}>
              {isEditMode ? 'Chỉnh sửa thông báo' : 'Đăng thông báo mới'}
            </Typography.Title>
            {isEditMode && (
              <Tag color={statusColorMap[currentStatus]}>{statusLabelMap[currentStatus]}</Tag>
            )}
          </Space>
          {isEditMode && (
            <Button
              icon={
                currentStatus === BulletinStatus.PUBLISHED ? (
                  <StopOutlined />
                ) : (
                  <CheckCircleOutlined />
                )
              }
              loading={isStatusLoading}
              onClick={() => void handleToggleStatus()}
            >
              {currentStatus === BulletinStatus.PUBLISHED ? 'Gỡ đăng' : 'Đăng'}
            </Button>
          )}
        </Space>
      </Card>

      <Card>{formBody}</Card>

      <Modal
        open={previewOpen}
        onCancel={() => setPreviewOpen(false)}
        footer={null}
        width={820}
        title="Xem trước (góc nhìn người đọc)"
      >
        <BulletinReader data={previewData} />
      </Modal>
    </Space>
  )
}
