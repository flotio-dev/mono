import i18n from 'i18next';

// Load translation JSONs from public/locales (ES import so ESLint is happy)
import en from '../public/locales/en/common.json';
import fr from '../public/locales/fr/common.json';

const baseConfig = {
  resources: {
    en: { common: en },
    fr: { common: fr },
  },
  lng: 'fr',
  fallbackLng: 'fr',
  ns: ['common'],
  defaultNS: 'common',
  interpolation: { escapeValue: false },
};

// On the server, do a minimal i18next init without react-i18next to avoid importing
// client-only code during SSR/build.
if (typeof window === 'undefined') {
  if (!i18n.isInitialized) {
    i18n.init(baseConfig).catch((err) => console.error('i18n init error (server)', err));
  }
} else {
  // On the client, dynamically import react-i18next and initialize with the plugin.
  (async () => {
    try {
      const { initReactI18next } = await import('react-i18next');
      if (!i18n.isInitialized) {
        i18n.use(initReactI18next).init({
          ...baseConfig,
          react: { useSuspense: false },
        });
      } else {
        // If already init on server, ensure react plugin is applied
        i18n.use(initReactI18next);
      }
    } catch (err) {
      console.error('i18n client init error', err);
    }
  })();
}

export default i18n;
