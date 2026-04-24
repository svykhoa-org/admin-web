import { Form } from 'antd'
import type { Control, FieldValues, Path } from 'react-hook-form'
import { useController } from 'react-hook-form'
import { fieldRegistry } from './FieldRegistry/fieldRegistry'
import type { FieldTypeConfig } from './FieldRegistry/fieldTypes'

type BaseFormFieldConfig<TValues extends FieldValues> = {
  name: Path<TValues>
  label?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  className?: string
  tooltip?: React.ReactNode
}

/**
 * Config đầy đủ của một field = common props + discriminated union theo `type`.
 *
 * TypeScript tự narrow `fieldProps` dựa vào giá trị của `type`:
 * ```tsx
 * <Field type="number" fieldProps={{ min: 0, step: 1000 }} />   // min, step là InputNumber props
 * <Field type="textarea" fieldProps={{ rows: 6 }} />            // rows là TextArea props
 * ```
 */
export type FormFieldConfig<TValues extends FieldValues> = BaseFormFieldConfig<TValues> &
  FieldTypeConfig

// Dùng `type` thay vì `interface extends` vì FormFieldConfig là union type
type FormFieldProps<TValues extends FieldValues> = FormFieldConfig<TValues> & {
  control: Control<TValues>
}

export const FormField = <TValues extends FieldValues>(props: FormFieldProps<TValues>) => {
  const {
    name,
    label,
    placeholder,
    required,
    disabled: disabledProp,
    className,
    tooltip,
    control,
  } = props

  const {
    field,
    fieldState: { error },
    formState: { isSubmitting },
  } = useController({ name, control })

  const isDisabled = isSubmitting || !!disabledProp
  const resolvedPlaceholder = placeholder || label

  const renderer = fieldRegistry[props.type]
  const inputNode = renderer({
    field: field as Parameters<typeof fieldRegistry.text>[0]['field'],
    disabled: isDisabled,
    placeholder: resolvedPlaceholder,
    status: error ? 'error' : undefined,
    fieldProps: props.fieldProps as never,
  })

  return (
    <Form.Item
      label={label}
      validateStatus={error ? 'error' : ''}
      help={error?.message}
      required={required}
      className={className}
      tooltip={tooltip}
    >
      {inputNode}
    </Form.Item>
  )
}
