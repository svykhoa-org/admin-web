import { UploadSingleImage } from '@/components/Upload'
import type { Course } from '@/models/Course'
import type { CourseCategory } from '@/models/CourseCategory'
import type { CourseTag } from '@/models/CourseTag'
import { Currency } from '@/models/enum/Currency'
import { UserRole, type User } from '@/models/User'
import { updateCourse } from '@/services/Course'
import { listCourseCategory } from '@/services/CourseCategory'
import { listCourseTag } from '@/services/CourseTag'
import { listUser } from '@/services/User'
import { App } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import {
  arrayToTextarea,
  createCourseInfoSchema,
  parseTextareaToArray,
  type CourseInfoFormValues,
} from '../../schemas/courseFormSchema'
import { SettingsCard } from './SettingsCard'
import { SelectField } from './SettingsFields'

const ThumbnailField = ({ current }: { current?: string | null }) => {
  const { setValue, watch } = useFormContext<CourseInfoFormValues>()
  const value = watch('thumbnail')
  const set = (url: string | null) => setValue('thumbnail', url, { shouldDirty: true })
  return (
    <div className="w-36 shrink-0">
      <div className="mb-2 text-sm font-medium">Ảnh đại diện</div>
      <UploadSingleImage
        size="sm"
        maxSizeMB={5}
        onSuccess={resource => set(resource.url ?? null)}
        onRemove={() => set(current ?? null)}
      />
      {value && value === current && (
        <img
          src={value}
          alt="Ảnh đại diện hiện tại"
          className="mt-2 w-full rounded-lg object-cover"
          style={{ maxHeight: 120 }}
        />
      )}
    </div>
  )
}

interface Props {
  course: Course
  onSaved: () => void
  onDirtyChange: (isDirty: boolean) => void
}

export const CourseInfoCard = ({ course, onSaved, onDirtyChange }: Props) => {
  const { t } = useTranslation(['CommonLocales', 'CourseLocales'])
  const { message } = App.useApp()
  const schema = useMemo(() => createCourseInfoSchema(t), [t])
  const [categories, setCategories] = useState<CourseCategory[]>([])
  const [tags, setTags] = useState<CourseTag[]>([])
  const [instructors, setInstructors] = useState<User[]>([])

  useEffect(() => {
    Promise.all([listCourseCategory(), listCourseTag()])
      .then(([loadedCategories, loadedTags]) => {
        setCategories(loadedCategories)
        setTags(loadedTags)
      })
      .catch(() => void message.error('Không thể tải danh mục/tag'))

    // Separate call: GET /users needs the `users` permission, which an admin
    // scoped to courses may lack — that must not break categories/tags.
    listUser({
      page: 1,
      pageSize: 50,
      searcher: { role: { operator: 'eq', value: UserRole.Instructor } },
      sorter: { field: 'fullName', direction: 'asc' },
    })
      .then(result => setInstructors(result.items))
      .catch(() => void message.warning('Không tải được danh sách giảng viên'))
  }, [message])

  const defaultValues: CourseInfoFormValues = {
    title: course.title,
    subTitle: course.subTitle,
    price: course.price,
    thumbnail: course.thumbnail,
    categoryId: course.categoryId,
    tagIds: course.tags?.map(tag => tag.id) ?? [],
    instructorIds: course.instructorIds ?? [],
    description: course.description,
    objectives: arrayToTextarea(course.objectives),
    requirements: arrayToTextarea(course.requirements),
    suitableFor: arrayToTextarea(course.suitableFor),
  }

  return (
    <SettingsCard
      title="Thông tin giới thiệu"
      description="Nội dung học viên nhìn thấy ở trang giới thiệu khoá học."
      scope="immediate"
      schema={schema}
      defaultValues={defaultValues}
      onSaved={onSaved}
      onDirtyChange={onDirtyChange}
      onSubmit={values =>
        updateCourse({
          id: course.id,
          title: values.title,
          subTitle: values.subTitle || null,
          price: values.price,
          thumbnail: values.thumbnail || null,
          categoryId: values.categoryId || null,
          tags: (values.tagIds ?? []).map(id => ({ id })),
          instructorIds: values.instructorIds ?? [],
          description: values.description || null,
          objectives: parseTextareaToArray(values.objectives),
          requirements: parseTextareaToArray(values.requirements),
          suitableFor: parseTextareaToArray(values.suitableFor),
        })
      }
    >
      {({ Field }) => (
        <>
          <div className="flex gap-x-6">
            <ThumbnailField current={course.thumbnail} />
            <div className="grid flex-1 grid-cols-3 gap-x-6">
              <Field
                name="title"
                label={t('CourseLocales:title')}
                type="text"
                className="col-span-2"
              />
              <Field
                name="price"
                label={t('CourseLocales:price')}
                type="price"
                fieldProps={{ currency: Currency.VND }}
              />
              <Field name="subTitle" label="Tiêu đề phụ" type="text" className="col-span-3" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-6">
            <SelectField
              name="categoryId"
              label="Danh mục"
              placeholder="Chọn danh mục"
              allowClear
              options={categories.map(c => ({ label: c.name, value: c.id }))}
            />
            <SelectField
              name="tagIds"
              label="Tags"
              mode="multiple"
              placeholder="Chọn tag"
              allowClear
              options={tags.map(tag => ({ label: tag.name, value: tag.id }))}
            />
            <SelectField
              name="instructorIds"
              label="Giảng viên"
              mode="multiple"
              placeholder="Chọn giảng viên"
              allowClear
              className="col-span-2"
              options={instructors.map(u => ({ label: u.fullName, value: u.id }))}
            />
          </div>
          <Field
            name="description"
            label={t('CourseLocales:description')}
            type="textarea"
            fieldProps={{ rows: 4 }}
          />
          <Field
            name="objectives"
            label="Mục tiêu khoá học"
            type="textarea"
            placeholder={'- Học viên sẽ nắm vững...\n- Áp dụng được...'}
            fieldProps={{ rows: 4 }}
            tooltip="Mỗi mục tiêu một dòng. Có thể bắt đầu bằng dấu -"
          />
          <Field
            name="requirements"
            label="Yêu cầu đầu vào"
            type="textarea"
            placeholder={'- Đã học qua...\n- Có kiến thức cơ bản về...'}
            fieldProps={{ rows: 3 }}
            tooltip="Mỗi yêu cầu một dòng. Có thể bắt đầu bằng dấu -"
          />
          <Field
            name="suitableFor"
            label="Đối tượng phù hợp"
            type="textarea"
            placeholder={'- Sinh viên y khoa\n- Bác sĩ muốn cập nhật kiến thức'}
            fieldProps={{ rows: 3 }}
            tooltip="Mỗi đối tượng một dòng. Có thể bắt đầu bằng dấu -"
          />
        </>
      )}
    </SettingsCard>
  )
}
