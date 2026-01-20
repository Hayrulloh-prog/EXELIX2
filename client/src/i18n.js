import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { ru, ky, en } from './locales/index.js';

i18n.use(initReactI18next).init({
  resources: { ru, ky, en },
  lng: localStorage.getItem('exelix_lang') || 'ru',
  fallbackLng: 'ru',
  interpolation: { escapeValue: false },
});

export default i18n;
