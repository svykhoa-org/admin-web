import type { Course, CourseConfig, Lesson } from '@/models/Course'
import { LessonType } from '@/models/Course'
import { getCourseCurriculum, updateCourse, updateCourseConfig } from '@/services/Course'
import { App } from 'antd'
import { useEffect, useState } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'
import {
  accessSchema,
  certificateSchema,
  enrollmentSchema,
  proctoringSchema,
  progressionSchema,
  type ProctoringFormValues,
} from '../../schemas/courseFormSchema'
import { ProctoringSection } from '../ProctoringSection'
import { ScheduleSection } from '../ScheduleSection'
import { SettingsCard } from './SettingsCard'
import { RadioCardField, SelectField } from './SettingsFields'

interface CardProps {
  course: Course
  config: CourseConfig
  onSaved: () => void
  onDirtyChange: (isDirty: boolean) => void
}

export const EnrollmentCard = ({ course, onSaved, onDirtyChange }: Omit<CardProps, 'config'>) => (
  <SettingsCard
    title="Đăng ký và lịch"
    description="Ai được đăng ký, tối đa bao nhiêu người, và khoá diễn ra khi nào."
    scope="immediate"
    schema={enrollmentSchema}
    defaultValues={{
      maxEnrollments: course.maxEnrollments,
      requiresVerification: course.requiresVerification ?? false,
      isScheduled: course.isScheduled ?? false,
      registrationStart: course.registrationStart,
      registrationEnd: course.registrationEnd,
      startDate: course.startDate,
      endDate: course.endDate,
    }}
    onSaved={onSaved}
    onDirtyChange={onDirtyChange}
    onSubmit={values =>
      updateCourse({
        id: course.id,
        maxEnrollments: values.maxEnrollments ?? null,
        requiresVerification: !!values.requiresVerification,
        isScheduled: !!values.isScheduled,
        registrationStart: values.registrationStart ?? null,
        registrationEnd: values.registrationEnd ?? null,
        startDate: values.startDate ?? null,
        endDate: values.endDate ?? null,
      })
    }
  >
    {({ Field }) => (
      <>
        <div className="grid grid-cols-2 gap-x-6">
          <Field
            name="maxEnrollments"
            label="Giới hạn học viên"
            type="number"
            placeholder="Không giới hạn"
            fieldProps={{ min: 1 }}
          />
          <Field
            name="requiresVerification"
            label="Chỉ dành cho bác sĩ đã xác minh"
            type="checkbox"
          />
        </div>
        <ScheduleSection Field={Field} />
      </>
    )}
  </SettingsCard>
)

const AccessFields = ({ canUseCourseEnd }: { canUseCourseEnd: boolean }) => {
  const { control } = useFormContext<{ mode: CourseConfig['access']['mode'] }>()
  const mode = useWatch({ control, name: 'mode' })
  return (
    <RadioCardField
      name="mode"
      label="Học viên được học trong bao lâu?"
      options={[
        {
          value: 'unlimited',
          label: 'Không giới hạn',
          description: 'Học viên giữ quyền học sau khi đăng ký.',
        },
        {
          value: 'days_after_enroll',
          label: mode === 'days_after_enroll' ? 'Theo số ngày (nhập bên dưới)' : 'Theo số ngày',
          description: 'Tính từ ngày đăng ký.',
        },
        {
          value: 'until_course_end',
          label: 'Tới hết đợt',
          description: canUseCourseEnd
            ? 'Hết quyền học sau ngày kết thúc của đợt.'
            : 'Cần bật khoá theo đợt và có ngày kết thúc.',
          disabled: !canUseCourseEnd,
        },
      ]}
    />
  )
}

export const AccessCard = ({ course, config, onSaved, onDirtyChange }: CardProps) => (
  <SettingsCard
    title="Thời hạn truy cập"
    description="Khoảng thời gian học viên vào học được sau khi đăng ký."
    scope="new_enrollments"
    schema={accessSchema}
    defaultValues={{ mode: config.access.mode, days: config.access.days }}
    onSaved={onSaved}
    onDirtyChange={onDirtyChange}
    onSubmit={values =>
      updateCourseConfig({
        id: course.id,
        access: {
          mode: values.mode,
          days: values.mode === 'days_after_enroll' ? (values.days ?? null) : null,
        },
      })
    }
  >
    {({ Field }) => (
      <>
        <AccessFields canUseCourseEnd={!!course.isScheduled && !!course.endDate} />
        <div className="grid grid-cols-2 gap-x-6">
          <Field
            name="days"
            label="Số ngày (khi chọn Theo số ngày)"
            type="number"
            fieldProps={{ min: 1, max: 3650 }}
          />
        </div>
      </>
    )}
  </SettingsCard>
)

