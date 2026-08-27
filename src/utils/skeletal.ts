export const CASEY_BUTT_CONSTANTS = {
    chest: { wrist: 1.6817, ankle: 1.3759, height: 0.3314 },
    biceps: { wrist: 1.2033, height: 0.1236 },
    forearms: { wrist: 0.9626, height: 0.0989 },
    neck: { wrist: 1.1424, height: 0.1236 },
    thighs: { ankle: 1.3868, height: 0.1805 },
    calves: { ankle: 0.9298, height: 0.1210 }
};

export const FEMALE_MODIFIERS = {
    chest: 0.85,
    biceps: 0.70,
    forearms: 0.70,
    neck: 0.75,
    thighs: 0.90,
    calves: 0.90
};

export interface SkeletalPotential {
    chest: number;
    biceps: number;
    forearms: number;
    neck: number;
    thighs: number;
    calves: number;
}

export const calculateSkeletalPotential = (
    wrist: number,
    ankle: number,
    height: number,
    sex: 'male' | 'female'
): SkeletalPotential => {
    // Convert to Imperial (Inches)
    const W = wrist / 2.54;
    const A = ankle / 2.54;
    const H = height / 2.54;

    let chestIn = CASEY_BUTT_CONSTANTS.chest.wrist * W + CASEY_BUTT_CONSTANTS.chest.ankle * A + CASEY_BUTT_CONSTANTS.chest.height * H;
    let bicepsIn = CASEY_BUTT_CONSTANTS.biceps.wrist * W + CASEY_BUTT_CONSTANTS.biceps.height * H;
    let forearmsIn = CASEY_BUTT_CONSTANTS.forearms.wrist * W + CASEY_BUTT_CONSTANTS.forearms.height * H;
    let neckIn = CASEY_BUTT_CONSTANTS.neck.wrist * W + CASEY_BUTT_CONSTANTS.neck.height * H;
    let thighsIn = CASEY_BUTT_CONSTANTS.thighs.ankle * A + CASEY_BUTT_CONSTANTS.thighs.height * H;
    let calvesIn = CASEY_BUTT_CONSTANTS.calves.ankle * A + CASEY_BUTT_CONSTANTS.calves.height * H;

    if (sex === 'female') {
        chestIn *= FEMALE_MODIFIERS.chest;
        bicepsIn *= FEMALE_MODIFIERS.biceps;
        forearmsIn *= FEMALE_MODIFIERS.forearms;
        neckIn *= FEMALE_MODIFIERS.neck;
        thighsIn *= FEMALE_MODIFIERS.thighs;
        calvesIn *= FEMALE_MODIFIERS.calves;
    }

    return {
        chest: parseFloat((chestIn * 2.54).toFixed(1)),
        biceps: parseFloat((bicepsIn * 2.54).toFixed(1)),
        forearms: parseFloat((forearmsIn * 2.54).toFixed(1)),
        neck: parseFloat((neckIn * 2.54).toFixed(1)),
        thighs: parseFloat((thighsIn * 2.54).toFixed(1)),
        calves: parseFloat((calvesIn * 2.54).toFixed(1)),
    };
};

export const calculateIEO = (wrist: number, ankle: number, sex: 'male' | 'female') => {
    const ieo = (wrist + ankle) / 2;
    let label = '';
    let isAdvantage = false;

    const ranges = sex === 'female'
        ? { small: 16, med: 18, large: 20 }
        : { small: 18, med: 20, large: 22 };

    if (ieo < ranges.small) {
        label = 'small';
    } else if (ieo < ranges.med) {
        label = 'medium';
    } else if (ieo < ranges.large) {
        label = 'large';
        isAdvantage = true;
    } else {
        label = 'very_large';
        isAdvantage = true;
    }

    return { value: ieo.toFixed(1), label, isAdvantage, rawValue: ieo };
};

export interface FFMIResult {
    rawFFMI: number;
    normalizedFFMI: number;
    leanMassKg: number;
    fatMassKg: number;
    categoryKey: string;
    scorePercent: number; // 0 to 100 on natural scale (15 to 25)
}

