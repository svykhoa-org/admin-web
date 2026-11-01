import type { FC } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'

import type { FormFieldConfig } from '@/components/FormHandler/FormField'

import type { EnrollmentFormValues } from '../schemas/courseFormSchema'

interface ScheduleSectionProps {
  Field: FC<FormFieldConfig<EnrollmentFormValues>>
}

/**
 * Lịch trình khoá học theo đợt (cohort). Khi bật `isScheduled`, các mốc ngày dưới
 * đây điều phối vòng đời: cửa sổ đăng ký, ngày khai giảng (chặn học trước đó), ngày
 * kết thúc (chỉ cấp bằng nếu hoàn thành trước đó). Các field ngày chỉ hiện khi bật.
 */
export function ScheduleSection({ Field }: ScheduleSectionProps) {
  const { control } = useFormContext<EnrollmentFormValues>()
  const isScheduled = useWatch({ control, name: 'isScheduled' })

  const dateProps = {
    showTime: true,
    format: 'DD/MM/YYYY HH:mm',
    className: 'w-full',
  } as const

  return (
    <>
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-x-6 gap-y-0">
        <Field
          name="isScheduled"
          label="Khoá học theo đợt"
          type="checkbox"
          tooltip="Học viên chỉ đăng ký trong cửa sổ đăng ký, chỉ học được từ ngày khai giảng, và chỉ được cấp bằng nếu hoàn thành trước ngày kết thúc."
        />
      </div>

      {isScheduled && (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-x-6 gap-y-0">
          <Field
            name="registrationStart"
            label="Bắt đầu đăng ký"
            type="date"
            fieldProps={dateProps}
          />
          <Field
            name="registrationEnd"
            label="Kết thúc đăng ký"
            type="date"
            fieldProps={dateProps}
          />
          <Field name="startDate" label="Ngày khai giảng" type="date" fieldProps={dateProps} />
          <Field name="endDate" label="Ngày kết thúc" type="date" fieldProps={dateProps} />
        </div>
      )}
    </>
  )
}
