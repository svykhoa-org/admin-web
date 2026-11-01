import { Form, Radio, Select, theme, type SelectProps } from 'antd'
import { useController, useFormContext } from 'react-hook-form'

interface SelectFieldProps extends Pick<
  SelectProps,
  'mode' | 'options' | 'placeholder' | 'allowClear' | 'className'
> {
  name: string
  label: string
  tooltip?: string
}

/** FormHandler has no select field type; these bind antd controls to the same form state. */
export const SelectField = ({ name, label, tooltip, className, ...props }: SelectFieldProps) => {
  const { control } = useFormContext()
  const { field } = useController({ name, control })
  return (
    <Form.Item label={label} tooltip={tooltip} className={className}>
      <Select
        {...props}
        showSearch={{ optionFilterProp: 'label' }}
        value={field.value ?? undefined}
        onChange={value => field.onChange(value ?? null)}
        onBlur={field.onBlur}
      />
    </Form.Item>
  )
}

interface RadioFieldProps {
  name: string
  label: string
  options: { value: string; label: string; description: string; disabled?: boolean }[]
}

export const RadioCardField = ({ name, label, options }: RadioFieldProps) => {
  const { token } = theme.useToken()
  const { control } = useFormContext()
  const { field } = useController({ name, control })
  return (
    <Form.Item label={label}>
      <Radio.Group
        className="w-full"
        value={field.value}
        onChange={event => field.onChange(event.target.value)}
      >
        <div className="flex flex-col gap-2">
          {options.map(option => (
            <Radio
              key={option.value}
              value={option.value}
              disabled={option.disabled}
              className="rounded-lg border border-solid p-3"
              style={{ borderColor: token.colorBorder }}
            >
              <div className="font-medium">{option.label}</div>
              <div className="text-sm opacity-70">{option.description}</div>
            </Radio>
          ))}
        </div>
      </Radio.Group>
    </Form.Item>
  )
}
