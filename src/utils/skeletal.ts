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
