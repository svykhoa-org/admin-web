import { Button, Space, Typography } from 'antd'
import { useTranslation } from 'react-i18next'
import { useFormHandlerStore } from './formHandlerStore'

interface FormHeaderProps {
  formId: string
  entityName: string
  isEditMode: boolean
  onCancel?: () => void
}

export const FormHeader = ({ formId, entityName, isEditMode, onCancel }: FormHeaderProps) => {
  const { t } = useTranslation(['CommonLocales'])
  const isLoading = useFormHandlerStore(state => state.formLoadings[formId] ?? false)

  const title = isEditMode
    ? t('CommonLocales:update_title', { entity: entityName.toLowerCase() })
    : t('CommonLocales:create_title', { entity: entityName.toLowerCase() })

  return (
    <div className="flex items-center justify-between mb-6">
      <Typography.Title level={4} style={{ margin: 0 }}>
        {title}
      </Typography.Title>
      <Space>
        {onCancel && (
          <Button disabled={isLoading} onClick={onCancel}>
            {t('CommonLocales:cancel')}
          </Button>
        )}
        <Button type="primary" htmlType="submit" loading={isLoading}>
          {isEditMode ? t('CommonLocales:update') : t('CommonLocales:create')}
        </Button>
      </Space>
    </div>
  )
}
