import { FormHandler } from '@/components/FormHandler'
import { useCreate, useDetail, useRequest, useUpdate } from '@/hooks'
import {
  CourseStatus,
  CourseStatusMappingToColors,
  getCourseStatusMappingToLabels,
  type Course,
} from '@/models/Course'
import type { CourseCategory } from '@/models/CourseCategory'
import type { CourseTag } from '@/models/CourseTag'
import { Currency } from '@/models/enum/Currency'
import { RoutePath } from '@/router/RoutePath'
import {
  archiveCourse,
  createCourse,
  getCourseDetail,
  publishCourse,
  updateCourse,
  type CreateCourseInput,
} from '@/services/Course'
import { listCourseCategory } from '@/services/CourseCategory'
import { listCourseTag } from '@/services/CourseTag'
import { isApiResponseError } from '@/utils/apiResponse'
import { ArrowLeftOutlined, CheckCircleOutlined, InboxOutlined } from '@ant-design/icons'
import { App, Button, Card, Popconfirm, Select, Space, Spin, Tabs, Tag, Typography } from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { v4 } from 'uuid'
import {
  COURSE_FORM_DEFAULT_VALUES,
  createCourseFormSchema,
  type CourseFormSubmitValues,
} from '../schemas/courseFormSchema'
import { CourseModuleManager } from './CourseModuleManager'

interface Props {
  id?: string
}

