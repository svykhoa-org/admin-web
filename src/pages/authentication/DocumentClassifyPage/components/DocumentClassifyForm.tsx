import { useCreate, useDetail, useUpdate } from '@/hooks'
import { DocumentClassifySelect } from '@/components/SelectionVariants'
import {
  createDocumentClassify,
  getDocumentClassifyDetail,
  updateDocumentClassify,
} from '@/services/DocumentClassify'
import { isApiResponseError } from '@/utils/apiResponse'
import { zodResolver } from '@hookform/resolvers/zod'
import { App, Button, Card, Form, Input, Space, Typography } from 'antd'
import { useCallback, useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import {
  DOCUMENT_CLASSIFY_FORM_DEFAULT_VALUES,
  documentClassifyFormSchema,
  type DocumentClassifyFormValues,
} from '../schemas/documentClassifyFormSchema'

interface Props {
  id?: string
}

export const DocumentClassifyForm = ({ id }: Props) => {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const isEditMode = !!id
  const fetchDocumentClassifyDetail = useCallback(
    (detailId: string) => getDocumentClassifyDetail({ id: detailId }),
    [],
  )
  const updateDocumentClassifyById = useCallback(
    (updateId: string, payload: DocumentClassifyFormValues) =>
      updateDocumentClassify({ id: updateId, ...payload }),
    [],
  )

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DocumentClassifyFormValues>({
    resolver: zodResolver(documentClassifyFormSchema),
    defaultValues: DOCUMENT_CLASSIFY_FORM_DEFAULT_VALUES,
  })

  const detailRequest = useDetail(fetchDocumentClassifyDetail)

  const createRequest = useCreate(createDocumentClassify)
  const updateRequest = useUpdate(updateDocumentClassifyById)
  const { execute: executeDetail, data: detailData, isLoading: isDetailLoading } = detailRequest

  useEffect(() => {
    if (!isEditMode || !id) {
      reset(DOCUMENT_CLASSIFY_FORM_DEFAULT_VALUES)
      return
    }

    void executeDetail(id)
  }, [executeDetail, id, isEditMode, reset])

  useEffect(() => {
    if (!detailData) return

    reset({
      name: detailData.name,
      parentId: detailData.parentId || undefined,
    })
  }, [detailData, reset])

  const isSubmitting = createRequest.isLoading || updateRequest.isLoading

  const onSubmit = async (values: DocumentClassifyFormValues) => {
    const payload: DocumentClassifyFormValues = {
      ...values,
      parentId: values.parentId?.trim() || undefined,
    }

    try {
      if (isEditMode && id) {
        await updateRequest.execute(id, payload)
        void message.success('Cập nhật phân loại tài liệu thành công')
      } else {
        await createRequest.execute(payload)
        void message.success('Tạo phân loại tài liệu thành công')
      }

      navigate('/document-classify', { replace: true })
    } catch (error) {
      const errorMessage = isApiResponseError(error)
        ? error.message
        : 'Có lỗi xảy ra khi lưu dữ liệu. Vui lòng thử lại.'
      void message.error(errorMessage)
    }
  }

  return (
    <Card>
      <Space orientation="vertical" size={20} style={{ width: '100%' }}>
        <div>
          <Typography.Title level={3} style={{ marginBottom: 4 }}>
            {isEditMode ? 'Cập nhật phân loại tài liệu' : 'Tạo phân loại tài liệu'}
          </Typography.Title>
          <Typography.Text type="secondary">
            Quản trị thông tin nhóm tài liệu theo chuẩn đặt tên và phân cấp rõ ràng.
          </Typography.Text>
        </div>

        <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
          <Form.Item
            label="Tên phân loại"
            validateStatus={errors.name ? 'error' : ''}
            help={errors.name?.message}
            required
          >
            <Controller
              name="name"
              control={control}
              render={({ field }) => <Input {...field} placeholder="Ví dụ: Hồ sơ bệnh án" />}
            />
          </Form.Item>

          <Form.Item
            label="Phân loại cha"
            validateStatus={errors.parentId ? 'error' : ''}
            help={errors.parentId?.message}
          >
            <Controller
              name="parentId"
              control={control}
              render={({ field }) => (
                <DocumentClassifySelect
                  excludeId={id}
                  value={field.value}
                  onChange={value => field.onChange(value)}
                  onBlur={field.onBlur}
                />
              )}
            />
          </Form.Item>

          <Space>
            <Button
              htmlType="button"
              onClick={() => navigate('/document-classify', { replace: true })}
            >
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
      </Space>
    </Card>
  )
}
