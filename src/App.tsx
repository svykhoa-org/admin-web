import { App as AntdApp, ConfigProvider } from 'antd'
import { I18nextProvider, useTranslation } from 'react-i18next'
import { RouterProvider } from 'react-router-dom'
import i18 from './i18n'
import { LanguageMappingToAntdLocale } from './models/enum/Language'
import router from './router'

export const App = () => {
  const { i18n } = useTranslation()

  return (
    <I18nextProvider i18n={i18}>
      <ConfigProvider
        locale={
          LanguageMappingToAntdLocale[i18n.language as keyof typeof LanguageMappingToAntdLocale]
        }
        theme={{
          token: {
            colorPrimary: '#1677ff',
            borderRadius: 6,
            fontFamily: "'Gilroy', 'Be Vietnam Pro', sans-serif",
          },
          components: {
            Menu: {
              itemSelectedColor: '#1677ff',
              itemSelectedBg: 'rgba(22, 119, 255, 0.08)',
            },
          },
        }}
      >
        <AntdApp>
          <RouterProvider router={router} />
        </AntdApp>
      </ConfigProvider>
    </I18nextProvider>
  )
}
