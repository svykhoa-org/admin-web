import type { Currency } from '@/models/enum/Currency'
import type { CheckboxProps, DatePickerProps, Input, InputNumberProps, InputProps } from 'antd'

/**
 * Props được FormHandler quản lý nội bộ — dev KHÔNG override:
 *   value, onChange, onBlur  → react-hook-form controller
 *   disabled                 → FormHandler (isSubmitting || prop)
 *   placeholder              → FormFieldConfig.placeholder (top-level)
 */
type ManagedInputProps = 'value' | 'onChange' | 'onBlur' | 'disabled' | 'placeholder'

export type TextField = {
  type: 'text'
  fieldProps?: Omit<InputProps, ManagedInputProps>
}

export type EmailField = {
  type: 'email'
  fieldProps?: Omit<InputProps, ManagedInputProps | 'type'>
}

export type PasswordField = {
  type: 'password'
  fieldProps?: Omit<React.ComponentProps<typeof Input.Password>, ManagedInputProps>
}

export type TextareaField = {
  type: 'textarea'
  fieldProps?: Omit<React.ComponentProps<typeof Input.TextArea>, ManagedInputProps>
}

export type NumberField = {
  type: 'number'
  fieldProps?: Omit<InputNumberProps<number>, ManagedInputProps>
}

export type DateField = {
  type: 'date'
  fieldProps?: Omit<DatePickerProps, 'value' | 'onChange' | 'onBlur' | 'disabled'>
}

export type CheckboxField = {
  type: 'checkbox'
  fieldProps?: Omit<CheckboxProps, 'checked' | 'onChange' | 'onBlur' | 'disabled'>
}

export type PriceField = {
  type: 'price'
  fieldProps?: {
    currency?: Currency
    className?: string
  }
}

export type FieldTypeConfig =
  | TextField
  | EmailField
  | PasswordField
  | TextareaField
  | NumberField
  | DateField
  | CheckboxField
  | PriceField

export type FieldType = FieldTypeConfig['type']

/** Lấy fieldProps type từ một FieldType cụ thể */
export type FieldPropsOf<T extends FieldType> =
  Extract<FieldTypeConfig, { type: T }> extends { fieldProps?: infer P } ? P : never
