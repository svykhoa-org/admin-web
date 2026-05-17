import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { App, Button, Card, Form, Input, Space, Spin, Tag, Typography } from 'antd'
import { useCallback, useEffect, useMemo } from 'react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { useCreate, useDetail, useUpdate } from '@/hooks'
import {
  createCourseTag,
  getCourseTagDetail,
  updateCourseTag,
  type CreateCourseTagInput,
} from '@/services/CourseTag'
import { isApiResponseError } from '@/utils/apiResponse'
import {
  COURSE_TAG_FORM_DEFAULT_VALUES,
  createCourseTagFormSchema,
  type CourseTagFormValues,
} from '../schemas/courseTagFormSchema'

interface Props {
  id?: string
}

export const CourseTagForm = ({ id }: Props) => {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const isEditMode = !!id
  const schema = useMemo(() => createCourseTagFormSchema(), [])

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CourseTagFormValues>({
    resolver: zodResolver(schema),
    defaultValues: COURSE_TAG_FORM_DEFAULT_VALUES,
  })

  const fetchDetail = useCallback((detailId: string) => getCourseTagDetail({ id: detailId }), [])
  const updateById = useCallback(
    (updateId: string, payload: CreateCourseTagInput) =>
      updateCourseTag({ id: updateId, ...payload }),
    [],
  )

  const detailRequest = useDetail(fetchDetail)
  const createRequest = useCreate(createCourseTag)
  const updateRequest = useUpdate(updateById)
  const { execute: executeDetail, data: detailData, isLoading: isDetailLoading } = detailRequest

  useEffect(() => {
    if (!isEditMode || !id) return
    void executeDetail(id)
  }, [executeDetail, id, isEditMode])

  useEffect(() => {
    if (!detailData) return
    reset({
      name: detailData.name,
      description: detailData.description ?? undefined,
      color: detailData.color ?? undefined,
    })
  }, [detailData, reset])

  const colorValue = useWatch({ control, name: 'color' })

  const onSubmit = async (values: CourseTagFormValues) => {
    const payload: CreateCourseTagInput = {
      name: values.name,
      description: values.description?.trim() || undefined,
      color: values.color?.trim() || undefined,
    }
    try {
      let result
      if (isEditMode && id) {
        result = await updateRequest.execute(id, payload)
      } else {
        result = await createRequest.execute(payload)
      }
      if (result) {
        void message.success(isEditMode ? 'Cập nhật tag thành công' : 'Tạo tag thành công')
        if (isEditMode) {
          navigate(`/course-tags/${result.id}`, { replace: true })
        } else {
          navigate('/course-tags', { replace: true })
        }
      }
    } catch (error) {
      void message.error(isApiResponseError(error) ? error.message : 'Có lỗi xảy ra')
    }
  }

  if (isEditMode && isDetailLoading && !detailData) {
    return (
      <div className="flex justify-center items-center py-20">
        <Spin size="large" />
      </div>
    )
  }

  return (
    <Card>
      <Space className="mb-4">
        <Button icon={<ArrowLeftOutlined />} type="text" onClick={() => navigate('/course-tags')} />
        <Typography.Title level={4} style={{ margin: 0 }}>
          {isEditMode ? 'Cập nhật tag' : 'Tạo tag mới'}
        </Typography.Title>
      </Space>

      <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-2 gap-x-6">
          <Form.Item
            label="Tên tag"
            required
            validateStatus={errors.name ? 'error' : ''}
            help={errors.name?.message}
          >
            <Controller
              name="name"
              control={control}
              render={({ field }) => <Input {...field} placeholder="Ví dụ: NestJS" />}
            />
          </Form.Item>

          <Form.Item
            label="Màu (hex)"
            validateStatus={errors.color ? 'error' : ''}
            help={errors.color?.message}
          >
            <Controller
              name="color"
              control={control}
              render={({ field }) => (
                <Space>
                  <Input
                    {...field}
                    value={field.value ?? ''}
                    placeholder="#3B82F6"
                    style={{ width: 160 }}
                  />
                  {colorValue && /^#[0-9A-Fa-f]{6}$/.test(colorValue) && (
                    <Tag color={colorValue}>{colorValue}</Tag>
                  )}
                </Space>
              )}
            />
          </Form.Item>

          <Form.Item
            label="Mô tả"
            className="col-span-full"
            validateStatus={errors.description ? 'error' : ''}
            help={errors.description?.message}
          >
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <Input.TextArea
                  {...field}
                  value={field.value ?? ''}
                  rows={2}
                  placeholder="Mô tả ngắn về tag"
                />
              )}
            />
          </Form.Item>
        </div>

        <Space>
          <Button
            type="primary"
            htmlType="submit"
            loading={createRequest.isLoading || updateRequest.isLoading}
          >
            {isEditMode ? 'Cập nhật' : 'Tạo mới'}
          </Button>
          <Button onClick={() => navigate('/course-tags')}>Hủy</Button>
        </Space>
      </Form>
    </Card>
  )
}
