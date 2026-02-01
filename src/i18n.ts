import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en/translation.json';
import es from './locales/es/translation.json';

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            en: {
                translation: en
            },
            es: {
                translation: es
            }
        },
        fallbackLng: 'es', // Spanish by default
        debug: import.meta.env.DEV, // Debug only in development

        interpolation: {
            escapeValue: false // React escapes by default
        }
    });

export default i18n;
