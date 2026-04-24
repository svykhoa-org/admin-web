import enUS from 'antd/locale/en_US'
import viVN from 'antd/locale/vi_VN'
import type { Locale as AntdLanguage } from 'antd/es/locale'

export enum Language {
  EN = 'en',
  VI = 'vi',
}

export const LanguageMappingToAntdLocale: Record<Language, AntdLanguage> = {
  [Language.EN]: enUS,
  [Language.VI]: viVN,
}