export const ProgressionCard = ({ course, config, onSaved, onDirtyChange }: CardProps) => {
  const { message } = App.useApp()
  const [quizLessons, setQuizLessons] = useState<Lesson[]>([])

  useEffect(() => {
    getCourseCurriculum(course.id)
      .then(modules =>
        setQuizLessons(
          modules.flatMap(m => m.lessons ?? []).filter(l => l.type === LessonType.QUIZ),
        ),
      )
      .catch(() => void message.warning('Không tải được danh sách bài kiểm tra'))
  }, [course.id, message])

  return (
    <SettingsCard
      title="Tiến trình và hoàn thành"
      description="Thứ tự mở bài và điều kiện để học viên hoàn thành khoá."
      scope="new_enrollments"
      schema={progressionSchema}
      defaultValues={{
        mode: config.progression.mode,
        lessonThresholdPercent: config.completion.lessonThresholdPercent,
        requireAllRequiredLessons: config.completion.requireAllRequiredLessons,
        requiredQuizLessonIds: config.completion.requiredQuizLessonIds,
      }}
      onSaved={onSaved}
      onDirtyChange={onDirtyChange}
      onSubmit={values =>
        updateCourseConfig({
          id: course.id,
          progression: { mode: values.mode },
          completion: {
            lessonThresholdPercent: values.lessonThresholdPercent,
            requireAllRequiredLessons: !!values.requireAllRequiredLessons,
            requiredQuizLessonIds: values.requiredQuizLessonIds ?? [],
          },
        })
      }
    >
      {({ Field }) => (
        <>
          <RadioCardField
            name="mode"
            label="Bài học mở theo cách nào?"
            options={[
              { value: 'free', label: 'Tự do', description: 'Học bài nào trước cũng được.' },
              {
                value: 'sequential',
                label: 'Tuần tự theo bài',
                description: 'Phải hoàn thành bài trước mới mở bài sau.',
              },
              {
                value: 'module_sequential',
                label: 'Tuần tự theo chương',
                description: 'Tự do trong chương, phải xong chương trước mới mở chương sau.',
              },
            ]}
          />
          <div className="grid grid-cols-2 gap-x-6">
            <Field
              name="lessonThresholdPercent"
              label="Ngưỡng hoàn thành bài (%)"
              type="number"
              tooltip="Học viên xem hoặc đọc đủ tỷ lệ này thì bài được tính là hoàn thành."
              fieldProps={{ min: 50, max: 100 }}
            />
            <Field
              name="requireAllRequiredLessons"
              label="Phải hoàn thành mọi bài bắt buộc"
              type="checkbox"
            />
          </div>
          <SelectField
            name="requiredQuizLessonIds"
            label="Bài kiểm tra phải đạt"
            mode="multiple"
            placeholder={quizLessons.length ? 'Chọn bài kiểm tra' : 'Khoá chưa có bài kiểm tra'}
            options={quizLessons.map(l => ({ label: l.title, value: l.id }))}
          />
        </>
      )}
    </SettingsCard>
  )
}

export const ProctoringCard = ({ course, config, onSaved, onDirtyChange }: CardProps) => {
  const { inactivityPause, presenceCheck, enabled } = config.proctoring
  const defaultValues: ProctoringFormValues = {
    proctoringEnabled: enabled,
    proctoringInactivityEnabled: inactivityPause.enabled,
    proctoringInactivityMinutes: inactivityPause.thresholdMinutes,
    proctoringPresenceEnabled: presenceCheck.enabled,
    proctoringCameraRequired: presenceCheck.cameraRequired,
    proctoringRandomMode: presenceCheck.mode === 'random',
    proctoringIntervalMinutes: presenceCheck.intervalMinutes,
    proctoringRandomMinMinutes: presenceCheck.randomMinMinutes,
    proctoringRandomMaxMinutes: presenceCheck.randomMaxMinutes,
    proctoringMaxChecksPerVideo: presenceCheck.maxChecksPerVideo,
  }
  return (
    <SettingsCard
      title="Giám sát học tập"
      description="Áp dụng cho bài video chưa hoàn thành. Hai cơ chế hoạt động độc lập."
      scope="everyone"
      schema={proctoringSchema}
      defaultValues={defaultValues}
      onSaved={onSaved}
      onDirtyChange={onDirtyChange}
      onSubmit={values =>
        updateCourseConfig({
          id: course.id,
          proctoring: {
            enabled: !!values.proctoringEnabled,
            inactivityPause: {
              enabled: !!values.proctoringInactivityEnabled,
              thresholdMinutes: values.proctoringInactivityMinutes ?? 3,
            },
            presenceCheck: {
              enabled: !!values.proctoringPresenceEnabled,
              cameraRequired: !!values.proctoringCameraRequired,
              mode: values.proctoringRandomMode ? 'random' : 'fixed',
              intervalMinutes: values.proctoringIntervalMinutes ?? 20,
              randomMinMinutes: values.proctoringRandomMinMinutes ?? 15,
              randomMaxMinutes: values.proctoringRandomMaxMinutes ?? 30,
              maxChecksPerVideo: values.proctoringMaxChecksPerVideo ?? 3,
            },
          },
        })
      }
    >
      {({ Field }) => <ProctoringSection Field={Field} />}
    </SettingsCard>
  )
}

export const CertificateCard = ({ course, config, onSaved, onDirtyChange }: CardProps) => (
  <SettingsCard
    title="Chứng chỉ"
    description="Học viên có nhận chứng chỉ khi hoàn thành khoá hay không."
    scope="new_enrollments"
    schema={certificateSchema}
    defaultValues={{
      enabled: config.certificate.enabled,
      cmeCredits: config.certificate.cmeCredits,
      certifyingOrganization: config.certificate.certifyingOrganization,
    }}
    onSaved={onSaved}
    onDirtyChange={onDirtyChange}
    onSubmit={values =>
      updateCourseConfig({
        id: course.id,
        certificate: {
          enabled: !!values.enabled,
          cmeCredits: values.cmeCredits ?? null,
          certifyingOrganization: values.certifyingOrganization || null,
        },
      })
    }
  >
    {({ Field }) => (
      <div className="grid grid-cols-2 gap-x-6">
        <Field name="enabled" label="Cấp chứng chỉ" type="checkbox" className="col-span-2" />
        <Field
          name="cmeCredits"
          label="Tín chỉ CME"
          type="number"
          placeholder="Không có"
          fieldProps={{ min: 0 }}
        />
        <Field name="certifyingOrganization" label="Tổ chức cấp chứng chỉ" type="text" />
      </div>
    )}
  </SettingsCard>
)
