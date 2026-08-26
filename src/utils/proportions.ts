import type { BodyMeasurements } from '../types/measurements';

export interface ReevesTriad {
    armAvg: number;
    neck: number;
    calfAvg: number;
    armNeckDiff: number;
    armCalfDiff: number;
    symmetryScore: number; // 0 to 100%
}

export interface AdonisIndex {
    chestWaistRatio: number;
    targetRatio: number; // 1.618
    ratioScore: number; // percentage of golden ratio achieved
    waistHeightRatio: number;
    idealWaistRange: [number, number]; // [min, max] cm
    idealChestForWaist: number;
}

export interface AsymmetryAlert {
    group: 'arm' | 'forearm' | 'thigh' | 'calf';
    label: string;
    left: number;
    right: number;
    diff: number;
    largerSide: 'left' | 'right' | 'equal';
    severity: 'none' | 'mild' | 'notable'; // >1.0 cm is notable
}

export interface ProportionRadarData {
    aspect: string;
    actual: number;
    ideal: number;
    score: number; // 0-100%
    unit: string;
}

export interface FullProportionsAnalysis {
    reevesTriad: ReevesTriad;
    adonisIndex: AdonisIndex;
    asymmetries: AsymmetryAlert[];
    radarData: ProportionRadarData[];
    overallGoldenScore: number;
}

