import { ImagePreviewModal } from '@/components/ModalVariants/ImagePreviewModal'
import { PdfPreviewModal } from '@/components/ModalVariants/PdfPreviewModal'
import { DocumentClassifySelect } from '@/components/SelectionVariants'
import { UploadSingleDocument, UploadSingleImage } from '@/components/Upload'
import { useCreate, useDetail, useUpdate } from '@/hooks'
import { DocumentStatus, type Document } from '@/models/Document'
import {
  createDocument,
  getDocumentDetail,
  publishDocument,
  unpublishDocument,
  updateDocument,
  type CreateDocumentInput,
} from '@/services/Document'
import { isApiResponseError } from '@/utils/apiResponse'
import { zodResolver } from '@hookform/resolvers/zod'
import type { AxiosError } from 'axios'
import { ArrowLeftOutlined, CheckCircleOutlined, StopOutlined } from '@ant-design/icons'
import { App, Button, Card, Form, Input, Popconfirm, Space, Spin, Tag, Typography } from 'antd'
import { PriceInput } from '@/components/InputVariants/PriceInput'
import { useCallback, useEffect, useState } from 'react'
import { Controller, useForm, type SubmitErrorHandler } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import {
  DOCUMENT_FORM_DEFAULT_VALUES,
  documentFormSchema,
  type DocumentFormSubmitValues,
  type DocumentFormValues,
} from '../schemas/documentFormSchema'

interface Props {
  id?: string
}

const statusColorMap: Record<DocumentStatus, string> = {
  [DocumentStatus.DRAFT]: 'default',
  [DocumentStatus.PUBLISHED]: 'success',
}

const statusLabelMap: Record<DocumentStatus, string> = {
  [DocumentStatus.DRAFT]: 'Nháp',
  [DocumentStatus.PUBLISHED]: 'Đã xuất bản',
}

