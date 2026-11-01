import { FormHandler } from '@/components/FormHandler'
import type { Course } from '@/models/Course'
import { Button, Card, Tag, Typography } from 'antd'
import { useEffect, type ComponentProps, type ReactNode } from 'react'
import type { ZodObject } from 'zod'

export type SettingsScope = 'immediate' | 'new_enrollments' | 'everyone'

const SCOPE: Record<SettingsScope, { label: string; color: string; hint: string }> = {
  immediate: {
    label: 'Áp dụng ngay',
    color: 'blue',
    hint: 'Thay đổi có hiệu lực ngay sau khi lưu.',
  },
  new_enrollments: {
    label: 'Học viên đăng ký mới',
    color: 'gold',
    hint: 'Học viên đã đăng ký vẫn giữ luật tại thời điểm họ đăng ký.',
  },
  everyone: {
    label: 'Mọi học viên, ngay lập tức',
    color: 'red',
    hint: 'Có hiệu lực ngay với cả học viên đang học.',
  },
}

const DirtyReporter = ({
  isDirty,
  onChange,
}: {
  isDirty: boolean
  onChange: (isDirty: boolean) => void
}) => {
  useEffect(() => {
    onChange(isDirty)
    return () => onChange(false)
  }, [isDirty, onChange])
  return null
}

type HandlerProps<TSchema extends ZodObject<any>> = ComponentProps<typeof FormHandler<TSchema>>
type RenderProps<TSchema extends ZodObject<any>> = Parameters<HandlerProps<TSchema>['children']>[0]

interface SettingsCardProps<TSchema extends ZodObject<any>> {
  title: string
  description: string
  scope: SettingsScope
  schema: TSchema
  defaultValues: HandlerProps<TSchema>['defaultValues']
  onSubmit: (values: TSchema['_output']) => Promise<Course>
  onSaved: () => void
  onDirtyChange: (isDirty: boolean) => void
  children: (props: RenderProps<TSchema>) => ReactNode
}

export const SettingsCard = <TSchema extends ZodObject<any>>({
  title,
  description,
  scope,
  schema,
  defaultValues,
  onSubmit,
  onSaved,
  onDirtyChange,
  children,
}: SettingsCardProps<TSchema>) => {
  const { label, color, hint } = SCOPE[scope]
  return (
    <Card title={title} extra={<Tag color={color}>{label}</Tag>}>
      <Typography.Paragraph type="secondary">
        {description} {hint}
      </Typography.Paragraph>
      {/* Remount only when this card's own saved values change, so saving one card
          never discards what is being typed in another. */}
      <FormHandler
        key={JSON.stringify(defaultValues)}
        schema={schema}
        defaultValues={defaultValues}
        isEditMode
        entityName={title}
        onSubmit={onSubmit}
        onSuccess={onSaved}
      >
        {props => (
          <>
            <DirtyReporter isDirty={props.isDirty} onChange={onDirtyChange} />
            {children(props)}
            <div className="flex justify-end">
              <Button
                type="primary"
                htmlType="submit"
                disabled={!props.isDirty}
                loading={props.isSubmitting}
              >
                Lưu
              </Button>
            </div>
          </>
        )}
      </FormHandler>
    </Card>
  )
}