export const analyzeProportions = (m?: BodyMeasurements): FullProportionsAnalysis | null => {
    if (!m) return null;

    const armLeft = m.arm?.left || 0;
    const armRight = m.arm?.right || 0;
    const armAvg = (armLeft > 0 && armRight > 0) ? (armLeft + armRight) / 2 : (armLeft || armRight || 0);

    const calfLeft = m.calf?.left || 0;
    const calfRight = m.calf?.right || 0;
    const calfAvg = (calfLeft > 0 && calfRight > 0) ? (calfLeft + calfRight) / 2 : (calfLeft || calfRight || 0);

    const neck = m.neck || 0;
    const chest = m.pecho || 0;
    const waist = m.waist || 0;
    const height = m.height || 191;
    const hips = m.hips || 0;
    const thighLeft = m.thigh?.left || 0;
    const thighRight = m.thigh?.right || 0;
    const thighAvg = (thighLeft > 0 && thighRight > 0) ? (thighLeft + thighRight) / 2 : (thighLeft || thighRight || 0);
    const forearmLeft = m.forearm?.left || 0;
    const forearmRight = m.forearm?.right || 0;

    // 1. Steve Reeves Triad (Arm ≈ Neck ≈ Calf)
    const triadMean = (armAvg + neck + calfAvg) / 3;
    let symmetryScore = 100;
    if (triadMean > 0) {
        const variance = (Math.abs(armAvg - triadMean) + Math.abs(neck - triadMean) + Math.abs(calfAvg - triadMean)) / 3;
        symmetryScore = Math.max(0, Math.min(100, Math.round(100 - (variance / triadMean) * 100 * 5)));
    }

    const reevesTriad: ReevesTriad = {
        armAvg: parseFloat(armAvg.toFixed(1)),
        neck: parseFloat(neck.toFixed(1)),
        calfAvg: parseFloat(calfAvg.toFixed(1)),
        armNeckDiff: parseFloat((armAvg - neck).toFixed(1)),
        armCalfDiff: parseFloat((armAvg - calfAvg).toFixed(1)),
        symmetryScore
    };

    // 2. Adonis Golden Ratio (Chest / Waist ≈ 1.618)
    const chestWaistRatio = waist > 0 ? parseFloat((chest / waist).toFixed(2)) : 0;
    const targetRatio = 1.618;
    const ratioScore = waist > 0 ? Math.min(100, Math.round((chestWaistRatio / targetRatio) * 100)) : 0;
    const waistHeightRatio = height > 0 && waist > 0 ? parseFloat((waist / height).toFixed(2)) : 0;
    const idealWaistRange: [number, number] = [
        parseFloat((height * 0.44).toFixed(1)),
        parseFloat((height * 0.47).toFixed(1))
    ];
    const idealChestForWaist = waist > 0 ? parseFloat((waist * targetRatio).toFixed(1)) : 0;

    const adonisIndex: AdonisIndex = {
        chestWaistRatio,
        targetRatio,
        ratioScore,
        waistHeightRatio,
        idealWaistRange,
        idealChestForWaist
    };

    // 3. Bilateral Asymmetries
    const checkAsymmetry = (
        group: 'arm' | 'forearm' | 'thigh' | 'calf',
        label: string,
        left: number,
        right: number
    ): AsymmetryAlert => {
        const diff = parseFloat(Math.abs(left - right).toFixed(1));
        let largerSide: 'left' | 'right' | 'equal' = 'equal';
        if (left > right) largerSide = 'left';
        else if (right > left) largerSide = 'right';

        let severity: 'none' | 'mild' | 'notable' = 'none';
        if (diff >= 1.2) severity = 'notable';
        else if (diff >= 0.6) severity = 'mild';

        return { group, label, left, right, diff, largerSide, severity };
    };

    const asymmetries: AsymmetryAlert[] = [
        checkAsymmetry('arm', 'Brazos', armLeft, armRight),
        checkAsymmetry('forearm', 'Antebrazos', forearmLeft, forearmRight),
        checkAsymmetry('thigh', 'Muslos', thighLeft, thighRight),
        checkAsymmetry('calf', 'Gemelos', calfLeft, calfRight)
    ];

    // 4. Radar Chart Data
    // Ratios compared to classic ideal:
    // - Arm / Neck (ideal: 1.0)
    // - Calf / Neck (ideal: 1.0)
    // - Chest / Waist (ideal: 1.618)
    // - Thigh / Calf (ideal: 1.5)
    // - Chest / Hips (ideal: 1.35)
    const getRatioScore = (actualRatio: number, idealRatio: number) => {
        if (actualRatio <= 0 || idealRatio <= 0) return 50;
        const diff = Math.abs(actualRatio - idealRatio) / idealRatio;
        return Math.max(20, Math.min(100, Math.round(100 - diff * 100)));
    };

    const armNeckRatio = neck > 0 ? armAvg / neck : 0;
    const calfNeckRatio = neck > 0 ? calfAvg / neck : 0;
    const thighCalfRatio = calfAvg > 0 ? thighAvg / calfAvg : 0;
    const chestHipsRatio = hips > 0 ? chest / hips : 0;

    const radarData: ProportionRadarData[] = [
        {
            aspect: 'Tríada Brazo/Cuello',
            actual: parseFloat(armNeckRatio.toFixed(2)),
            ideal: 1.0,
            score: getRatioScore(armNeckRatio, 1.0),
            unit: 'ratio'
        },
        {
            aspect: 'Tríada Gemelo/Cuello',
            actual: parseFloat(calfNeckRatio.toFixed(2)),
            ideal: 1.0,
            score: getRatioScore(calfNeckRatio, 1.0),
            unit: 'ratio'
        },
        {
            aspect: 'V-Taper Adonis (Pecho/Cintura)',
            actual: parseFloat(chestWaistRatio.toFixed(2)),
            ideal: 1.62,
            score: ratioScore,
            unit: 'ratio'
        },
        {
            aspect: 'Proporción Muslo/Gemelo',
            actual: parseFloat(thighCalfRatio.toFixed(2)),
            ideal: 1.50,
            score: getRatioScore(thighCalfRatio, 1.5),
            unit: 'ratio'
        },
        {
            aspect: 'Tronco Superior (Pecho/Cadera)',
            actual: parseFloat(chestHipsRatio.toFixed(2)),
            ideal: 1.35,
            score: getRatioScore(chestHipsRatio, 1.35),
            unit: 'ratio'
        }
    ];

    const overallGoldenScore = Math.round(
        radarData.reduce((acc, curr) => acc + curr.score, 0) / radarData.length
    );

    return {
        reevesTriad,
        adonisIndex,
        asymmetries,
        radarData,
        overallGoldenScore
    };
};
