import { FormHandler } from '@/components/FormHandler'
import { useCreate, useUpdate } from '@/hooks'
import type { Course } from '@/models/Course'
import type { CourseCategory } from '@/models/CourseCategory'
import type { CourseTag } from '@/models/CourseTag'
import { Currency } from '@/models/enum/Currency'
import { RoutePath } from '@/router/RoutePath'
import { createCourse, updateCourse, type CreateCourseInput } from '@/services/Course'
import { listCourseCategory } from '@/services/CourseCategory'
import { listCourseTag } from '@/services/CourseTag'
import { listUser } from '@/services/User'
import { UserRole, type User } from '@/models/User'
import { UploadSingleImage } from '@/components/Upload'
import { arrayToTextarea, parseTextareaToArray } from '../schemas/courseFormSchema'
import { App, Card, Divider, Select, Typography } from 'antd'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { v4 } from 'uuid'
import {
  COURSE_FORM_DEFAULT_VALUES,
  createCourseFormSchema,
  type CourseFormSubmitValues,
  type CourseFormValues,
} from '../schemas/courseFormSchema'
import { ProctoringSection } from './ProctoringSection'
import { ScheduleSection } from './ScheduleSection'

interface Props {
  course?: Course
  onSaved?: () => void
}

// Config-backed fields of the course payload. The server translates each one it
// receives into courses.config, and that mapping is lossy (selfPaced=false always
// becomes `sequential`), so an edit must only send the ones the admin changed.
const buildConfigFields = (values: CourseFormValues) => ({
  accessDurationDays: values.accessDurationDays || undefined,
  selfPaced: values.selfPaced,
  cmeCredits: values.cmeCredits,
  certifyingOrganization: values.certifyingOrganization?.trim() || undefined,
  proctoringConfig: {
    enabled: !!values.proctoringEnabled,
    inactivityPause: {
      enabled: !!values.proctoringInactivityEnabled,
      thresholdMinutes: values.proctoringInactivityMinutes ?? 3,
    },
    presenceCheck: {
      enabled: !!values.proctoringPresenceEnabled,
      cameraRequired: !!values.proctoringCameraRequired,
      mode: (values.proctoringRandomMode ? 'random' : 'fixed') as 'random' | 'fixed',
      intervalMinutes: values.proctoringIntervalMinutes ?? 20,
      randomMinMinutes: values.proctoringRandomMinMinutes ?? 15,
      randomMaxMinutes: values.proctoringRandomMaxMinutes ?? 30,
      maxChecksPerVideo: values.proctoringMaxChecksPerVideo ?? 3,
    },
  },
})

const pickChangedFields = <T extends object>(next: T, loaded: T): Partial<T> =>
  Object.fromEntries(
    Object.entries(next).filter(
      ([key, value]) => JSON.stringify(value) !== JSON.stringify(loaded[key as keyof T]),
    ),
  ) as Partial<T>

const toFormValues = (course: Course): CourseFormValues => ({
  title: course.title,
  subTitle: course.subTitle ?? undefined,
  description: course.description ?? undefined,
  price: course.price,
  accessDurationDays: course.accessDurationDays ?? undefined,
  maxEnrollments: course.maxEnrollments ?? undefined,
  selfPaced: course.selfPaced ?? true,
  requiresVerification: course.requiresVerification ?? false,
  isScheduled: course.isScheduled ?? false,
  registrationStart: course.registrationStart ?? undefined,
  registrationEnd: course.registrationEnd ?? undefined,
  startDate: course.startDate ?? undefined,
  endDate: course.endDate ?? undefined,
  objectives: arrayToTextarea(course.objectives),
  requirements: arrayToTextarea(course.requirements),
  suitableFor: arrayToTextarea(course.suitableFor),
  cmeCredits: course.cmeCredits ?? undefined,
  certifyingOrganization: course.certifyingOrganization ?? undefined,
  proctoringEnabled: course.proctoringConfig?.enabled ?? false,
  proctoringInactivityEnabled: course.proctoringConfig?.inactivityPause?.enabled ?? true,
  proctoringInactivityMinutes: course.proctoringConfig?.inactivityPause?.thresholdMinutes ?? 3,
  proctoringPresenceEnabled: course.proctoringConfig?.presenceCheck?.enabled ?? false,
  proctoringCameraRequired: course.proctoringConfig?.presenceCheck?.cameraRequired ?? false,
  proctoringRandomMode: course.proctoringConfig?.presenceCheck?.mode === 'random',
  proctoringIntervalMinutes: course.proctoringConfig?.presenceCheck?.intervalMinutes ?? 20,
  proctoringRandomMinMinutes: course.proctoringConfig?.presenceCheck?.randomMinMinutes ?? 15,
  proctoringRandomMaxMinutes: course.proctoringConfig?.presenceCheck?.randomMaxMinutes ?? 30,
  proctoringMaxChecksPerVideo: course.proctoringConfig?.presenceCheck?.maxChecksPerVideo ?? 3,
})

