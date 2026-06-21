import { Typography } from 'antd'
import type { FC } from 'react'
import { useFormContext, useWatch } from 'react-hook-form'

import type { FormFieldConfig } from '@/components/FormHandler/FormField'

import type { CourseFormValues } from '../schemas/courseFormSchema'

interface ProctoringSectionProps {
  Field: FC<FormFieldConfig<CourseFormValues>>
}

/**
 * Cấu hình giám sát học tập — TÁCH BIỆT 2 cơ chế độc lập:
 *  (1) Tạm dừng khi không thao tác: giữ người dùng luôn tương tác (chỉ pause, không ảnh).
 *  (2) Kiểm tra hiện diện qua camera: chống học hộ, nhịp riêng & thưa hơn (1).
 * Mỗi cơ chế có công tắc bật/tắt riêng; hiển thị có điều kiện theo trạng thái.
 */
export function ProctoringSection({ Field }: ProctoringSectionProps) {
  const { control } = useFormContext<CourseFormValues>()
  const enabled = useWatch({ control, name: 'proctoringEnabled' })
  const inactivityEnabled = useWatch({ control, name: 'proctoringInactivityEnabled' })
  const presenceEnabled = useWatch({ control, name: 'proctoringPresenceEnabled' })
  const randomMode = useWatch({ control, name: 'proctoringRandomMode' })

  return (
    <>
      <Typography.Title level={5} style={{ margin: 0 }}>
        Giám sát học tập
      </Typography.Title>
      <Typography.Text type="secondary" style={{ marginTop: -8 }}>
        Áp dụng cho bài video chưa hoàn thành. Hai cơ chế dưới đây hoạt động độc lập.
      </Typography.Text>

      <div className="grid grid-cols-4 gap-x-6 gap-y-0">
        <Field name="proctoringEnabled" label="Bật giám sát" type="checkbox" />
      </div>

      {enabled && (
        <>
          {/* ── (1) Tạm dừng khi không thao tác ───────────────── */}
          <Typography.Text strong>1. Tạm dừng khi không thao tác</Typography.Text>
          <Typography.Text type="secondary" style={{ marginTop: -8, fontSize: 12 }}>
            Nếu không có thao tác nào trên màn hình trong khoảng thời gian cấu hình, video sẽ tự tạm
            dừng. Mục tiêu: giữ người dùng luôn tương tác — không chụp ảnh.
          </Typography.Text>
          <div className="grid grid-cols-4 gap-x-6 gap-y-0">
            <Field
              name="proctoringInactivityEnabled"
              label="Bật tạm dừng khi idle"
              type="checkbox"
            />
            {inactivityEnabled && (
              <Field
                name="proctoringInactivityMinutes"
                label="Ngưỡng không thao tác (phút)"
                type="number"
                fieldProps={{ min: 1 }}
                tooltip="Ví dụ 2–5 phút không thao tác → tạm dừng video"
              />
            )}
          </div>

          {/* ── (2) Kiểm tra hiện diện qua camera ─────────────── */}
          <Typography.Text strong>2. Kiểm tra hiện diện qua camera</Typography.Text>
          <Typography.Text type="secondary" style={{ marginTop: -8, fontSize: 12 }}>
            Định kỳ (nhịp riêng, thưa hơn mục 1) mở popup yêu cầu chụp ảnh xác nhận. Mục tiêu: chống
            nhờ người khác học hộ.
          </Typography.Text>
          <div className="grid grid-cols-4 gap-x-6 gap-y-0">
            <Field name="proctoringPresenceEnabled" label="Bật kiểm tra camera" type="checkbox" />
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
                    tooltip="Mỗi lần check cách nhau số phút này (ví dụ 20–30 phút)"
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
