import i18next from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import { vi } from './locales/vi/_index'
import { Language } from '@/models/enum/Language'

export const SearchParamKey = 'lang'

const resources = {
  vi,
}

const defaultNS = 'CommonLocales'

i18next
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    defaultNS,
    fallbackLng: Language.VI,
    returnNull: false,
    interpolation: {
      escapeValue: false,
      defaultVariables: {
        name: '',
      },
    },
    detection: {
      lookupQuerystring: SearchParamKey,
    },
  })

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: typeof defaultNS
    resources: (typeof resources)['vi']
  }
}

export default i18next
