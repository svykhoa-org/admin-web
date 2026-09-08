import { UploadSingleImage } from '@/components/Upload'
import { ArticleCategorySelect, UserSelect } from '@/components/SelectionVariants'
import { useCreate, useDetail, useUpdate } from '@/hooks'
import { ArticleStatus, type ArticleCategory } from '@/models/Article'
import {
  createArticle,
  getArticleDetail,
  listArticleCategories,
  publishArticle,
  unpublishArticle,
  updateArticle,
  type ArticleWriteInput,
} from '@/services/Article'
import { isApiResponseError } from '@/utils/apiResponse'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  StopOutlined,
} from '@ant-design/icons'
import {
  App,
  Button,
  Card,
  Collapse,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Space,
  Spin,
  Switch,
  Tag,
  Typography,
} from 'antd'
import dayjs from 'dayjs'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Controller, useForm, type SubmitErrorHandler } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import {
  ARTICLE_FORM_DEFAULT_VALUES,
  articleFormSchema,
  type ArticleFormSubmitValues,
  type ArticleFormValues,
} from '../schemas/articleFormSchema'
import { ArticleEditor } from './ArticleEditor'
import { ArticleReader } from './ArticleReader'

interface Props {
  id?: string
}

const statusColorMap: Record<ArticleStatus, string> = {
  [ArticleStatus.DRAFT]: 'default',
  [ArticleStatus.PUBLISHED]: 'success',
  [ArticleStatus.ARCHIVED]: 'warning',
}

const statusLabelMap: Record<ArticleStatus, string> = {
  [ArticleStatus.DRAFT]: 'Nháp',
  [ArticleStatus.PUBLISHED]: 'Đã xuất bản',
  [ArticleStatus.ARCHIVED]: 'Lưu trữ',
}

