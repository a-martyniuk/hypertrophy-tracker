import type { MeasurementRecord } from '../types/measurements';
import { computeComprehensiveAnalysis, type MuscleBenchmark } from './benchmarkAnalysis';

export interface AthleteBadge {
    id: string;
    title: string;
    description: string;
    icon: string;
    category: 'Aesthetic' | 'Genetic' | 'Consistency' | 'Strength';
    isUnlocked: boolean;
    progressPercent: number;
    currentValueText: string;
    targetValueText: string;
    unlockedDate?: string;
    rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
    rarityColor: string;
}

export const evaluateAthleteBadges = (
    records: MeasurementRecord[],
    sex: 'male' | 'female' = 'male'
): AthleteBadge[] => {
    const badges: AthleteBadge[] = [];
    const latest = records[0];
    const m = latest?.measurements;

    const analysis = computeComprehensiveAnalysis(m, sex);

    // 1. V-TAPER DORADO (Ratio Pecho/Cintura >= 1.618 en hombres o >= 1.38 en mujeres)
    const chest = m?.pecho || 0;
    const waist = m?.waist || 0;
    const vRatio = waist > 0 ? chest / waist : 0;
    const vTarget = sex === 'female' ? 1.38 : 1.618;
    const vProgress = Math.min(100, Math.round((vRatio / vTarget) * 100));
    badges.push({
        id: 'golden_v_taper',
        title: sex === 'female' ? 'Silueta de Reloj de Arena' : 'V-Taper Dorado',
        description: sex === 'female'
            ? 'Alcanza la proporción estética ideal en tu torso con un ratio Pecho / Cintura ≥ 1.38.'
            : 'Alcanza la proporción áurea (Golden Ratio) en tu torso con un ratio Pecho / Cintura ≥ 1.618.',
        icon: '🏆',
        category: 'Aesthetic',
        isUnlocked: vRatio >= vTarget,
        progressPercent: vProgress,
        currentValueText: `${vRatio.toFixed(2)}x`,
        targetValueText: `${vTarget.toFixed(2)}x`,
        rarity: 'Legendary',
        rarityColor: '#fbbf24'
    });

    // 2. ÉLITE NATURAL (>= 95% del límite de Casey Butt en al menos un grupo muscular)
    const maxBmPercent = analysis && analysis.muscleBenchmarks.length > 0
        ? Math.max(...analysis.muscleBenchmarks.map((b: MuscleBenchmark) => b.percentOfMax))
        : 0;
    const eliteProgress = Math.min(100, Math.round((maxBmPercent / 95) * 100));
    badges.push({
        id: 'natural_elite',
        title: 'Élite Natural',
        description: 'Alcanza o supera el 95% del límite genético teórico de Casey Butt en al menos un grupo muscular.',
        icon: '🥇',
        category: 'Genetic',
        isUnlocked: maxBmPercent >= 95,
        progressPercent: eliteProgress,
        currentValueText: `${maxBmPercent}%`,
        targetValueText: '95%',
        rarity: 'Epic',
        rarityColor: '#f59e0b'
    });

    // 3. TRAZABILIDAD IMPECABLE (>= 5 registros)
    const recCount = records.length;
    const trackTarget = 5;
    const trackProgress = Math.min(100, Math.round((recCount / trackTarget) * 100));
    badges.push({
        id: 'flawless_tracking',
        title: 'Trazabilidad Impecable',
        description: 'Registra 5 o más auditorías antropométricas completas para consolidar tu histórico biométrico.',
        icon: '📈',
        category: 'Consistency',
        isUnlocked: recCount >= trackTarget,
        progressPercent: trackProgress,
        currentValueText: `${recCount} registros`,
        targetValueText: '5 registros',
        rarity: 'Common',
        rarityColor: '#38bdf8'
    });

    // 4. BRAZO DE ACERO (Bíceps >= 42 cm en hombres o >= 33 cm en mujeres, o >= 95% potencial)
    const armL = m?.arm?.left || 0;
    const armR = m?.arm?.right || 0;
    const armMax = Math.max(armL, armR);
    const armTarget = sex === 'male' ? 42.0 : 33.0;
    const armProgress = Math.min(100, Math.round((armMax / armTarget) * 100));
    badges.push({
        id: 'steel_arm',
        title: 'Brazo de Acero',
        description: `Supera los ${armTarget} cm de perímetro de brazo en flexión máxima.`,
        icon: '⚡',
        category: 'Strength',
        isUnlocked: armMax >= armTarget,
        progressPercent: armProgress,
        currentValueText: `${armMax} cm`,
        targetValueText: `${armTarget} cm`,
        rarity: 'Rare',
        rarityColor: '#a855f7'
    });

    // 5. SIMETRÍA GRIEGA (Diferencia bilateral <= 0.5 cm en todas las extremidades medidas)
    const getBilateralDiff = (left?: number, right?: number) => {
        if (left && right && left > 0 && right > 0) {
            return Math.abs(left - right);
        }
        return 0;
    };

    const measuredDiffs = [
        getBilateralDiff(m?.arm?.left, m?.arm?.right),
        getBilateralDiff(m?.forearm?.left, m?.forearm?.right),
        getBilateralDiff(m?.thigh?.left, m?.thigh?.right),
        getBilateralDiff(m?.calf?.left, m?.calf?.right),
    ];
    const hasMeasuredPairs = Boolean(
        (m?.arm?.left && m?.arm?.right && m.arm.left > 0 && m.arm.right > 0) ||
        (m?.forearm?.left && m?.forearm?.right && m.forearm.left > 0 && m.forearm.right > 0) ||
        (m?.thigh?.left && m?.thigh?.right && m.thigh.left > 0 && m.thigh.right > 0) ||
        (m?.calf?.left && m?.calf?.right && m.calf.left > 0 && m.calf.right > 0)
    );

    const maxBilateralDiff = Math.max(...measuredDiffs, 0);
    const isSymmetric = hasMeasuredPairs && maxBilateralDiff <= 0.5;
    badges.push({
        id: 'greek_symmetry',
        title: 'Simetría Griega',
        description: 'Mantén una diferencia bilateral menor o igual a 0.5 cm entre el lado izquierdo y derecho de todas las extremidades.',
        icon: '🏛️',
        category: 'Aesthetic',
        isUnlocked: isSymmetric,
        progressPercent: isSymmetric ? 100 : (hasMeasuredPairs ? Math.max(0, Math.round((1 - (maxBilateralDiff - 0.5) / 2) * 100)) : 0),
        currentValueText: hasMeasuredPairs ? `Máx desvío: ${maxBilateralDiff.toFixed(1)} cm` : 'Sin pares bilaterales',
        targetValueText: '≤ 0.5 cm',
        rarity: 'Rare',
        rarityColor: '#34d399'
    });

    // 6. TITÁN DEL TORSO (Pecho >= 115 cm en hombres o >= 95 cm en mujeres)
    const chestTarget = sex === 'male' ? 115.0 : 95.0;
    const chestProgress = Math.min(100, Math.round((chest / chestTarget) * 100));
    badges.push({
        id: 'torso_titan',
        title: 'Titán del Torso',
        description: `Desarrolla un perímetro torácico superior a ${chestTarget} cm con máxima expansión dorsal.`,
        icon: '🛡️',
        category: 'Strength',
        isUnlocked: chest >= chestTarget,
        progressPercent: chestProgress,
        currentValueText: `${chest} cm`,
        targetValueText: `${chestTarget} cm`,
        rarity: 'Epic',
        rarityColor: '#f97316'
    });

    return badges;
};
