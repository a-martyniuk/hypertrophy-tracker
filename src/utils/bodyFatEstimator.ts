/**
 * US Navy Body Fat Percentage Calculator
 * Reference: Department of Defense Body Fat Estimation Equations (Hodgdon & Beckett, 1984)
 */

export interface BodyFatCalculationInput {
    sex: 'male' | 'female';
    heightCm: number;
    neckCm: number;
    waistCm: number;
    hipsCm?: number; // Required for women
}

export interface BodyFatResult {
    bodyFatPercent: number;
    category: string;
    categoryColor: string;
    fatMassKg?: number;
    leanMassKg?: number;
    isValid: boolean;
    missingFields: string[];
}

export const calculateUSNavyBodyFat = (
    input: BodyFatCalculationInput,
    weightKg?: number
): BodyFatResult => {
    const { sex, heightCm, neckCm, waistCm, hipsCm } = input;
    const missingFields: string[] = [];

    if (!heightCm || heightCm <= 0) missingFields.push('Altura');
    if (!neckCm || neckCm <= 0) missingFields.push('Cuello');
    if (!waistCm || waistCm <= 0) missingFields.push('Cintura');
    if (sex === 'female' && (!hipsCm || hipsCm <= 0)) missingFields.push('Cadera');

    if (missingFields.length > 0) {
        return {
            bodyFatPercent: 0,
            category: 'Incompleto',
            categoryColor: '#94a3b8',
            isValid: false,
            missingFields
        };
    }

    let bf = 0;

    if (sex === 'male') {
        const diff = waistCm - neckCm;
        if (diff <= 0) {
            return {
                bodyFatPercent: 0,
                category: 'Cintura debe ser mayor a cuello',
                categoryColor: '#ef4444',
                isValid: false,
                missingFields: ['Cintura > Cuello']
            };
        }
        // Formula for Men (metric cm)
        // 495 / (1.0324 - 0.19077 * log10(waist - neck) + 0.15456 * log10(height)) - 450
        const denom = 1.0324 - 0.19077 * Math.log10(diff) + 0.15456 * Math.log10(heightCm);
        bf = 495 / denom - 450;
    } else {
        const sum = (waistCm + (hipsCm || 0)) - neckCm;
        if (sum <= 0) {
            return {
                bodyFatPercent: 0,
                category: 'Suma de cintura + cadera debe ser mayor a cuello',
                categoryColor: '#ef4444',
                isValid: false,
                missingFields: ['(Cintura+Cadera) > Cuello']
            };
        }
        // Formula for Women (metric cm)
        // 495 / (1.29579 - 0.35004 * log10(waist + hips - neck) + 0.22100 * log10(height)) - 450
        const denom = 1.29579 - 0.35004 * Math.log10(sum) + 0.22100 * Math.log10(heightCm);
        bf = 495 / denom - 450;
    }

    // Clamp to realistic human range (3% to 60%)
    const clampedBf = Math.max(3, Math.min(60, parseFloat(bf.toFixed(1))));

    // Determine category based on ACE (American Council on Exercise) guidelines
    let category = 'Promedio';
    let categoryColor = '#fbbf24';

    if (sex === 'male') {
        if (clampedBf < 6) {
            category = 'Grasa Esencial';
            categoryColor = '#f43f5e';
        } else if (clampedBf <= 13) {
            category = 'Atleta (Competición)';
            categoryColor = '#34d399';
        } else if (clampedBf <= 17) {
            category = 'Fitness / Definido';
            categoryColor = '#38bdf8';
        } else if (clampedBf <= 24) {
            category = 'Aceptable / Promedio';
            categoryColor = '#fbbf24';
        } else {
            category = 'Elevado / Volumen';
            categoryColor = '#f97316';
        }
    } else {
        if (clampedBf < 14) {
            category = 'Grasa Esencial';
            categoryColor = '#f43f5e';
        } else if (clampedBf <= 20) {
            category = 'Atleta (Competición)';
            categoryColor = '#34d399';
        } else if (clampedBf <= 24) {
            category = 'Fitness / Definida';
            categoryColor = '#38bdf8';
        } else if (clampedBf <= 31) {
            category = 'Aceptable / Promedio';
            categoryColor = '#fbbf24';
        } else {
            category = 'Elevado / Volumen';
            categoryColor = '#f97316';
        }
    }

    const fatMassKg = weightKg ? parseFloat(((weightKg * clampedBf) / 100).toFixed(1)) : undefined;
    const leanMassKg = (weightKg && fatMassKg !== undefined) ? parseFloat((weightKg - fatMassKg).toFixed(1)) : undefined;

    return {
        bodyFatPercent: clampedBf,
        category,
        categoryColor,
        fatMassKg,
        leanMassKg,
        isValid: true,
        missingFields: []
    };
};