export const calculateFFMI = (
    weight: number,
    height: number,
    bodyFat: number,
    sex: 'male' | 'female' = 'male'
): FFMIResult | null => {
    if (!weight || !height || weight <= 0 || height <= 0) return null;
    const defaultBf = sex === 'female' ? 22 : 15;
    const bf = Math.max(3, Math.min(60, bodyFat || defaultBf));
    const leanMassKg = weight * (1 - bf / 100);
    const fatMassKg = weight - leanMassKg;
    const heightM = height / 100;

    const rawFFMI = leanMassKg / (heightM * heightM);
    // Normalized FFMI formula by Kouri et al. (normalizes to 1.8m standard height)
    const normalizedFFMI = rawFFMI + 6.1 * (1.8 - heightM);

    let categoryKey = 'average';
    let scorePercent = 0;

    if (sex === 'female') {
        if (normalizedFFMI < 14) categoryKey = 'below_average';
        else if (normalizedFFMI < 16) categoryKey = 'average';
        else if (normalizedFFMI < 18) categoryKey = 'athletic';
        else if (normalizedFFMI < 20) categoryKey = 'advanced';
        else if (normalizedFFMI < 22) categoryKey = 'natural_limit';
        else categoryKey = 'exceptional';

        // 12 = 0%, 22 = 100%
        scorePercent = Math.min(100, Math.max(0, ((normalizedFFMI - 12) / 10) * 100));
    } else {
        if (normalizedFFMI < 18) categoryKey = 'below_average';
        else if (normalizedFFMI < 20) categoryKey = 'average';
        else if (normalizedFFMI < 22) categoryKey = 'athletic';
        else if (normalizedFFMI < 23) categoryKey = 'advanced';
        else if (normalizedFFMI < 25) categoryKey = 'natural_limit';
        else categoryKey = 'exceptional';

        // 15 = 0%, 25 = 100%
        scorePercent = Math.min(100, Math.max(0, ((normalizedFFMI - 15) / 10) * 100));
    }

    return {
        rawFFMI: parseFloat(rawFFMI.toFixed(1)),
        normalizedFFMI: parseFloat(normalizedFFMI.toFixed(1)),
        leanMassKg: parseFloat(leanMassKg.toFixed(1)),
        fatMassKg: parseFloat(fatMassKg.toFixed(1)),
        categoryKey,
        scorePercent: Math.round(scorePercent)
    };
};

export interface BerkhanResult {
    maxLeanWeightKg: number;
    maxWeightAtCurrentBf: number;
    maxWeightAtCompBf: number;
}

export const calculateBerkhanLimit = (
    height: number,
    sex: 'male' | 'female',
    currentBodyFat: number = 15
): BerkhanResult => {
    // Martin Berkhan (Leangains) natural formula: Height (cm) - 100 = Max Stage Weight in kg (at 5-6% body fat)
    const baseLean = sex === 'female' ? (height - 100) * 0.85 : (height - 100);
    const maxWeightAtCompBf = Math.max(30, baseLean);
    const maxLeanWeightKg = maxWeightAtCompBf * 0.95; // ~5% BF stage condition
    
    const bfFraction = Math.max(0.04, Math.min(0.5, (currentBodyFat || 15) / 100));
    const maxWeightAtCurrentBf = maxLeanWeightKg / (1 - bfFraction);

    return {
        maxLeanWeightKg: parseFloat(maxLeanWeightKg.toFixed(1)),
        maxWeightAtCurrentBf: parseFloat(maxWeightAtCurrentBf.toFixed(1)),
        maxWeightAtCompBf: parseFloat(maxWeightAtCompBf.toFixed(1))
    };
};

export interface HelmsGainRates {
    beginner: { minKgMonth: number; maxKgMonth: number; minGramsWeek: number; maxGramsWeek: number };
    intermediate: { minKgMonth: number; maxKgMonth: number; minGramsWeek: number; maxGramsWeek: number };
    advanced: { minKgMonth: number; maxKgMonth: number; minGramsWeek: number; maxGramsWeek: number };
}

export const calculateHelmsGainRates = (weight: number): HelmsGainRates => {
    const w = weight > 0 ? weight : 75;
    return {
        beginner: {
            minKgMonth: parseFloat((w * 0.01).toFixed(2)),
            maxKgMonth: parseFloat((w * 0.015).toFixed(2)),
            minGramsWeek: Math.round((w * 0.01 * 1000) / 4.3),
            maxGramsWeek: Math.round((w * 0.015 * 1000) / 4.3)
        },
        intermediate: {
            minKgMonth: parseFloat((w * 0.005).toFixed(2)),
            maxKgMonth: parseFloat((w * 0.01).toFixed(2)),
            minGramsWeek: Math.round((w * 0.005 * 1000) / 4.3),
            maxGramsWeek: Math.round((w * 0.01 * 1000) / 4.3)
        },
        advanced: {
            minKgMonth: parseFloat((w * 0.0025).toFixed(2)),
            maxKgMonth: parseFloat((w * 0.005).toFixed(2)),
            minGramsWeek: Math.round((w * 0.0025 * 1000) / 4.3),
            maxGramsWeek: Math.round((w * 0.005 * 1000) / 4.3)
        }
    };
};
