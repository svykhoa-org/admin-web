import { Currency, CurrencyConfig } from '@/models/enum/Currency'
import { InputNumber } from 'antd'
import classNames from 'classnames'

export interface PriceInputProps {
  value?: number | null
  onChange?: (value: number | null) => void
  onBlur?: () => void
  currency?: Currency
  disabled?: boolean
  placeholder?: string
  status?: 'error' | 'warning'
  className?: string
}

export const PriceInput = ({
  value,
  onChange,
  onBlur,
  currency = Currency.VND,
  disabled,
  placeholder,
  status,
  className,
}: PriceInputProps) => {
  const config = CurrencyConfig[currency]

  return (
    <InputNumber
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      disabled={disabled}
      placeholder={placeholder}
      status={status}
      precision={config.precision}
      step={config.step}
      min={0}
      formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
      parser={v => Number(v?.replace(/,/g, '') ?? 0)}
      className={classNames(className, 'w-full')}
      suffix={config.symbol}
    />
  )
}
