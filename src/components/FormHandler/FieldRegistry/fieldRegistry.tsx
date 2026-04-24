import { PriceInput } from '@/components/InputVariants/PriceInput'
import { Checkbox, DatePicker, Input, InputNumber } from 'antd'
import dayjs from 'dayjs'
import type { ControllerRenderProps, FieldValues } from 'react-hook-form'
import type { FieldPropsOf, FieldType } from './fieldTypes'

/**
 * Props được inject tự động vào mỗi renderer — dev không truyền những props này:
 *   field        → binding từ react-hook-form (value, onChange, onBlur, ref, name)
 *   disabled     → từ FormHandler (isSubmitting || prop)
 *   placeholder  → từ FormFieldConfig.placeholder
 *
 * Dev chỉ can thiệp qua fieldProps (xem fieldTypes.ts).
 */
export type FieldRendererProps<T extends FieldType> = {
  field: ControllerRenderProps<FieldValues, string>
  disabled?: boolean
  placeholder?: string
  status?: 'error' | 'warning'
  fieldProps?: FieldPropsOf<T>
}

type FieldRenderer<T extends FieldType> = (props: FieldRendererProps<T>) => React.ReactNode

export const fieldRegistry: { [K in FieldType]: FieldRenderer<K> } = {
  text: ({ field, disabled, placeholder, fieldProps }) => (
    <Input {...fieldProps} {...field} disabled={disabled} placeholder={placeholder} />
  ),

  email: ({ field, disabled, placeholder, fieldProps }) => (
    <Input {...fieldProps} {...field} type="email" disabled={disabled} placeholder={placeholder} />
  ),

  password: ({ field, disabled, placeholder, fieldProps }) => (
    <Input.Password
      {...fieldProps}
      {...field}
      disabled={disabled}
      placeholder={placeholder}
      autoComplete="new-password"
    />
  ),

  textarea: ({ field, disabled, placeholder, fieldProps }) => (
    <Input.TextArea
      {...fieldProps}
      {...field}
      disabled={disabled}
      placeholder={placeholder}
      rows={fieldProps?.rows ?? 4}
    />
  ),

  number: ({ field, disabled, placeholder, fieldProps }) => (
    <InputNumber
      {...fieldProps}
      value={field.value as number}
      onChange={field.onChange}
      onBlur={field.onBlur}
      disabled={disabled}
      placeholder={placeholder}
      className="w-full"
    />
  ),

  date: ({ field, disabled, fieldProps }) => (
    <DatePicker
      {...fieldProps}
      value={field.value ? dayjs(field.value as string) : null}
      onChange={date => field.onChange(date && !Array.isArray(date) ? date.toISOString() : null)}
      onBlur={field.onBlur}
      disabled={disabled}
    />
  ),

  checkbox: ({ field, disabled, fieldProps }) => (
    <Checkbox
      {...fieldProps}
      checked={field.value as boolean}
      onChange={e => field.onChange(e.target.checked)}
      onBlur={field.onBlur}
      disabled={disabled}
    />
  ),

  price: ({ field, disabled, placeholder, status, fieldProps }) => (
    <PriceInput
      value={field.value as number}
      onChange={field.onChange}
      onBlur={field.onBlur}
      disabled={disabled}
      placeholder={placeholder}
      status={status}
      currency={fieldProps?.currency}
      className={fieldProps?.className}
    />
  ),
}
