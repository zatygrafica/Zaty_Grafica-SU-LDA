import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './en.json';
import pt from './pt.json';
import { normalizeUtf8Translations } from '../utils/encoding';

const resources = {
  pt: {
    translation: normalizeUtf8Translations(pt),
  },
  en: {
    translation: normalizeUtf8Translations(en),
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'pt',
  fallbackLng: 'pt',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
