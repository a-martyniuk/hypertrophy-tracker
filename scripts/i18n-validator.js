import fs from 'fs';
import path from 'path';

const localesDir = path.resolve('src/locales');
const enFile = path.join(localesDir, 'en/translation.json');
const esFile = path.join(localesDir, 'es/translation.json');

function getKeys(obj, prefix = '') {
    return Object.keys(obj).reduce((res, el) => {
        if (Array.isArray(obj[el])) {
            return res;
        } else if (typeof obj[el] === 'object' && obj[el] !== null) {
            return [...res, ...getKeys(obj[el], prefix + el + '.')];
        }
        return [...res, prefix + el];
    }, []);
}

try {
    const en = JSON.parse(fs.readFileSync(enFile, 'utf8'));
    const es = JSON.parse(fs.readFileSync(esFile, 'utf8'));

    const enKeys = getKeys(en);
    const esKeys = getKeys(es);

    const missingInEs = enKeys.filter(k => !esKeys.includes(k));
    const missingInEn = esKeys.filter(k => !enKeys.includes(k));

    let hasError = false;

    if (missingInEs.length > 0) {
        console.error('❌ Keys missing in Spanish (ES):');
        missingInEs.forEach(k => console.error(`  - ${k}`));
        hasError = true;
    }

    if (missingInEn.length > 0) {
        console.error('❌ Keys missing in English (EN):');
        missingInEn.forEach(k => console.error(`  - ${k}`));
        hasError = true;
    }

    if (hasError) {
        process.exit(1);
    } else {
        console.log('✅ i18n Validation Passed: Keys are synced.');
    }
} catch (error) {
    console.error('❌ Error reading translation files:', error.message);
    process.exit(1);
}
