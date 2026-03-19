import { ImagePreviewModal } from '@/components/ModalVariants/ImagePreviewModal'
import { PdfPreviewModal } from '@/components/ModalVariants/PdfPreviewModal'
import { DocumentClassifySelect } from '@/components/SelectionVariants'
import { UploadFileResource } from '@/components/UploadFileResource/UploadFileResource'
import { useCreate, useDetail, useUpdate } from '@/hooks'
import { DocumentStatus } from '@/models/Document'
import type { FileResource } from '@/models/FileResource'
import {
  createDocument,
  getDocumentDetail,
  updateDocument,
  uploadDocumentFile,
  type CreateDocumentInput,
} from '@/services/Document'
import { isApiResponseError } from '@/utils/apiResponse'
import { getUrlFileResource } from '@/utils/getUrlFileResource'
import { zodResolver } from '@hookform/resolvers/zod'
import type { AxiosError } from 'axios'
import {
  App,
  Avatar,
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Typography,
} from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Controller, useForm, type SubmitErrorHandler } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import {
  DOCUMENT_FORM_DEFAULT_VALUES,
  documentFormSchema,
  type DocumentFormSubmitValues,
  type DocumentFormValues,
} from '../schemas/documentFormSchema'
import { getPublicUrl } from '@/utils/resource/getPublicUrl'

interface Props {
  id?: string
}

const statusOptions = [
  {
    label: 'Nháp',
    value: DocumentStatus.DRAFT,
  },
  {
    label: 'Đã xuất bản',
    value: DocumentStatus.PUBLISHED,
  },
]

export const DocumentForm = ({ id }: Props) => {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const isEditMode = !!id
  const [openThumbnailModal, setOpenThumbnailModal] = useState(false)
  const [openPreviewPdfModal, setOpenPreviewPdfModal] = useState(false)

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
      status: detailData.status,
      fileResource: detailData.file || null,
    })
  }, [detailData, reset])

  const isSubmitting = createRequest.isLoading || updateRequest.isLoading
  const thumbnailUrl = useMemo(
    () => getUrlFileResource(detailData?.thumbnail?.url),
    [detailData?.thumbnail?.url],
  )

  const onSubmit = async (values: DocumentFormSubmitValues) => {
    const payload = {
      title: values.title,
      description: values.description?.trim() || undefined,
      price: values.price,
      categoryId: values.categoryId?.trim() || undefined,
      status: values.status,
      fileId: values.fileResource.id,
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

  const onInvalidSubmit: SubmitErrorHandler<DocumentFormValues> = () => {
    void message.warning('Vui lòng kiểm tra lại các trường bắt buộc trước khi lưu.')
  }

  const fileResourceErrorMessage =
    typeof errors.fileResource?.message === 'string'
      ? errors.fileResource.message
      : typeof (errors.fileResource as { id?: { message?: unknown } } | undefined)?.id?.message ===
          'string'
        ? (errors.fileResource as { id?: { message?: string } }).id?.message
        : undefined

  const handleUploadDocumentFile = async (file: File) => uploadDocumentFile({ file })

  return (
    <Card>
      <Space orientation="vertical" size={20} style={{ width: '100%' }}>
        <div>
          <Typography.Title level={3} style={{ marginBottom: 4 }}>
            {isEditMode ? 'Cập nhật tài liệu' : 'Tạo tài liệu'}
          </Typography.Title>
          <Typography.Text type="secondary">
            Quản trị thông tin tài liệu theo chuẩn dữ liệu và phân loại.
          </Typography.Text>
        </div>

        <Form layout="vertical" onFinish={handleSubmit(onSubmit, onInvalidSubmit)}>
          <div className="grid grid-cols-3 gap-4">
            {detailData && detailData.thumbnail && (
              <div className="col-span-full">
                <Avatar
                  src={getPublicUrl(detailData.thumbnail)}
                  className="size-40"
                  shape="square"
                />
              </div>
            )}

            <Form.Item
              label="Tiêu đề"
              validateStatus={errors.title ? 'error' : ''}
              help={errors.title?.message}
              required
            >
              <Controller
                name="title"
                control={control}
                render={({ field }) => (
                  <Input {...field} placeholder="Ví dụ: Hướng dẫn phẫu thuật" />
                )}
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
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    step={1000}
                    value={field.value}
                    onChange={value => field.onChange(value ?? 0)}
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

            <Form.Item
              label="Trạng thái"
              validateStatus={errors.status ? 'error' : ''}
              help={errors.status?.message}
              required
            >
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select
                    options={statusOptions}
                    value={field.value}
                    onChange={value => field.onChange(value)}
                    onBlur={field.onBlur}
                  />
                )}
              />
            </Form.Item>

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
                    <UploadFileResource
                      value={field.value as FileResource | null | undefined}
                      uploadFile={handleUploadDocumentFile}
                      onChange={file => field.onChange(file ?? null)}
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                      maxSizeInMb={50}
                    />
                  )}
                />
              </Form.Item>
            </div>

            <Form.Item>
              <Space>
                <Button
                  type="default"
                  disabled={!detailData?.preview}
                  onClick={() => setOpenPreviewPdfModal(true)}
                >
                  Xem preview PDF
                </Button>
                {!detailData?.preview && (
                  <Typography.Text type="secondary">Chưa có preview PDF</Typography.Text>
                )}
              </Space>
            </Form.Item>
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

        <ImagePreviewModal
          open={openThumbnailModal}
          title="Thumbnail"
          imageUrl={thumbnailUrl}
          onCancel={() => setOpenThumbnailModal(false)}
        />
        <PdfPreviewModal
          open={openPreviewPdfModal}
          title="Preview PDF"
          pdfUrl={getPublicUrl(detailData?.preview) || ''}
          onCancel={() => setOpenPreviewPdfModal(false)}
        />
      </Space>
    </Card>
  )
}