export const CourseForm = ({ id }: Props) => {
  const navigate = useNavigate()
  const { t } = useTranslation(['CommonLocales', 'CourseLocales'])

  const CourseStatusMappingToLabels = useMemo(() => getCourseStatusMappingToLabels(t), [t])

  const { message } = App.useApp()
  const isEditMode = !!id
  const courseFormSchema = useMemo(() => createCourseFormSchema(t), [t])

  // Category and tag data for selectors
  const [categories, setCategories] = useState<CourseCategory[]>([])
  const [courseTags, setCourseTags] = useState<CourseTag[]>([])

  // Local state for custom select fields (not in FormHandler schema)
  // null = user hasn't made a selection yet (derive from detailData); undefined/string/[] = user's choice
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null | undefined>(null)
  const [selectedTagIds, setSelectedTagIds] = useState<string[] | null>(null)

  useEffect(() => {
    Promise.all([listCourseCategory(), listCourseTag()])
      .then(([cats, tags]) => {
        setCategories(cats)
        setCourseTags(tags)
      })
      .catch(() => void message.error('Không thể tải danh mục/tag'))
  }, [message])

  const fetchDetail = useCallback((detailId: string) => getCourseDetail({ id: detailId }), [])
  const updateById = useCallback(
    (updateId: string, payload: CreateCourseInput) => updateCourse({ id: updateId, ...payload }),
    [],
  )

  const detailRequest = useDetail(fetchDetail)
  const createRequest = useCreate(createCourse)
  const updateRequest = useUpdate(updateById)

  const publishRequest = useRequest((courseId: string) => publishCourse({ id: courseId }))
  const archiveRequest = useRequest((courseId: string) => archiveCourse({ id: courseId }))

  const { execute: executeDetail, data: detailData, isLoading: isDetailLoading } = detailRequest

  // Derive effective values: use user's selection if made, else fall back to loaded detail
  const effectiveCategoryId =
    selectedCategoryId === null ? (detailData?.categoryId ?? undefined) : selectedCategoryId
  const effectiveTagIds =
    selectedTagIds === null ? (detailData?.tags?.map(tag => tag.id) ?? []) : selectedTagIds

  const [courseOverride, setCourseDisplay] = useState<Course | null>(null)
  const courseDisplay = courseOverride ?? detailData

  useEffect(() => {
    if (!isEditMode || !id) return
    void executeDetail(id)
  }, [executeDetail, id, isEditMode])

  const onSubmit = async (values: CourseFormSubmitValues) => {
    const payload: CreateCourseInput = {
      title: values.title,
      subTitle: values.subTitle?.trim() || undefined,
      description: values.description?.trim() || undefined,
      price: values.price,
      categoryId: effectiveCategoryId || undefined,
      tags: effectiveTagIds.length > 0 ? effectiveTagIds.map(tagId => ({ id: tagId })) : undefined,
      accessDurationDays: values.accessDurationDays || undefined,
      maxEnrollments: values.maxEnrollments || undefined,
      selfPaced: values.selfPaced,
    }

    if (isEditMode && id) {
      const updated = await updateRequest.execute(id, payload)
      return updated
    } else {
      const created = await createRequest.execute(payload)
      return created
    }
  }

  const handlePublish = async () => {
    if (!id) return
    try {
      const updated = await publishRequest.execute(id)
      setCourseDisplay(updated)
      void message.success('Khoá học đã được xuất bản')
    } catch (error) {
      void message.error(
        isApiResponseError(error)
          ? error.message
          : 'Không thể xuất bản khoá học. Vui lòng kiểm tra điều kiện (module, bài học, video ready, finalLesson).',
      )
    }
  }

  const handleArchive = async () => {
    if (!id) return
    try {
      const updated = await archiveRequest.execute(id)
      setCourseDisplay(updated)
      void message.success('Khoá học đã được lưu trữ')
    } catch (error) {
      void message.error(isApiResponseError(error) ? error.message : 'Không thể lưu trữ khoá học')
    }
  }

  const formId = useMemo(() => {
    return v4()
  }, [])

  const formContent = (
    <FormHandler
      formId={formId}
      entityName={t('CourseLocales:course')}
      isEditMode={isEditMode}
      onCancel={() => navigate(RoutePath.CoursePage.path, { replace: true })}
      schema={courseFormSchema}
      defaultValues={
        isEditMode && detailData
          ? {
              title: detailData.title,
              subTitle: detailData.subTitle ?? undefined,
              description: detailData.description ?? undefined,
              price: detailData.price,
              accessDurationDays: detailData.accessDurationDays ?? undefined,
              maxEnrollments: detailData.maxEnrollments ?? undefined,
              selfPaced: detailData.selfPaced ?? true,
            }
          : COURSE_FORM_DEFAULT_VALUES
      }
      onSubmit={onSubmit}
      onSuccess={response => {
        navigate(RoutePath.CourseDetailPage.getPath(response.id), { replace: true })
      }}
    >
      {({ Field }) => (
        <div className="grid grid-cols-4 gap-x-6 gap-y-0">
          <Field name="title" label={t('CourseLocales:title')} type="text" className="col-span-2" />

          <Field
            name="price"
            label={t('CourseLocales:price')}
            type="price"
            fieldProps={{
              currency: Currency.VND,
            }}
          />

          <Field name="subTitle" label="Tiêu đề phụ" type="text" className="col-span-2" />

          {/* Category selector — managed outside FormHandler via local state */}
          <div className="col-span-1">
            <div className="mb-2 text-sm font-medium">Danh mục</div>
            <Select
              allowClear
              showSearch
              style={{ width: '100%' }}
              placeholder="Chọn danh mục"
              value={effectiveCategoryId}
              onChange={val => setSelectedCategoryId(val ?? null)}
              options={categories.map(c => ({ label: c.name, value: c.id }))}
              filterOption={(input, opt) =>
                ((opt?.label as string) ?? '').toLowerCase().includes(input.toLowerCase())
              }
            />
          </div>

          {/* Tag multi-select — managed outside FormHandler via local state */}
          <div className="col-span-1">
            <div className="mb-2 text-sm font-medium">Tags</div>
            <Select
              mode="multiple"
              allowClear
              style={{ width: '100%' }}
              placeholder="Chọn tag"
              value={effectiveTagIds}
              onChange={vals => setSelectedTagIds(vals)}
              options={courseTags.map(tag => ({ label: tag.name, value: tag.id }))}
            />
          </div>

          <Field
            name="accessDurationDays"
            label="Thời hạn truy cập (ngày)"
            type="number"
            fieldProps={{ min: 1, placeholder: 'Không giới hạn' }}
          />

          <Field
            name="maxEnrollments"
            label="Giới hạn học viên"
            type="number"
            fieldProps={{ min: 1, placeholder: 'Không giới hạn' }}
          />

          <Field name="selfPaced" label="Học tự do" type="checkbox" />

          <Field
            name="description"
            label={t('CourseLocales:description')}
            type="textarea"
            className="col-span-full"
            fieldProps={{ rows: 4 }}
          />
        </div>
      )}
    </FormHandler>
  )

  if (isEditMode) {
    if (isDetailLoading && !courseDisplay) {
      return (
        <div className="flex justify-center items-center py-20">
          <Spin size="large" />
        </div>
      )
    }

    if (!courseDisplay) {
      return (
        <Card>
          <Typography.Text type="secondary">Không tìm thấy khoá học.</Typography.Text>
        </Card>
      )
    }

    return (
      <Space vertical size={16} style={{ width: '100%' }}>
        <Card>
          <Space className="w-full justify-between" wrap>
            <Space>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => navigate('/courses')}
                type="text"
              />
              <div>
                <Space align="center">
                  <Typography.Title level={4} style={{ margin: 0 }}>
                    {courseDisplay.title}
                  </Typography.Title>
                  <Tag color={CourseStatusMappingToColors[courseDisplay.status]}>
                    {CourseStatusMappingToLabels[courseDisplay.status]}
                  </Tag>
                </Space>
                <Typography.Text type="secondary">
                  {courseDisplay.shortCode} · {courseDisplay.price.toLocaleString('vi-VN')} VNĐ
                </Typography.Text>
              </div>
            </Space>

            <Space>
              {courseDisplay.status !== CourseStatus.PUBLISHED && (
                <Popconfirm
                  title="Xuất bản khoá học?"
                  description="Khoá học phải có ít nhất 1 module, mỗi module có ít nhất 1 bài học, tất cả video ở trạng thái ready và đã có bài thi cuối khoá."
                  onConfirm={handlePublish}
                  okText="Xuất bản"
                  cancelText="Hủy"
                >
                  <Button
                    type="primary"
                    icon={<CheckCircleOutlined />}
                    loading={publishRequest.isLoading}
                  >
                    Xuất bản
                  </Button>
                </Popconfirm>
              )}
              {courseDisplay.status === CourseStatus.PUBLISHED && (
                <Popconfirm
                  title="Lưu trữ khoá học?"
                  description="Khoá học sẽ bị ẩn khỏi danh sách công khai."
                  onConfirm={handleArchive}
                  okText="Lưu trữ"
                  cancelText="Hủy"
                >
                  <Button icon={<InboxOutlined />} loading={archiveRequest.isLoading}>
                    Lưu trữ
                  </Button>
                </Popconfirm>
              )}
            </Space>
          </Space>
        </Card>

        <Card>
          <Tabs
            defaultActiveKey="info"
            items={[
              { key: 'info', label: 'Thông tin cơ bản', children: formContent },
              {
                key: 'modules',
                label: 'Module & Bài học',
                children: <CourseModuleManager courseId={id} />,
              },
            ]}
          />
        </Card>
      </Space>
    )
  }

  return <Card>{formContent}</Card>
}
