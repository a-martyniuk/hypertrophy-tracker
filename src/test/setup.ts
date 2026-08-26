import '@testing-library/jest-dom';
import { vi } from 'vitest';
import es from '../locales/es/translation.json';

const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : undefined), obj);
};

vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string, options?: any) => {
            const val = getNestedValue(es, key);
            return val || options?.defaultValue || key;
        },
        i18n: {
            language: 'es',
            changeLanguage: () => Promise.resolve(),
        },
    }),
}));

