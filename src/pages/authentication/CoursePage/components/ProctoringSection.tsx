import { Typography } from 'antd'
import type { FC } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'

import type { FormFieldConfig } from '@/components/FormHandler/FormField'

import type { CourseFormValues } from '../schemas/courseFormSchema'

interface ProctoringSectionProps {
  Field: FC<FormFieldConfig<CourseFormValues>>
}

/**
 * Cấu hình giám sát học tập với hiển thị có điều kiện:
 *  - Tắt giám sát   → ẩn toàn bộ cấu hình con.
 *  - Tắt check hiện diện → ẩn cấu hình liên quan tới popup chụp ảnh.
 *  - Khoảng cách cố định / ngẫu nhiên → chỉ hiện cấu hình tương ứng.
 */
export function ProctoringSection({ Field }: ProctoringSectionProps) {
  const { control } = useFormContext<CourseFormValues>()
  const enabled = useWatch({ control, name: 'proctoringEnabled' })
  const presenceEnabled = useWatch({ control, name: 'proctoringPresenceEnabled' })
  const randomMode = useWatch({ control, name: 'proctoringRandomMode' })

  return (
    <>
      <Typography.Title level={5} style={{ margin: 0 }}>
        Giám sát học tập
      </Typography.Title>
      <Typography.Text type="secondary" style={{ marginTop: -8 }}>
        Áp dụng cho bài video chưa hoàn thành. Tự dừng video khi không thao tác và yêu cầu chụp ảnh
        xác nhận sự hiện diện.
      </Typography.Text>

      <div className="grid grid-cols-4 gap-x-6 gap-y-0">
        <Field name="proctoringEnabled" label="Bật giám sát" type="checkbox" />
      </div>

      {enabled && (
        <>
          <div className="grid grid-cols-4 gap-x-6 gap-y-0">
            <Field
              name="proctoringMaxInactivitySeconds"
              label="Thời gian idle tối đa (giây)"
              type="number"
              fieldProps={{ min: 5 }}
              tooltip="Không thao tác quá ngưỡng này khi đang phát → dừng video"
            />
            <Field
              name="proctoringPresenceEnabled"
              label="Check sự hiện diện"
              type="checkbox"
              tooltip="Mở popup chụp ảnh xác nhận trong khi học"
            />
          </div>

          {presenceEnabled && (
            <>
              <div className="grid grid-cols-4 gap-x-6 gap-y-0">
                <Field
                  name="proctoringCameraRequired"
                  label="Bắt buộc camera"
                  type="checkbox"
                  tooltip="Nếu bật: thiếu ảnh xác nhận sẽ không cho hoàn thành bài học"
                />
                <Field
                  name="proctoringMaxChecksPerVideo"
                  label="Số lần check / video"
                  type="number"
                  fieldProps={{ min: 1 }}
                />
                <Field
                  name="proctoringRandomMode"
                  label="Khoảng cách ngẫu nhiên"
                  type="checkbox"
                  tooltip="Bật: mỗi lần check cách nhau ngẫu nhiên. Tắt: cố định theo số phút."
                />
              </div>

              <div className="grid grid-cols-4 gap-x-6 gap-y-0">
                {randomMode ? (
                  <>
                    <Field
                      name="proctoringRandomMinMinutes"
                      label="Ngẫu nhiên - tối thiểu (phút)"
                      type="number"
                      fieldProps={{ min: 1 }}
                    />
                    <Field
                      name="proctoringRandomMaxMinutes"
                      label="Ngẫu nhiên - tối đa (phút)"
                      type="number"
                      fieldProps={{ min: 1 }}
                    />
                  </>
                ) : (
                  <Field
                    name="proctoringIntervalMinutes"
                    label="Khoảng cố định (phút)"
                    type="number"
                    fieldProps={{ min: 1 }}
                    tooltip="Mỗi lần check cách nhau số phút này"
                  />
                )}
              </div>
            </>
          )}
        </>
      )}
    </>
  )
}