export const DocumentForm = ({ id }: Props) => {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const isEditMode = !!id

  const [openThumbnailModal, setOpenThumbnailModal] = useState(false)
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | undefined>()
  const [filePdfUrl, setFilePdfUrl] = useState<string | undefined>()
  const [hasNewThumbnail, setHasNewThumbnail] = useState(false)
  const [localDocument, setLocalDocument] = useState<Document | null>(null)
  const [isStatusLoading, setIsStatusLoading] = useState(false)

  const fetchDocumentDetail = useCallback(
    (detailId: string) => getDocumentDetail({ id: detailId }),
    [],
  )
  const updateDocumentById = useCallback(
    (updateId: string, payload: CreateDocumentInput) =>
      updateDocument({ id: updateId, ...payload }),
    [],
  )

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DocumentFormValues, unknown, DocumentFormSubmitValues>({
    resolver: zodResolver(documentFormSchema),
    defaultValues: DOCUMENT_FORM_DEFAULT_VALUES,
  })

  const detailRequest = useDetail(fetchDocumentDetail)
  const createRequest = useCreate(createDocument)
  const updateRequest = useUpdate(updateDocumentById)
  const {
    execute: executeDetail,
    data: detailData,
    isLoading: isDetailLoading,
    reset: resetDetail,
  } = detailRequest

  const documentDisplay = localDocument ?? detailData

  useEffect(() => {
    if (!isEditMode || !id) {
      reset(DOCUMENT_FORM_DEFAULT_VALUES)
      resetDetail()
      return
    }
    void executeDetail(id)
  }, [executeDetail, id, isEditMode, reset, resetDetail])

  useEffect(() => {
    if (!detailData) return
    reset({
      title: detailData.title,
      description: detailData.description || undefined,
      price: detailData.price,
      categoryId: detailData.categoryId || undefined,
      thumbnailId: detailData.thumbnail?.id || null,
      fileResource: detailData.file || null,
      previewId: detailData.preview?.id || null,
    })
  }, [detailData, reset])

  const isSubmitting = createRequest.isLoading || updateRequest.isLoading

  const thumbnailUrl = documentDisplay?.thumbnail?.url || undefined

  const handlePublish = async () => {
    if (!id) return
    setIsStatusLoading(true)
    try {
      const updated = await publishDocument({ id })
      setLocalDocument(updated)
      void message.success('Xuất bản tài liệu thành công')
    } catch (error) {
      void message.error(isApiResponseError(error) ? error.message : 'Có lỗi xảy ra')
    } finally {
      setIsStatusLoading(false)
    }
  }

  const handleUnpublish = async () => {
    if (!id) return
    setIsStatusLoading(true)
    try {
      const updated = await unpublishDocument({ id })
      setLocalDocument(updated)
      void message.success('Thu hồi xuất bản thành công')
    } catch (error) {
      void message.error(isApiResponseError(error) ? error.message : 'Có lỗi xảy ra')
    } finally {
      setIsStatusLoading(false)
    }
  }

  const onSubmit = async (values: DocumentFormSubmitValues) => {
    const payload: CreateDocumentInput = {
      title: values.title,
      description: values.description?.trim() || undefined,
      price: values.price,
      categoryId: values.categoryId?.trim() || undefined,
      thumbnailId: values.thumbnailId!,
      fileId: values.fileResource.id,
      previewId: values.previewId!,
    }

    try {
      if (isEditMode && id) {
        await updateRequest.execute(id, payload)
        void message.success('Cập nhật tài liệu thành công')
      } else {
        await createRequest.execute(payload)
        void message.success('Tạo tài liệu thành công')
      }
      navigate('/documents', { replace: true })
    } catch (error) {
      const axiosError = error as AxiosError<{ message?: string | string[] }>
      const backendMessage = Array.isArray(axiosError.response?.data?.message)
        ? axiosError.response?.data?.message.join(', ')
        : axiosError.response?.data?.message
      const errorMessage = isApiResponseError(error)
        ? error.message
        : backendMessage || 'Có lỗi xảy ra khi lưu dữ liệu. Vui lòng thử lại.'
      void message.error(errorMessage)
    }
  }

  const onInvalidSubmit: SubmitErrorHandler<DocumentFormValues> = invalidErrors => {
    console.error('[DocumentForm] Invalid submit', invalidErrors)
    void message.warning('Vui lòng kiểm tra lại các trường bắt buộc trước khi lưu.')
  }

  const fileResourceErrorMessage =
    typeof errors.fileResource?.message === 'string'
      ? errors.fileResource.message
      : typeof (errors.fileResource as { id?: { message?: unknown } } | undefined)?.id?.message ===
          'string'
        ? (errors.fileResource as { id?: { message?: string } }).id?.message
        : undefined

  const formContent = (
    <Form layout="vertical" onFinish={handleSubmit(onSubmit, onInvalidSubmit)}>
      <div className="grid grid-cols-3 gap-4">
        {/* ── Thumbnail ── */}
        <div className="col-span-full">
          <Form.Item
            label="Ảnh đại diện"
            validateStatus={errors.thumbnailId ? 'error' : ''}
            help={errors.thumbnailId?.message}
            required
          >
            <Controller
              name="thumbnailId"
              control={control}
              render={({ field }) => (
                <div className="w-36 shrink-0">
                  <UploadSingleImage
                    size="sm"
                    onSuccess={resource => {
                      field.onChange(resource.id)
                      setHasNewThumbnail(true)
                    }}
                    onRemove={() => {
                      field.onChange(detailData?.thumbnail?.id || null)
                      setHasNewThumbnail(false)
                    }}
                    maxSizeMB={5}
                  />
                  {thumbnailUrl && !hasNewThumbnail && (
                    <img
                      src={thumbnailUrl}
                      alt="thumbnail"
                      className="mt-2 rounded-lg w-full object-cover cursor-pointer"
                      style={{ maxHeight: 140 }}
                      onClick={() => setOpenThumbnailModal(true)}
                    />
                  )}
                </div>
              )}
            />
          </Form.Item>
        </div>

        {/* ── Core fields ── */}
        <Form.Item
          label="Tiêu đề"
          validateStatus={errors.title ? 'error' : ''}
          help={errors.title?.message}
          required
        >
          <Controller
            name="title"
            control={control}
            render={({ field }) => <Input {...field} placeholder="Ví dụ: Hướng dẫn phẫu thuật" />}
          />
        </Form.Item>

        <Form.Item
          label="Giá"
          validateStatus={errors.price ? 'error' : ''}
          help={errors.price?.message}
          required
        >
          <Controller
            name="price"
            control={control}
            render={({ field }) => (
              <PriceInput
                value={field.value}
                onChange={value => field.onChange(value ?? 0)}
                onBlur={field.onBlur}
                status={errors.price ? 'error' : undefined}
              />
            )}
          />
        </Form.Item>

        <Form.Item
          label="Phân loại"
          validateStatus={errors.categoryId ? 'error' : ''}
          help={errors.categoryId?.message}
        >
          <Controller
            name="categoryId"
            control={control}
            render={({ field }) => (
              <DocumentClassifySelect
                value={field.value}
                onChange={value => field.onChange(value)}
                onBlur={field.onBlur}
              />
            )}
          />
        </Form.Item>

        <div className="col-span-2">
          <Form.Item
            label="Mô tả"
            validateStatus={errors.description ? 'error' : ''}
            help={errors.description?.message}
          >
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <Input.TextArea {...field} rows={4} placeholder="Mô tả ngắn" />
              )}
            />
          </Form.Item>
        </div>

        {/* ── File upload ── */}
        <div className="col-span-full">
          <Form.Item
            label="Tệp tài liệu"
            validateStatus={errors.fileResource ? 'error' : ''}
            help={fileResourceErrorMessage}
            required
          >
            <Controller
              name="fileResource"
              control={control}
              render={({ field }) => (
                <UploadSingleDocument
                  onSuccess={resource => field.onChange(resource)}
                  onRemove={() => field.onChange(null)}
                  onRemoveExisting={() => field.onChange(null)}
                  hideUploadOnFilled
                  maxSizeMB={100}
                  existingFile={
                    documentDisplay?.file
                      ? {
                          url: documentDisplay.file.url || undefined,
                          name:
                            documentDisplay.file.originalName ??
                            documentDisplay.file.fileName ??
                            'Tài liệu',
                          type: 'document',
                          onView: () => setFilePdfUrl(documentDisplay?.file?.url || undefined),
                        }
                      : undefined
                  }
                  onPreview={url => setFilePdfUrl(url)}
                />
              )}
            />
          </Form.Item>
        </div>

        {/* ── Preview PDF (after file) ── */}
        <div className="col-span-full">
          <Form.Item
            label="Preview PDF"
            validateStatus={errors.previewId ? 'error' : ''}
            help={errors.previewId?.message}
            required
          >
            <Controller
              name="previewId"
              control={control}
              render={({ field }) => (
                <UploadSingleDocument
                  onSuccess={resource => field.onChange(resource.id)}
                  onRemove={() => field.onChange(detailData?.preview?.id || null)}
                  onRemoveExisting={() => field.onChange(null)}
                  maxSizeMB={50}
                  hideUploadOnFilled
                  existingFile={
                    documentDisplay?.preview
                      ? {
                          url: documentDisplay.preview.url || undefined,
                          name:
                            documentDisplay.preview.originalName ??
                            documentDisplay.preview.fileName ??
                            'Preview PDF',
                          type: 'document',
                          onView: () =>
                            setPreviewPdfUrl(documentDisplay?.preview?.url || undefined),
                        }
                      : undefined
                  }
                  onPreview={url => setPreviewPdfUrl(url)}
                />
              )}
            />
          </Form.Item>
        </div>
      </div>

      <Space className="mt-4">
        <Button htmlType="button" onClick={() => navigate('/documents', { replace: true })}>
          Hủy
        </Button>
        <Button
          type="primary"
          htmlType="submit"
          loading={isSubmitting || (isEditMode && isDetailLoading)}
        >
          {isEditMode ? 'Cập nhật' : 'Tạo mới'}
        </Button>
      </Space>
    </Form>
  )

  // ── Edit mode ────────────────────────────────────────────────────────────────

  if (isEditMode) {
    if (isDetailLoading && !documentDisplay) {
      return (
        <div className="flex justify-center items-center py-20">
          <Spin size="large" />
        </div>
      )
    }

    if (!documentDisplay) {
      return (
        <Card>
          <Typography.Text type="secondary">Không tìm thấy tài liệu.</Typography.Text>
        </Card>
      )
    }

    return (
      <Space vertical size={16} style={{ width: '100%' }}>
        {/* Header card — title + status + actions */}
        <Card>
          <Space className="w-full justify-between" wrap>
            <Space>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate('/documents')}
                type="text"
              />
              <div>
                <Space align="center">
                  <Typography.Title level={4} style={{ margin: 0 }}>
                    {documentDisplay.title}
                  </Typography.Title>
                  <Tag color={statusColorMap[documentDisplay.status]}>
                    {statusLabelMap[documentDisplay.status]}
                  </Tag>
                </Space>
                <Typography.Text type="secondary">
                  {documentDisplay.price.toLocaleString('vi-VN')} VNĐ
                </Typography.Text>
              </div>
            </Space>

            <Space>
              {documentDisplay.status === DocumentStatus.DRAFT && (
                <Button
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  loading={isStatusLoading}
                  onClick={() => void handlePublish()}
                >
                  Xuất bản
                </Button>
              )}
              {documentDisplay.status === DocumentStatus.PUBLISHED && (
                <Popconfirm
                  title="Thu hồi xuất bản?"
                  description="Tài liệu sẽ bị ẩn khỏi danh sách công khai."
                  onConfirm={() => void handleUnpublish()}
                  okText="Thu hồi"
                  cancelText="Hủy"
                >
                  <Button icon={<StopOutlined />} loading={isStatusLoading}>
                    Thu hồi xuất bản
                  </Button>
                </Popconfirm>
              )}
            </Space>
          </Space>
        </Card>

        {/* Content card */}
        <Card>{formContent}</Card>

        <ImagePreviewModal
          open={openThumbnailModal}
          title="Ảnh đại diện"
          imageUrl={thumbnailUrl}
          onCancel={() => setOpenThumbnailModal(false)}
        />
        <PdfPreviewModal
          open={!!previewPdfUrl}
          title="Preview PDF"
          url={previewPdfUrl}
          onCancel={() => setPreviewPdfUrl(undefined)}
        />
        <PdfPreviewModal
          open={!!filePdfUrl}
          title="Xem tài liệu"
          url={filePdfUrl}
          onCancel={() => setFilePdfUrl(undefined)}
        />
      </Space>
    )
  }

  // ── Create mode ──────────────────────────────────────────────────────────────

  return (
    <Card>
      <div className="mb-4">
        <Typography.Title level={3} style={{ marginBottom: 4 }}>
          Tạo tài liệu
        </Typography.Title>
        <Typography.Text type="secondary">
          Quản trị thông tin tài liệu theo chuẩn dữ liệu và phân loại.
        </Typography.Text>
      </div>
      {formContent}
    </Card>
  )
}
