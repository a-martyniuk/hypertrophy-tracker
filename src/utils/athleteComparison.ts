import type { BodyMeasurements } from '../types/measurements';
import { analyzeProportions } from './proportions';
import { calculateBerkhanLimit, calculateSkeletalPotential } from './skeletal';

export interface ComparisonProfile {
    id: string;
    name: string;
    title: string;
    era?: string;
    sex: 'male' | 'female';
    date?: string;
    measurements: Partial<BodyMeasurements>;
    isCustom?: boolean;
}

export interface HeadToHeadMetric {
    key: string;
    label: string;
    valA: number;
    valB: number;
    diff: number; // A - B
    percentDiff: number; // ((A - B) / B) * 100
    unit: string;
    higherIsBetter: boolean; // e.g. true for chest/arms, false for waist
    winner: 'A' | 'B' | 'TIE';
    insight?: string;
}

export interface DualRadarPoint {
    aspect: string;
    scoreA: number;
    scoreB: number;
    ideal: number;
    valA: string;
    valB: string;
}

export interface ComparisonVerdict {
    winner: 'A' | 'B' | 'BALANCED';
    scoreA: number;
    scoreB: number;
    title: string;
    summary: string;
    strengthsA: string[];
    strengthsB: string[];
    geneticCeilingA: number; // % achieved
    geneticCeilingB: number; // % achieved
    vTaperA: number;
    vTaperB: number;
    triadScoreA: number;
    triadScoreB: number;
}

export interface FullAthleteComparison {
    athleteA: ComparisonProfile;
    athleteB: ComparisonProfile;
    metrics: HeadToHeadMetric[];
    radarData: DualRadarPoint[];
    verdict: ComparisonVerdict;
}

// --- CANONICAL BENCHMARK PRESETS ---
export const CANONICAL_PRESETS: ComparisonProfile[] = [
    {
        id: 'steve_reeves_1950',
        name: 'Steve Reeves',
        title: 'Canon Clásico de la Proporción Áurea (1950)',
        era: 'Golden Era 1950',
        sex: 'male',
        measurements: {
            height: 185,
            weight: 97.0,
            bodyFat: 10.5,
            neck: 46.5,
            pecho: 132.0,
            back: 132.0,
            waist: 73.5,
            hips: 99.0,
            arm: { left: 46.5, right: 46.5 },
            forearm: { left: 37.5, right: 37.5 },
            thigh: { left: 66.0, right: 66.0 },
            calf: { left: 46.5, right: 46.5 },
            wrist: { left: 18.5, right: 18.5 },
            ankle: { left: 23.5, right: 23.5 }
        }
    },
    {
        id: 'frank_zane_1979',
        name: 'Frank Zane',
        title: 'Estándar Estético & V-Taper Extremo (1979)',
        era: 'Mr. Olympia 1979',
        sex: 'male',
        measurements: {
            height: 175,
            weight: 84.0,
            bodyFat: 7.8,
            neck: 42.0,
            pecho: 127.0,
            back: 125.0,
            waist: 73.5,
            hips: 95.0,
            arm: { left: 45.5, right: 45.5 },
            forearm: { left: 34.0, right: 34.0 },
            thigh: { left: 66.0, right: 66.0 },
            calf: { left: 42.0, right: 42.0 },
            wrist: { left: 17.0, right: 17.0 },
            ankle: { left: 21.5, right: 21.5 }
        }
    },
    {
        id: 'arnold_schwarzenegger_1975',
        name: 'Arnold Schwarzenegger',
        title: 'Volumen & Torso Dominante (1975)',
        era: 'Mr. Olympia 1975',
        sex: 'male',
        measurements: {
            height: 188,
            weight: 106.0,
            bodyFat: 9.0,
            neck: 45.5,
            pecho: 145.0,
            back: 142.0,
            waist: 86.0,
            hips: 104.0,
            arm: { left: 54.0, right: 54.5 },
            forearm: { left: 41.0, right: 41.0 },
            thigh: { left: 72.0, right: 72.0 },
            calf: { left: 51.0, right: 51.0 },
            wrist: { left: 19.5, right: 19.5 },
            ankle: { left: 24.5, right: 24.5 }
        }
    }
];

const getAvg = (val?: { left: number; right: number } | number): number => {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    const l = val.left || 0;
    const r = val.right || 0;
    return (l > 0 && r > 0) ? (l + r) / 2 : (l || r || 0);
};

