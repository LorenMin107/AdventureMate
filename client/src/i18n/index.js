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

// Initialize i18n synchronously to ensure it's ready before React renders
i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en', // English as default
    debug: false, // Disable debug mode for production
    supportedLngs: ['en', 'th'],

    interpolation: {
      escapeValue: false, // React already escapes values
    },

    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'adventuremate-language',
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
    initImmediate: true, // Initialize immediately
    keySeparator: '.',
    nsSeparator: ':',
  });

// Add error handling for i18n
i18n.on('failedLoading', (lng, ns, msg) => {
  console.error('i18n failed loading:', { lng, ns, msg });
});

i18n.on('loaded', (loaded) => {
  console.log('i18n loaded:', loaded);
});

i18n.on('missingKey', (lngs, namespace, key, res) => {
  console.warn('i18n missing key:', { lngs, namespace, key, res });
});

export default i18n;
