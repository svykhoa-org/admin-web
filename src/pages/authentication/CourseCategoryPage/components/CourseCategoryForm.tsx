import { useCreate, useDetail, useUpdate } from '@/hooks'
import type { CourseCategory } from '@/models/CourseCategory'
import {
  createCourseCategory,
  getCourseCategoryDetail,
  listCourseCategory,
  updateCourseCategory,
  type CreateCourseCategoryInput,
} from '@/services/CourseCategory'
import { isApiResponseError } from '@/utils/apiResponse'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeftOutlined } from '@ant-design/icons'
import { App, Button, Card, Form, Input, Select, Space, Spin, Typography } from 'antd'
import { useCallback, useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import {
  COURSE_CATEGORY_FORM_DEFAULT_VALUES,
  createCourseCategoryFormSchema,
  type CourseCategoryFormValues,
} from '../schemas/courseCategoryFormSchema'

interface Props {
  id?: string
}

export const CourseCategoryForm = ({ id }: Props) => {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const isEditMode = !!id

  const [categories, setCategories] = useState<CourseCategory[]>([])

  useEffect(() => {
    listCourseCategory()
      .then(setCategories)
      .catch(() => void message.error('Không thể tải danh sách danh mục'))
  }, [message])

  const schema = createCourseCategoryFormSchema()

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CourseCategoryFormValues>({
    resolver: zodResolver(schema),
    defaultValues: COURSE_CATEGORY_FORM_DEFAULT_VALUES,
  })

  const fetchDetail = useCallback((detailId: string) => getCourseCategoryDetail({ id: detailId }), [])
  const updateById = useCallback(
    (updateId: string, payload: CreateCourseCategoryInput) =>
      updateCourseCategory({ id: updateId, ...payload }),
    [],
  )

  const detailRequest = useDetail(fetchDetail)
  const createRequest = useCreate(createCourseCategory)
  const updateRequest = useUpdate(updateById)
  const { execute: executeDetail, data: detailData, isLoading: isDetailLoading } = detailRequest

  useEffect(() => {
    if (!isEditMode || !id) {
      reset(COURSE_CATEGORY_FORM_DEFAULT_VALUES)
      return
    }
    void executeDetail(id)
  }, [executeDetail, id, isEditMode, reset])

  useEffect(() => {
    if (!detailData) return
    reset({
      name: detailData.name,
      description: detailData.description ?? undefined,
      parentId: detailData.parentId ?? undefined,
      icon: detailData.icon ?? undefined,
    })
  }, [detailData, reset])

  const isSubmitting = createRequest.isLoading || updateRequest.isLoading

  const onSubmit = async (values: CourseCategoryFormValues) => {
    const payload: CreateCourseCategoryInput = {
      name: values.name,
      description: values.description?.trim() || undefined,
      parentId: values.parentId || undefined,
      icon: values.icon?.trim() || undefined,
    }

    try {
      if (isEditMode && id) {
        await updateRequest.execute(id, payload)
        void message.success('Cập nhật danh mục thành công')
      } else {
        const created = await createRequest.execute(payload)
        void message.success('Tạo danh mục thành công')
        navigate(`/course-categories/${created.id}`, { replace: true })
        return
      }
    } catch (error) {
      void message.error(
        isApiResponseError(error) ? error.message : 'Có lỗi xảy ra khi lưu dữ liệu. Vui lòng thử lại.',
      )
    }
  }

  // Parent options: exclude self and any descendant
  const parentOptions = categories
    .filter(c => c.id !== id)
    .filter(c => !id || !c.path.includes(id))
    .map(c => ({ label: c.name, value: c.id }))

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
        <Button
          icon={<ArrowLeftOutlined />}
          type="text"
          onClick={() => navigate('/course-categories')}
        />
        <Typography.Title level={4} style={{ margin: 0 }}>
          {isEditMode ? 'Cập nhật danh mục' : 'Tạo danh mục mới'}
        </Typography.Title>
      </Space>

      <Form layout="vertical" onFinish={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-2 gap-x-6">
          <Form.Item
            label="Tên danh mục"
            validateStatus={errors.name ? 'error' : ''}
            help={errors.name?.message}
            required
          >
            <Controller
              name="name"
              control={control}
              render={({ field }) => <Input {...field} placeholder="Tên danh mục" />}
            />
          </Form.Item>

          <Form.Item
            label="Icon (emoji hoặc tên icon)"
            validateStatus={errors.icon ? 'error' : ''}
            help={errors.icon?.message}
          >
            <Controller
              name="icon"
              control={control}
              render={({ field }) => <Input {...field} placeholder="Ví dụ: 📚 hoặc book" />}
            />
          </Form.Item>

          <Form.Item
            label="Mô tả"
            validateStatus={errors.description ? 'error' : ''}
            help={errors.description?.message}
            className="col-span-full"
          >
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <Input.TextArea {...field} rows={3} placeholder="Mô tả danh mục" />
              )}
            />
          </Form.Item>

          <Form.Item
            label="Danh mục cha"
            validateStatus={errors.parentId ? 'error' : ''}
            help={errors.parentId?.message}
          >
            <Controller
              name="parentId"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  allowClear
                  showSearch
                  placeholder="Không có (danh mục gốc)"
                  options={parentOptions}
                  filterOption={(input, opt) =>
                    (opt?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  onChange={value => field.onChange(value ?? undefined)}
                />
              )}
            />
          </Form.Item>
        </div>

        <Space>
          <Button htmlType="button" onClick={() => navigate('/course-categories')}>
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
    </Card>
  )
}
