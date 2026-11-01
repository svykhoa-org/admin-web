import { FormHandler } from '@/components/FormHandler'
import type { CourseCategory } from '@/models/CourseCategory'
import { Currency } from '@/models/enum/Currency'
import { RoutePath } from '@/router/RoutePath'
import { createCourse, updateCourseConfig, type UpdateCourseConfigInput } from '@/services/Course'
import { listCourseCategory } from '@/services/CourseCategory'
import { App, Button, Modal } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { createCourseCreateSchema, type CoursePreset } from '../schemas/courseFormSchema'
import { RadioCardField, SelectField } from './settings/SettingsFields'

// Presets only pre-fill the config; everything stays editable in the course settings.
const PRESET_CONFIG: Record<CoursePreset, Omit<UpdateCourseConfigInput, 'id'> | null> = {
  self_paced: { progression: { mode: 'free' } },
  cohort: null,
  cme: {
    progression: { mode: 'sequential' },
    proctoring: {
      enabled: true,
      inactivityPause: { enabled: true, thresholdMinutes: 3 },
      presenceCheck: {
        enabled: true,
        cameraRequired: true,
        mode: 'fixed',
        intervalMinutes: 20,
        randomMinMinutes: 15,
        randomMaxMinutes: 30,
        maxChecksPerVideo: 3,
      },
    },
  },
}

interface Props {
  open: boolean
  onClose: () => void
}

const CourseCreateForm = ({ onClose }: Pick<Props, 'onClose'>) => {
  const navigate = useNavigate()
  const { t } = useTranslation(['CommonLocales', 'CourseLocales'])
  const { message } = App.useApp()
  const schema = useMemo(() => createCourseCreateSchema(t), [t])
  const [categories, setCategories] = useState<CourseCategory[]>([])

  useEffect(() => {
    listCourseCategory()
      .then(setCategories)
      .catch(() => void message.error('Không thể tải danh mục'))
  }, [message])

  return (
    <FormHandler
      schema={schema}
      defaultValues={{ title: '', price: 0, categoryId: undefined, preset: 'self_paced' }}
      entityName={t('CourseLocales:course')}
      onSubmit={async values => {
        const course = await createCourse({
          title: values.title,
          price: values.price,
          categoryId: values.categoryId || undefined,
          isScheduled: values.preset === 'cohort',
        })
        const presetConfig = PRESET_CONFIG[values.preset]
        try {
          if (presetConfig) await updateCourseConfig({ id: course.id, ...presetConfig })
          navigate(RoutePath.CourseContentPage.getPath(course.id))
        } catch {
          // The course is a draft, so a missing preset only needs finishing by hand.
          void message.warning('Đã tạo khoá học nhưng chưa áp dụng được cấu hình mẫu')
          navigate(RoutePath.CourseSettingsPage.getPath(course.id))
        }
        return course
      }}
    >
      {({ Field, isSubmitting }) => (
        <>
          <Field name="title" label={t('CourseLocales:title')} type="text" />
          <div className="grid grid-cols-2 gap-x-6">
            <Field
              name="price"
              label={t('CourseLocales:price')}
              type="price"
              fieldProps={{ currency: Currency.VND }}
            />
            <SelectField
              name="categoryId"
              label="Danh mục"
              placeholder="Chọn danh mục"
              allowClear
              options={categories.map(c => ({ label: c.name, value: c.id }))}
            />
          </div>
          <RadioCardField
            name="preset"
            label="Loại khoá học"
            options={[
              {
                value: 'self_paced',
                label: 'Tự học',
                description: 'Học viên học tự do, bài nào trước cũng được.',
              },
              {
                value: 'cohort',
                label: 'Theo đợt',
                description: 'Có lịch đăng ký và khai giảng, nhập ngày ở phần Cài đặt.',
              },
              {
                value: 'cme',
                label: 'Khoá CME',
                description: 'Học tuần tự, bắt buộc camera và cấp chứng chỉ.',
              },
            ]}
          />
          <div className="flex justify-end gap-2">
            <Button onClick={onClose} disabled={isSubmitting}>
              Hủy
            </Button>
            <Button type="primary" htmlType="submit" loading={isSubmitting}>
              Tạo khoá học
            </Button>
          </div>
        </>
      )}
    </FormHandler>
  )
}

export const CourseCreateDialog = ({ open, onClose }: Props) => (
  <Modal title="Tạo khoá học" open={open} onCancel={onClose} footer={null} destroyOnHidden>
    <CourseCreateForm onClose={onClose} />
  </Modal>
)
