import type { Namespace, ParseKeys, TFunction } from 'i18next'

type FieldErrorKey =
  | 'invalid'
  | 'required'
  | 'must_be_selected'
  | 'greater_than'
  | 'greater_than_or_equal'
  | 'less_than'
  | 'less_than_or_equal'
  | 'min_length'
  | 'max_length'

type FieldErrorValue = string | number

const getFieldErrorMessage = (
  t: TFunction<Namespace>,
  errorKey: FieldErrorKey,
  fieldKey: ParseKeys<Namespace>,
  value?: FieldErrorValue,
) => {
  return t(`CommonLocales:FieldError.${errorKey}`, {
    field: t(fieldKey),
    value,
  })
}

export const getInvalidMessage = (t: TFunction<Namespace>, key: ParseKeys<Namespace>) => {
  return getFieldErrorMessage(t, 'invalid', key)
}

export const getRequiredMessage = (t: TFunction<Namespace>, key: ParseKeys<Namespace>) => {
  return getFieldErrorMessage(t, 'required', key)
}

export const getMustBeSelectedMessage = (t: TFunction<Namespace>, key: ParseKeys<Namespace>) => {
  return getFieldErrorMessage(t, 'must_be_selected', key)
}

export const getGreaterThanMessage = (
  t: TFunction<Namespace>,
  key: ParseKeys<Namespace>,
  value: FieldErrorValue,
) => {
  return getFieldErrorMessage(t, 'greater_than', key, value)
}

export const getGreaterThanOrEqualMessage = (
  t: TFunction<Namespace>,
  key: ParseKeys<Namespace>,
  value: FieldErrorValue,
) => {
  return getFieldErrorMessage(t, 'greater_than_or_equal', key, value)
}

export const getLessThanMessage = (
  t: TFunction<Namespace>,
  key: ParseKeys<Namespace>,
  value: FieldErrorValue,
) => {
  return getFieldErrorMessage(t, 'less_than', key, value)
}

export const getLessThanOrEqualMessage = (
  t: TFunction<Namespace>,
  key: ParseKeys<Namespace>,
  value: FieldErrorValue,
) => {
  return getFieldErrorMessage(t, 'less_than_or_equal', key, value)
}

export const getMinLengthMessage = (
  t: TFunction<Namespace>,
  key: ParseKeys<Namespace>,
  value: FieldErrorValue,
) => {
  return getFieldErrorMessage(t, 'min_length', key, value)
}

export const getMaxLengthMessage = (
  t: TFunction<Namespace>,
  key: ParseKeys<Namespace>,
  value: FieldErrorValue,
) => {
  return getFieldErrorMessage(t, 'max_length', key, value)
}
