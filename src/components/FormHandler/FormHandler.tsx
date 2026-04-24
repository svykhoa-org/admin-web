import { zodResolver } from '@hookform/resolvers/zod'
import { App, Form } from 'antd'
import { useCallback, useEffect } from 'react'
import type { DefaultValues, FieldValues, Resolver, SubmitErrorHandler } from 'react-hook-form'
import { FormProvider, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { ZodObject, ZodOptional } from 'zod'
import type { ZodType } from 'zod'
import { isApiResponseError } from '@/utils/apiResponse'
import { FormField, type FormFieldConfig } from './FormField'
import { FormHeader } from './FormHeader'
import { useFormHandlerStore } from './formHandlerStore'
import type { AbstractModel } from '@/models/AbstractModel'

/**
 * Suy ra `required` từ Zod schema theo dot-path.
 *
 * Logic: với path `video.url` trên schema `{ video: z.object({ url: z.string() }).optional() }`:
 * - bóc `ZodOptional` của `video` ra → lấy `ZodObject` bên trong
 * - kiểm tra `url` trong shape đó → `z.string()` không phải `ZodOptional` → required = true
 *
 * Điều này phù hợp với use-case "section optional nhưng các field bên trong vẫn required
 * khi section đó được render" (ví dụ: form lesson có video/quiz section).
 */
const inferRequired = (schema: ZodObject<any>, dotPath: string): boolean => {
  const [head, ...tail] = dotPath.split('.')
  const fieldDef = schema.shape[head] as ZodType | undefined
  if (!fieldDef) return false

  if (tail.length === 0) {
    return !(fieldDef instanceof ZodOptional)
  }

  // Unwrap ZodOptional để lấy inner type, rồi đệ quy vào ZodObject bên trong
  const inner = fieldDef instanceof ZodOptional ? fieldDef.unwrap() : fieldDef
  if (inner instanceof ZodObject) {
    return inferRequired(inner, tail.join('.'))
  }

  return false
}

interface FormHandlerRenderProps<TInput extends FieldValues> {
  Field: React.FC<FormFieldConfig<TInput>> // FormField đã được bind sẵn control và infer required từ schema, sử dụng để render field trong form
  isSubmitting: boolean // Form đang ở trạng thái submitting, có thể dùng để disable field hoặc show loading state
  isDirty: boolean // Form có bị chỉnh sửa so với defaultValues/initialValues hay không, có thể dùng để disable submit button nếu chưa có thay đổi nào
  isValid: boolean // Form có hợp lệ theo validation schema hay không, có thể dùng để disable submit button nếu form đang invalid
  isDisabled: boolean // isSubmitting || disabled prop — dùng cho các element không phải Field (button, custom UI)
}

interface FormHandlerProps<
  TSchema extends ZodObject<any>,
  TResponse extends AbstractModel = AbstractModel,
> {
  schema: TSchema
  defaultValues: DefaultValues<TSchema['_input']>
  resetOnSuccess?: boolean
  showNotification?: boolean
  disabled?: boolean
  formId?: string
  entityName?: string
  isEditMode?: boolean

  onSubmit: (values: TSchema['_output']) => Promise<TResponse>
  onSuccess?: (response: TResponse) => void
  onError?: (error: unknown) => void
  onInvalidSubmit?: SubmitErrorHandler<TSchema['_input']>
  onCancel?: () => void

  children: (props: FormHandlerRenderProps<TSchema['_input']>) => React.ReactNode
}

export const FormHandler = <TSchema extends ZodObject<any>>({
  schema,
  defaultValues,
  onSubmit,
  onSuccess,
  onError,
  onInvalidSubmit,
  resetOnSuccess = false,
  showNotification = true,
  disabled = false,
  formId,
  entityName,
  isEditMode = false,
  onCancel,
  children,
}: FormHandlerProps<TSchema>) => {
  type TInput = TSchema['_input']
  type TOutput = TSchema['_output']

  const { message } = App.useApp()
  const { t } = useTranslation(['CommonLocales'])
  const { setFormLoading } = useFormHandlerStore()

  const methods = useForm<TInput, unknown, TOutput>({
    resolver: zodResolver(schema) as unknown as Resolver<TInput, unknown, TOutput>,
    defaultValues,
    mode: 'onTouched',
  })

  const {
    handleSubmit,
    reset,
    control,
    formState: { isSubmitting, isDirty, isValid },
  } = methods

  // Sync isSubmitting → formHandlerStore so FormHeader can read loading state
  useEffect(() => {
    if (!formId) return
    setFormLoading({ formId, loading: isSubmitting })
  }, [formId, isSubmitting, setFormLoading])

  const handleFormSubmit = handleSubmit(async submitValues => {
    try {
      const response = await onSubmit(submitValues)
      if (showNotification) {
        const key = isEditMode ? 'update_success' : 'create_success'
        void message.success(
          entityName
            ? t(`CommonLocales:${key}`, { entity: entityName })
            : t('CommonLocales:success'),
        )
      }
      onSuccess?.(response)
      if (resetOnSuccess) reset()
    } catch (error) {
      if (showNotification) {
        const msg = isApiResponseError(error) ? error.message : t('CommonLocales:request_error')
        void message.error(msg)
      }
      onError?.(error)
    }
  }, onInvalidSubmit)

  const isDisabled = isSubmitting || disabled

  const Field = useCallback(
    (props: FormFieldConfig<TInput>) => {
      const isRequired = props.required ?? inferRequired(schema, props.name as string)
      return (
        <FormField
          control={control}
          {...props}
          required={isRequired}
          disabled={isDisabled || props.disabled}
        />
      )
    },
    [control, schema, isDisabled],
  ) as React.FC<FormFieldConfig<TInput>>

  return (
    <FormProvider {...methods}>
      <Form layout="vertical" onFinish={handleFormSubmit}>
        {formId && entityName && (
          <FormHeader
            formId={formId}
            entityName={entityName}
            isEditMode={isEditMode}
            onCancel={onCancel}
          />
        )}
        {children({ Field, isSubmitting, isDirty, isValid, isDisabled })}
      </Form>
    </FormProvider>
  )
}