export const compareAthletes = (
    profileA: ComparisonProfile,
    profileB: ComparisonProfile
): FullAthleteComparison => {
    const mA = profileA.measurements || {};
    const mB = profileB.measurements || {};

    const armA = getAvg(mA.arm);
    const armB = getAvg(mB.arm);
    const foreA = getAvg(mA.forearm);
    const foreB = getAvg(mB.forearm);
    const thighA = getAvg(mA.thigh);
    const thighB = getAvg(mB.thigh);
    const calfA = getAvg(mA.calf);
    const calfB = getAvg(mB.calf);
    const wristA = getAvg(mA.wrist) || 17.5;
    const wristB = getAvg(mB.wrist) || 17.5;
    const ankleA = getAvg(mA.ankle) || 22.5;
    const ankleB = getAvg(mB.ankle) || 22.5;

    const chestA = mA.pecho || 0;
    const chestB = mB.pecho || 0;
    const waistA = mA.waist || 0;
    const waistB = mB.waist || 0;
    const neckA = mA.neck || 0;
    const neckB = mB.neck || 0;
    const weightA = mA.weight || 0;
    const weightB = mB.weight || 0;
    const bfA = mA.bodyFat || 0;
    const bfB = mB.bodyFat || 0;

    // Ratios
    const vTaperA = waistA > 0 ? parseFloat((chestA / waistA).toFixed(2)) : 0;
    const vTaperB = waistB > 0 ? parseFloat((chestB / waistB).toFixed(2)) : 0;

    const armDensityA = wristA > 0 ? parseFloat((armA / wristA).toFixed(2)) : 0;
    const armDensityB = wristB > 0 ? parseFloat((armB / wristB).toFixed(2)) : 0;

    // Proportions Analysis
    const propA = analyzeProportions(mA as BodyMeasurements);
    const propB = analyzeProportions(mB as BodyMeasurements);

    const triadScoreA = propA?.reevesTriad.symmetryScore || 0;
    const triadScoreB = propB?.reevesTriad.symmetryScore || 0;

    // Berkhan / Skeletal Limits
    const berkhanA = calculateBerkhanLimit(mA.height || 175, profileA.sex || 'male', bfA || 10);
    const berkhanB = calculateBerkhanLimit(mB.height || 175, profileB.sex || 'male', bfB || 10);

    const ceilingPctA = (berkhanA && berkhanA.maxWeightAtCurrentBf > 0 && weightA > 0)
        ? Math.min(100, Math.round((weightA / berkhanA.maxWeightAtCurrentBf) * 100))
        : 0;

    const ceilingPctB = (berkhanB && berkhanB.maxWeightAtCurrentBf > 0 && weightB > 0)
        ? Math.min(100, Math.round((weightB / berkhanB.maxWeightAtCurrentBf) * 100))
        : 0;

    // Skeletal Potential Chest / Biceps target check
    const skelA = calculateSkeletalPotential(wristA, ankleA, mA.height || 175, profileA.sex || 'male');
    const skelB = calculateSkeletalPotential(wristB, ankleB, mB.height || 175, profileB.sex || 'male');

    // Metrics List
    const metrics: HeadToHeadMetric[] = [
        {
            key: 'vTaper',
            label: 'Ratio V-Taper (Pecho / Cintura)',
            valA: vTaperA,
            valB: vTaperB,
            diff: parseFloat((vTaperA - vTaperB).toFixed(2)),
            percentDiff: vTaperB > 0 ? parseFloat((((vTaperA - vTaperB) / vTaperB) * 100).toFixed(1)) : 0,
            unit: 'x',
            higherIsBetter: true,
            winner: vTaperA > vTaperB ? 'A' : vTaperA < vTaperB ? 'B' : 'TIE',
            insight: 'Mayor conicidad y amplitud torácica frente a cintura.'
        },
        {
            key: 'pecho',
            label: 'Perímetro Torácico (Pecho)',
            valA: chestA,
            valB: chestB,
            diff: parseFloat((chestA - chestB).toFixed(1)),
            percentDiff: chestB > 0 ? parseFloat((((chestA - chestB) / chestB) * 100).toFixed(1)) : 0,
            unit: 'cm',
            higherIsBetter: true,
            winner: chestA > chestB ? 'A' : chestA < chestB ? 'B' : 'TIE'
        },
        {
            key: 'neck',
            label: 'Cuello',
            valA: neckA,
            valB: neckB,
            diff: parseFloat((neckA - neckB).toFixed(1)),
            percentDiff: neckB > 0 ? parseFloat((((neckA - neckB) / neckB) * 100).toFixed(1)) : 0,
            unit: 'cm',
            higherIsBetter: true,
            winner: neckA > neckB ? 'A' : neckA < neckB ? 'B' : 'TIE'
        },
        {
            key: 'waist',
            label: 'Perímetro de Cintura',
            valA: waistA,
            valB: waistB,
            diff: parseFloat((waistA - waistB).toFixed(1)),
            percentDiff: waistB > 0 ? parseFloat((((waistA - waistB) / waistB) * 100).toFixed(1)) : 0,
            unit: 'cm',
            higherIsBetter: false, // Menor cintura es estéticamente mejor
            winner: waistA < waistB && waistA > 0 ? 'A' : waistA > waistB ? 'B' : 'TIE',
            insight: 'Cintura más compacta maximiza la ilusión estética.'
        },
        {
            key: 'arm',
            label: 'Brazo / Bíceps Promedio',
            valA: armA,
            valB: armB,
            diff: parseFloat((armA - armB).toFixed(1)),
            percentDiff: armB > 0 ? parseFloat((((armA - armB) / armB) * 100).toFixed(1)) : 0,
            unit: 'cm',
            higherIsBetter: true,
            winner: armA > armB ? 'A' : armA < armB ? 'B' : 'TIE'
        },
        {
            key: 'armDensity',
            label: 'Densidad Brazo / Muñeca',
            valA: armDensityA,
            valB: armDensityB,
            diff: parseFloat((armDensityA - armDensityB).toFixed(2)),
            percentDiff: armDensityB > 0 ? parseFloat((((armDensityA - armDensityB) / armDensityB) * 100).toFixed(1)) : 0,
            unit: 'x',
            higherIsBetter: true,
            winner: armDensityA > armDensityB ? 'A' : armDensityA < armDensityB ? 'B' : 'TIE',
            insight: 'Volumen muscular relativo a la estructura ósea articular.'
        },
        {
            key: 'thigh',
            label: 'Muslos / Cuádriceps',
            valA: thighA,
            valB: thighB,
            diff: parseFloat((thighA - thighB).toFixed(1)),
            percentDiff: thighB > 0 ? parseFloat((((thighA - thighB) / thighB) * 100).toFixed(1)) : 0,
            unit: 'cm',
            higherIsBetter: true,
            winner: thighA > thighB ? 'A' : thighA < thighB ? 'B' : 'TIE'
        },
        {
            key: 'calf',
            label: 'Gemelos / Pantorrillas',
            valA: calfA,
            valB: calfB,
            diff: parseFloat((calfA - calfB).toFixed(1)),
            percentDiff: calfB > 0 ? parseFloat((((calfA - calfB) / calfB) * 100).toFixed(1)) : 0,
            unit: 'cm',
            higherIsBetter: true,
            winner: calfA > calfB ? 'A' : calfA < calfB ? 'B' : 'TIE'
        },
        {
            key: 'triad',
            label: 'Simetría Tríada de Steve Reeves',
            valA: triadScoreA,
            valB: triadScoreB,
            diff: parseFloat((triadScoreA - triadScoreB).toFixed(0)),
            percentDiff: triadScoreB > 0 ? parseFloat((((triadScoreA - triadScoreB) / triadScoreB) * 100).toFixed(1)) : 0,
            unit: '%',
            higherIsBetter: true,
            winner: triadScoreA > triadScoreB ? 'A' : triadScoreA < triadScoreB ? 'B' : 'TIE',
            insight: 'Equilibrio de proporción 1:1:1 entre Brazo, Cuello y Gemelo.'
        },
        {
            key: 'geneticLimit',
            label: '% Techo Magro Estimado',
            valA: ceilingPctA,
            valB: ceilingPctB,
            diff: parseFloat((ceilingPctA - ceilingPctB).toFixed(0)),
            percentDiff: ceilingPctB > 0 ? parseFloat((((ceilingPctA - ceilingPctB) / ceilingPctB) * 100).toFixed(1)) : 0,
            unit: '%',
            higherIsBetter: true,
            winner: ceilingPctA > ceilingPctB ? 'A' : ceilingPctA < ceilingPctB ? 'B' : 'TIE',
            insight: 'Desarrollo alcanzado respecto al potencial óseo natural.'
        },
        {
            key: 'bodyFat',
            label: 'Grasa Corporal Estimada',
            valA: bfA,
            valB: bfB,
            diff: parseFloat((bfA - bfB).toFixed(1)),
            percentDiff: bfB > 0 ? parseFloat((((bfA - bfB) / bfB) * 100).toFixed(1)) : 0,
            unit: '%',
            higherIsBetter: false,
            winner: bfA < bfB && bfA > 0 ? 'A' : bfA > bfB ? 'B' : 'TIE'
        }
    ];

    // Dual Radar Data (6 Standard Biomechanical Axes)
    const targetChestA = skelA?.chest || 120;
    const targetChestB = skelB?.chest || 120;
    const targetArmA = skelA?.biceps || 44;
    const targetArmB = skelB?.biceps || 44;

    const radarData: DualRadarPoint[] = [
        {
            aspect: 'Torso / Pecho',
            scoreA: Math.min(100, Math.round((chestA / targetChestA) * 100)),
            scoreB: Math.min(100, Math.round((chestB / targetChestB) * 100)),
            ideal: 100,
            valA: `${chestA} cm`,
            valB: `${chestB} cm`
        },
        {
            aspect: 'V-Taper',
            scoreA: Math.min(100, Math.round((vTaperA / 1.618) * 100)),
            scoreB: Math.min(100, Math.round((vTaperB / 1.618) * 100)),
            ideal: 100,
            valA: `${vTaperA}x`,
            valB: `${vTaperB}x`
        },
        {
            aspect: 'Brazos',
            scoreA: Math.min(100, Math.round((armA / targetArmA) * 100)),
            scoreB: Math.min(100, Math.round((armB / targetArmB) * 100)),
            ideal: 100,
            valA: `${armA} cm`,
            valB: `${armB} cm`
        },
        {
            aspect: 'Antebrazos',
            scoreA: Math.min(100, Math.round((foreA / (skelA?.forearms || 35)) * 100)),
            scoreB: Math.min(100, Math.round((foreB / (skelB?.forearms || 35)) * 100)),
            ideal: 100,
            valA: `${foreA} cm`,
            valB: `${foreB} cm`
        },
        {
            aspect: 'Muslos',
            scoreA: Math.min(100, Math.round((thighA / (skelA?.thighs || 65)) * 100)),
            scoreB: Math.min(100, Math.round((thighB / (skelB?.thighs || 65)) * 100)),
            ideal: 100,
            valA: `${thighA} cm`,
            valB: `${thighB} cm`
        },
        {
            aspect: 'Gemelos',
            scoreA: Math.min(100, Math.round((calfA / (skelA?.calves || 42)) * 100)),
            scoreB: Math.min(100, Math.round((calfB / (skelB?.calves || 42)) * 100)),
            ideal: 100,
            valA: `${calfA} cm`,
            valB: `${calfB} cm`
        }
    ];

    // Score tally
    let scoreA = 0;
    let scoreB = 0;
    const strengthsA: string[] = [];
    const strengthsB: string[] = [];

    metrics.forEach((m) => {
        if (m.winner === 'A') {
            scoreA += 1;
            strengthsA.push(m.label);
        } else if (m.winner === 'B') {
            scoreB += 1;
            strengthsB.push(m.label);
        }
    });

    let winner: 'A' | 'B' | 'BALANCED' = 'BALANCED';
    if (scoreA > scoreB) winner = 'A';
    else if (scoreB > scoreA) winner = 'B';

    let verdictTitle = '';
    let verdictSummary = '';

    if (winner === 'A') {
        verdictTitle = `${profileA.name} lidera el Duelo Táctico (${scoreA} vs ${scoreB})`;
        verdictSummary = `${profileA.name} muestra superioridad biomecánica destacada en ${strengthsA.slice(0, 3).join(', ')}. Mantén el plan de volumen para consolidar la ventaja.`;
    } else if (winner === 'B') {
        verdictTitle = `${profileB.name} lidera la Comparativa (${scoreB} vs ${scoreA})`;
        verdictSummary = `${profileB.name} presenta ventaja en ${strengthsB.slice(0, 3).join(', ')}. Enfoque prioritario en ${strengthsB.slice(0, 2).join(' y ')} para cerrar el gap de simetría.`;
    } else {
        verdictTitle = 'Duelo Biomecánico Equilibrado (Empate Técnico)';
        verdictSummary = 'Ambos físicos demuestran un nivel parejo de desarrollo y proporciones equivalentes con ligeras ventajas cruzadas entre tren superior e inferior.';
    }

    const verdict: ComparisonVerdict = {
        winner,
        scoreA,
        scoreB,
        title: verdictTitle,
        summary: verdictSummary,
        strengthsA,
        strengthsB,
        geneticCeilingA: ceilingPctA,
        geneticCeilingB: ceilingPctB,
        vTaperA,
        vTaperB,
        triadScoreA,
        triadScoreB
    };

    return {
        athleteA: profileA,
        athleteB: profileB,
        metrics,
        radarData,
        verdict
    };
};