export const CourseForm = ({ course, onSaved }: Props) => {
  const navigate = useNavigate()
  const { t } = useTranslation(['CommonLocales', 'CourseLocales'])

  const { message } = App.useApp()
  const id = course?.id
  const detailData = course ?? null
  const isEditMode = !!id
  const courseFormSchema = useMemo(() => createCourseFormSchema(t), [t])

  // Category and tag data for selectors
  const [categories, setCategories] = useState<CourseCategory[]>([])
  const [courseTags, setCourseTags] = useState<CourseTag[]>([])

  // Local state for custom select fields (not in FormHandler schema)
  // null = user hasn't made a selection yet (derive from detailData); undefined/string/[] = user's choice
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null | undefined>(null)
  const [selectedTagIds, setSelectedTagIds] = useState<string[] | null>(null)

  // Instructor picker: users with the instructor role only.
  const [users, setUsers] = useState<User[]>([])
  const [selectedInstructorIds, setSelectedInstructorIds] = useState<string[] | null>(null)

  // null = chưa thay đổi, dùng detailData; string = đã upload mới
  const [newThumbnailUrl, setNewThumbnailUrl] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([listCourseCategory(), listCourseTag()])
      .then(([cats, tags]) => {
        setCategories(cats)
        setCourseTags(tags)
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
      .then(usersData => setUsers(usersData.items))
      .catch(() => void message.warning('Không tải được danh sách giảng viên'))
  }, [message])

  const updateById = useCallback(
    (updateId: string, payload: CreateCourseInput) => updateCourse({ id: updateId, ...payload }),
    [],
  )

  const createRequest = useCreate(createCourse)
  const updateRequest = useUpdate(updateById)

  // Derive effective values: use user's selection if made, else fall back to loaded detail
  const effectiveCategoryId =
    selectedCategoryId === null ? (detailData?.categoryId ?? undefined) : selectedCategoryId
  const effectiveTagIds =
    selectedTagIds === null ? (detailData?.tags?.map(tag => tag.id) ?? []) : selectedTagIds

  const effectiveInstructorIds =
    selectedInstructorIds === null ? (detailData?.instructorIds ?? []) : selectedInstructorIds

  // null = unchanged (fall back to server value); '' = explicitly cleared; string = newly uploaded
  const effectiveThumbnail =
    newThumbnailUrl !== null ? newThumbnailUrl || undefined : (detailData?.thumbnail ?? undefined)

  const onSubmit = async (values: CourseFormSubmitValues) => {
    const configFields = buildConfigFields(values)
    const payload: CreateCourseInput = {
      title: values.title,
      subTitle: values.subTitle?.trim() || undefined,
      description: values.description?.trim() || undefined,
      price: values.price,
      categoryId: effectiveCategoryId || undefined,
      tags: effectiveTagIds.length > 0 ? effectiveTagIds.map(tagId => ({ id: tagId })) : undefined,
      maxEnrollments: values.maxEnrollments || undefined,
      requiresVerification: values.requiresVerification,
      isScheduled: values.isScheduled,
      registrationStart: values.registrationStart || undefined,
      registrationEnd: values.registrationEnd || undefined,
      startDate: values.startDate || undefined,
      endDate: values.endDate || undefined,
      thumbnail: effectiveThumbnail,
      instructorIds: effectiveInstructorIds.length > 0 ? effectiveInstructorIds : undefined,
      objectives: parseTextareaToArray(values.objectives),
      requirements: parseTextareaToArray(values.requirements),
      suitableFor: parseTextareaToArray(values.suitableFor),
      ...(isEditMode && detailData
        ? pickChangedFields(configFields, buildConfigFields(toFormValues(detailData)))
        : configFields),
    }

    if (isEditMode && id) {
      const updated = await updateRequest.execute(id, payload)
      return updated
    } else {
      const created = await createRequest.execute(payload)
      return created
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
        isEditMode && detailData ? toFormValues(detailData) : COURSE_FORM_DEFAULT_VALUES
      }
      onSubmit={onSubmit}
      onSuccess={response => {
        if (isEditMode) onSaved?.()
        else navigate(RoutePath.CourseDetailPage.getPath(response.id), { replace: true })
      }}
    >
      {({ Field }) => (
        <div className="flex flex-col gap-y-6">
          {/* ── Thông tin chung ─────────────────────────────── */}
          <Typography.Title level={5} style={{ margin: 0 }}>
            Thông tin chung
          </Typography.Title>
          <div className="flex gap-x-6">
            <div className="w-36 shrink-0">
              <div className="mb-2 text-sm font-medium">Ảnh đại diện</div>
              <UploadSingleImage
                size="sm"
                onSuccess={resource => setNewThumbnailUrl(resource.url ?? null)}
                onRemove={() => setNewThumbnailUrl('')}
                maxSizeMB={5}
              />
              {effectiveThumbnail && !newThumbnailUrl && (
                <img
                  src={effectiveThumbnail}
                  alt="thumbnail hiện tại"
                  className="mt-2 rounded-lg w-full object-cover"
                  style={{ maxHeight: 120 }}
                />
              )}
            </div>
            <div className="flex-1 grid grid-cols-3 gap-x-6 gap-y-0">
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
              <Field name="subTitle" label="Tiêu đề phụ" type="text" className="col-span-2" />
            </div>
          </div>

          <Divider style={{ margin: 0 }} />

          {/* ── Phân loại ───────────────────────────────────── */}
          <Typography.Title level={5} style={{ margin: 0 }}>
            Phân loại
          </Typography.Title>
          <div className="grid grid-cols-4 gap-x-6 gap-y-0">
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
                  typeof opt?.label === 'string' &&
                  opt.label.toLowerCase().includes(input.toLowerCase())
                }
              />
            </div>
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
            <div className="col-span-2">
              <div className="mb-2 text-sm font-medium">Giảng viên</div>
              <Select
                mode="multiple"
                allowClear
                showSearch
                style={{ width: '100%' }}
                placeholder="Chọn giảng viên"
                value={effectiveInstructorIds}
                onChange={vals => setSelectedInstructorIds(vals)}
                options={users.map(u => ({ label: u.fullName, value: u.id }))}
                filterOption={(input, opt) =>
                  typeof opt?.label === 'string' &&
                  opt.label.toLowerCase().includes(input.toLowerCase())
                }
              />
            </div>
          </div>

          <Divider style={{ margin: 0 }} />

          {/* ── Cài đặt khoá học ────────────────────────────── */}
          <Typography.Title level={5} style={{ margin: 0 }}>
            Cài đặt khoá học
          </Typography.Title>
          <div className="grid grid-cols-4 gap-x-6 gap-y-0">
            <Field name="selfPaced" label="Học tự do" type="checkbox" />
            <Field
              name="requiresVerification"
              label="Chỉ dành cho bác sĩ đã xác minh"
              type="checkbox"
            />
            <Field
              name="accessDurationDays"
              label="Thời hạn truy cập (ngày)"
              type="number"
              placeholder="Không giới hạn"
              fieldProps={{ min: 1 }}
            />
            <Field
              name="maxEnrollments"
              label="Giới hạn học viên"
              type="number"
              placeholder="Không giới hạn"
              fieldProps={{ min: 1 }}
            />
          </div>

          <Divider style={{ margin: 0 }} />

          {/* ── Lịch trình khoá học (theo đợt) ──────────────── */}
          <ScheduleSection Field={Field} />

          <Divider style={{ margin: 0 }} />

          {/* ── CME / Chứng chỉ ─────────────────────────────── */}
          <Typography.Title level={5} style={{ margin: 0 }}>
            CME / Chứng chỉ
          </Typography.Title>
          <div className="grid grid-cols-4 gap-x-6 gap-y-0">
            <Field
              name="cmeCredits"
              label="Tín chỉ CME"
              type="number"
              placeholder="Không có"
              fieldProps={{ min: 0 }}
            />
            <Field
              name="certifyingOrganization"
              label="Tổ chức cấp chứng chỉ"
              type="text"
              className="col-span-2"
            />
          </div>

          <Divider style={{ margin: 0 }} />

          <ProctoringSection Field={Field} />

          <Divider style={{ margin: 0 }} />

          {/* ── Nội dung khoá học ───────────────────────────── */}
          <Typography.Title level={5} style={{ margin: 0 }}>
            Nội dung khoá học
          </Typography.Title>
          <div className="grid grid-cols-4 gap-x-6 gap-y-0">
            <Field
              name="objectives"
              label="Mục tiêu khoá học"
              type="textarea"
              className="col-span-full"
              placeholder={'- Học viên sẽ nắm vững...\n- Áp dụng được...'}
              fieldProps={{ rows: 4 }}
              tooltip="Mỗi mục tiêu một dòng. Có thể bắt đầu bằng dấu -"
            />
            <Field
              name="requirements"
              label="Yêu cầu đầu vào"
              type="textarea"
              className="col-span-full"
              placeholder={'- Đã học qua...\n- Có kiến thức cơ bản về...'}
              fieldProps={{ rows: 3 }}
              tooltip="Mỗi yêu cầu một dòng. Có thể bắt đầu bằng dấu -"
            />
            <Field
              name="suitableFor"
              label="Đối tượng phù hợp"
              type="textarea"
              className="col-span-full"
              placeholder={'- Sinh viên y khoa\n- Bác sĩ muốn cập nhật kiến thức'}
              fieldProps={{ rows: 3 }}
              tooltip="Mỗi đối tượng một dòng. Có thể bắt đầu bằng dấu -"
            />
          </div>

          <Divider style={{ margin: 0 }} />

          {/* ── Mô tả ───────────────────────────────────────── */}
          <Typography.Title level={5} style={{ margin: 0 }}>
            Mô tả
          </Typography.Title>
          <div className="grid grid-cols-4 gap-x-6 gap-y-0">
            <Field
              name="description"
              label={t('CourseLocales:description')}
              type="textarea"
              className="col-span-full"
              fieldProps={{ rows: 4 }}
            />
          </div>
        </div>
      )}
    </FormHandler>
  )

  return isEditMode ? formContent : <Card>{formContent}</Card>
}