export const ArticleForm = ({ id }: Props) => {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const isEditMode = !!id

  const [thumbUrl, setThumbUrl] = useState<string | undefined>()
  const [ogUrl, setOgUrl] = useState<string | undefined>()
  const [categories, setCategories] = useState<ArticleCategory[]>([])
  const [previewOpen, setPreviewOpen] = useState(false)
  const [currentStatus, setCurrentStatus] = useState<ArticleStatus>(ArticleStatus.DRAFT)
  const [isStatusLoading, setIsStatusLoading] = useState(false)

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ArticleFormValues, unknown, ArticleFormSubmitValues>({
    resolver: zodResolver(articleFormSchema),
    defaultValues: ARTICLE_FORM_DEFAULT_VALUES,
  })

  const fetchDetail = useCallback((detailId: string) => getArticleDetail(detailId), [])
  const updateById = useCallback(
    (updateId: string, payload: Partial<ArticleWriteInput>) => updateArticle(updateId, payload),
    [],
  )

  const detailRequest = useDetail(fetchDetail)
  const createRequest = useCreate(createArticle)
  const updateRequest = useUpdate(updateById)
  const { execute: executeDetail, data: detailData, isLoading: isDetailLoading } = detailRequest

  useEffect(() => {
    listArticleCategories()
      .then(setCategories)
      .catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    if (isEditMode && id) void executeDetail(id)
  }, [executeDetail, id, isEditMode])

  useEffect(() => {
    if (!detailData) return
    setThumbUrl(detailData.thumbnail || undefined)
    setOgUrl(detailData.ogImage || undefined)
    setCurrentStatus(detailData.status)
    reset({
      title: detailData.title,
      summary: detailData.summary,
      content: detailData.content,
      thumbnailAssetId: detailData.thumbnailAssetId ?? null,
      categoryId: detailData.categoryId ?? null,
      authorUserId: detailData.authorUserId ?? null,
      authorName: detailData.authorName || undefined,
      authorTitle: detailData.authorTitle || undefined,
      authorAvatarUrl: detailData.authorAvatarUrl || undefined,
      reviewedByUserId: detailData.reviewedByUserId ?? null,
      reviewedAt: detailData.reviewedAt ?? null,
      isFeatured: detailData.isFeatured,
      featuredRank: detailData.featuredRank ?? null,
      metaTitle: detailData.metaTitle || undefined,
      metaDescription: detailData.metaDescription || undefined,
      canonicalUrl: detailData.canonicalUrl || undefined,
      ogImageAssetId: detailData.ogImageAssetId ?? null,
    })
  }, [detailData, reset])

  const buildPayload = (
    values: ArticleFormSubmitValues,
    status?: ArticleStatus,
  ): ArticleWriteInput => ({
    title: values.title,
    summary: values.summary,
    content: values.content,
    thumbnailAssetId: values.thumbnailAssetId ?? null,
    categoryId: values.categoryId ?? null,
    authorUserId: values.authorUserId ?? null,
    authorName: values.authorName?.trim() || undefined,
    authorTitle: values.authorTitle?.trim() || null,
    authorAvatarUrl: values.authorAvatarUrl?.trim() || null,
    reviewedByUserId: values.reviewedByUserId ?? null,
    reviewedAt: values.reviewedAt ?? null,
    isFeatured: values.isFeatured ?? false,
    featuredRank: values.featuredRank ?? null,
    metaTitle: values.metaTitle?.trim() || null,
    metaDescription: values.metaDescription?.trim() || null,
    canonicalUrl: values.canonicalUrl?.trim() || null,
    ogImageAssetId: values.ogImageAssetId ?? null,
    ...(status ? { status } : {}),
  })

  const submit = (status: ArticleStatus) =>
    handleSubmit(async values => {
      try {
        if (isEditMode && id) {
          await updateRequest.execute(id, buildPayload(values, status))
          void message.success('Cập nhật bài viết thành công')
        } else {
          await createRequest.execute(buildPayload(values, status))
          void message.success(
            status === ArticleStatus.PUBLISHED ? 'Đăng bài thành công' : 'Đã lưu nháp',
          )
        }
        navigate('/articles', { replace: true })
      } catch (error) {
        void message.error(
          isApiResponseError(error) ? error.message : 'Có lỗi xảy ra khi lưu bài viết',
        )
      }
    }, onInvalid)

  const onInvalid: SubmitErrorHandler<ArticleFormValues> = () =>
    void message.warning('Vui lòng kiểm tra lại các trường bắt buộc.')

  const handleToggleStatus = async () => {
    if (!id) return
    setIsStatusLoading(true)
    try {
      const updated =
        currentStatus === ArticleStatus.PUBLISHED
          ? await unpublishArticle(id)
          : await publishArticle(id)
      setCurrentStatus(updated.status)
      void message.success(
        updated.status === ArticleStatus.PUBLISHED ? 'Đã xuất bản' : 'Đã chuyển về nháp',
      )
    } catch (error) {
      void message.error(isApiResponseError(error) ? error.message : 'Có lỗi xảy ra')
    } finally {
      setIsStatusLoading(false)
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
    thumbnailUrl: thumbUrl,
    authorName: watched.authorName?.trim() || 'Tác giả',
    authorTitle: watched.authorTitle,
    authorAvatarUrl: watched.authorAvatarUrl,
    categoryName: selectedCategory?.name,
    categoryColor: selectedCategory?.color,
    reviewedByName: watched.reviewedByUserId ? 'chuyên gia y khoa' : undefined,
    reviewedAt: watched.reviewedAt,
    publishedAt: detailData?.publishedAt,
  }

  const formBody = (
    <Form layout="vertical">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Cover */}
        <div className="col-span-full">
          <Form.Item label="Ảnh bìa (full-width)">
            <Controller
              name="thumbnailAssetId"
              control={control}
              render={({ field }) => (
                <div className="w-64">
                  <UploadSingleImage
                    onSuccess={resource => {
                      field.onChange(resource.id)
                      setThumbUrl(resource.url || undefined)
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
                      style={{ maxHeight: 160 }}
                    />
                  )}
                </div>
              )}
            />
          </Form.Item>
        </div>

        {/* Title */}
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
                <Input {...field} placeholder="Ví dụ: Cập nhật điều trị viêm ruột thừa 2025" />
              )}
            />
          </Form.Item>
        </div>

        {/* Summary */}
        <div className="col-span-full">
          <Form.Item
            label="Mô tả ngắn"
            required
            validateStatus={errors.summary ? 'error' : ''}
            help={errors.summary?.message}
          >
            <Controller
              name="summary"
              control={control}
              render={({ field }) => (
                <Input.TextArea
                  {...field}
                  rows={2}
                  placeholder="Tóm tắt hiển thị ở card + đầu bài"
                />
              )}
            />
          </Form.Item>
        </div>

        {/* Content editor */}
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
                <ArticleEditor value={field.value} onChange={field.onChange} />
              )}
            />
          </Form.Item>
        </div>

        {/* Category */}
        <Form.Item label="Chuyên mục">
          <Controller
            name="categoryId"
            control={control}
            render={({ field }) => (
              <ArticleCategorySelect
                value={field.value ?? undefined}
                onChange={value => field.onChange(value ?? null)}
                onBlur={field.onBlur}
              />
            )}
          />
        </Form.Item>

        {/* Featured */}
        <Form.Item label="Nổi bật (Tin nổi bật)">
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
                  onChange={value => field.onChange(value ?? null)}
                  disabled={!watched.isFeatured}
                  min={0}
                />
              )}
            />
          </Space>
        </Form.Item>

        {/* Byline */}
        <Form.Item label="Tài khoản tác giả (tuỳ chọn)">
          <Controller
            name="authorUserId"
            control={control}
            render={({ field }) => (
              <UserSelect
                value={field.value ?? undefined}
                onChange={value => field.onChange(value ?? null)}
                placeholder="Gắn với 1 tài khoản (tuỳ chọn)"
              />
            )}
          />
        </Form.Item>

        <Form.Item label="Tên hiển thị tác giả">
          <Controller
            name="authorName"
            control={control}
            render={({ field }) => (
              <Input {...field} value={field.value ?? ''} placeholder="Mặc định = tên admin đăng" />
            )}
          />
        </Form.Item>

        <Form.Item label="Chức danh tác giả">
          <Controller
            name="authorTitle"
            control={control}
            render={({ field }) => (
              <Input {...field} value={field.value ?? ''} placeholder="BS. CKI Tim mạch" />
            )}
          />
        </Form.Item>

        <Form.Item label="Avatar tác giả (URL)">
          <Controller
            name="authorAvatarUrl"
            control={control}
            render={({ field }) => (
              <Input {...field} value={field.value ?? ''} placeholder="https://..." />
            )}
          />
        </Form.Item>

        {/* Medical review */}
        <Form.Item label="Người kiểm duyệt y khoa">
          <Controller
            name="reviewedByUserId"
            control={control}
            render={({ field }) => (
              <UserSelect
                value={field.value ?? undefined}
                onChange={value => field.onChange(value ?? null)}
                placeholder="Chọn bác sĩ kiểm duyệt (tuỳ chọn)"
              />
            )}
          />
        </Form.Item>

        <Form.Item label="Ngày kiểm duyệt">
          <Controller
            name="reviewedAt"
            control={control}
            render={({ field }) => (
              <DatePicker
                className="w-full"
                value={field.value ? dayjs(field.value) : null}
                onChange={date => field.onChange(date ? date.toISOString() : null)}
                format="DD/MM/YYYY"
              />
            )}
          />
        </Form.Item>
      </div>

      {/* SEO (collapsible) */}
      <Collapse
        className="mb-4"
        items={[
          {
            key: 'seo',
            label: 'SEO / chia sẻ mạng xã hội (tuỳ chọn)',
            children: (
              <div className="grid grid-cols-1 gap-4">
                <Form.Item label="Meta title" className="mb-0">
                  <Controller
                    name="metaTitle"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        value={field.value ?? ''}
                        placeholder="Mặc định = tiêu đề"
                      />
                    )}
                  />
                </Form.Item>
                <Form.Item label="Meta description" className="mb-0">
                  <Controller
                    name="metaDescription"
                    control={control}
                    render={({ field }) => (
                      <Input.TextArea
                        {...field}
                        value={field.value ?? ''}
                        rows={2}
                        placeholder="Mặc định = mô tả ngắn"
                      />
                    )}
                  />
                </Form.Item>
                <Form.Item label="Canonical URL" className="mb-0">
                  <Controller
                    name="canonicalUrl"
                    control={control}
                    render={({ field }) => (
                      <Input {...field} value={field.value ?? ''} placeholder="https://..." />
                    )}
                  />
                </Form.Item>
                <Form.Item label="Ảnh OG (mặc định = ảnh bìa)" className="mb-0">
                  <Controller
                    name="ogImageAssetId"
                    control={control}
                    render={({ field }) => (
                      <div className="w-48">
                        <UploadSingleImage
                          onSuccess={resource => {
                            field.onChange(resource.id)
                            setOgUrl(resource.url || undefined)
                          }}
                          onRemove={() => {
                            field.onChange(null)
                            setOgUrl(undefined)
                          }}
                          maxSizeMB={5}
                        />
                        {ogUrl && (
                          <img
                            src={ogUrl}
                            alt="og"
                            className="mt-2 w-full rounded-lg object-cover"
                            style={{ maxHeight: 120 }}
                          />
                        )}
                      </div>
                    )}
                  />
                </Form.Item>
              </div>
            ),
          },
        ]}
      />

      <Space wrap>
        <Button icon={<EyeOutlined />} onClick={() => setPreviewOpen(true)}>
          Xem trước
        </Button>
        <Button onClick={() => submit(ArticleStatus.DRAFT)()} loading={isSubmitting}>
          Lưu nháp
        </Button>
        <Button
          type="primary"
          onClick={() => submit(ArticleStatus.PUBLISHED)()}
          loading={isSubmitting}
        >
          {isEditMode ? 'Lưu & xuất bản' : 'Đăng bài'}
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
              onClick={() => navigate('/articles')}
            />
            <Typography.Title level={4} style={{ margin: 0 }}>
              {isEditMode ? 'Chỉnh sửa bài viết' : 'Đăng bài viết mới'}
            </Typography.Title>
            {isEditMode && (
              <Tag color={statusColorMap[currentStatus]}>{statusLabelMap[currentStatus]}</Tag>
            )}
          </Space>
          {isEditMode && (
            <Button
              icon={
                currentStatus === ArticleStatus.PUBLISHED ? (
                  <StopOutlined />
                ) : (
                  <CheckCircleOutlined />
                )
              }
              loading={isStatusLoading}
              onClick={() => void handleToggleStatus()}
            >
              {currentStatus === ArticleStatus.PUBLISHED ? 'Thu hồi xuất bản' : 'Xuất bản'}
            </Button>
          )}
        </Space>
      </Card>

      <Card>{formBody}</Card>

      <Modal
        open={previewOpen}
        onCancel={() => setPreviewOpen(false)}
        footer={null}
        width={860}
        title="Xem trước (góc nhìn người đọc)"
      >
        <ArticleReader data={previewData} />
      </Modal>
    </Space>
  )
}
