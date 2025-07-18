import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enTranslations from '../locales/en/translation.json';
import thTranslations from '../locales/th/translation.json';

const resources = {
  en: {
    translation: enTranslations,
  },
  th: {
    translation: thTranslations,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en', // English as default
    debug: process.env.NODE_ENV === 'development', // Only debug in development
    supportedLngs: ['en', 'th'],

    interpolation: {
      escapeValue: false, // React already escapes values
    },

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'myancamp-language',
      checkWhitelist: true,
    },

    react: {
      useSuspense: false, // Disable suspense for better error handling
    },

    // Add these options to help with debugging
    load: 'languageOnly',
    preload: ['en', 'th'],
    ns: ['translation'],
    defaultNS: 'translation',

    // Force reload and disable caching for debugging
    initImmediate: false,
    keySeparator: '.',
    nsSeparator: ':',
  });

export default i18n;
