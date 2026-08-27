import type { BodyMeasurements } from '../types/measurements';
import { calculateSkeletalPotential, calculateFFMI } from './skeletal';

export type MuscleLevel = 'beginner' | 'intermediate' | 'advanced' | 'elite' | 'genetic_limit';

export interface MuscleBenchmark {
    key: string;
    label: string;
    current: number;
    potentialMax: number;
    percentOfMax: number;
    level: MuscleLevel;
    levelLabel: string;
    levelColor: string;
    levelBg: string;
    referenceRanges: {
        beginner: [number, number];
        intermediate: [number, number];
        advanced: [number, number];
        elite: [number, number];
    };
    deltaToNextLevel?: number;
    nextLevelLabel?: string;
}

export interface RatioBenchmark {
    id: string;
    name: string;
    label: string;
    currentValue: number;
    idealValue: number;
    scaleDescription: string;
    status: 'optimal' | 'good' | 'needs_work';
    statusText: string;
    statusColor: string;
    statusBg: string;
    explanation: string;
    referenceTiers: {
        label: string;
        range: string;
        isCurrent: boolean;
    }[];
}

export interface ComprehensiveAnalysis {
    overallLevel: MuscleLevel;
    overallLevelLabel: string;
    overallScore: number; // 0 - 100%
    ffmiScore: {
        value: number;
        category: string;
        statusText: string;
        scorePercent: number;
    };
    muscleBenchmarks: MuscleBenchmark[];
    ratioBenchmarks: RatioBenchmark[];
    strongPoints: MuscleBenchmark[];
    laggingPoints: MuscleBenchmark[];
    recommendation: string;
}

export const getMuscleLevelMeta = (level: MuscleLevel) => {
    switch (level) {
        case 'beginner':
            return { label: 'Inicial / Base', color: '#94a3b8', bg: 'rgba(148, 163, 184, 0.15)' };
        case 'intermediate':
            return { label: 'Intermedio', color: '#60a5fa', bg: 'rgba(96, 165, 250, 0.15)' };
        case 'advanced':
            return { label: 'Avanzado', color: '#34d399', bg: 'rgba(52, 211, 153, 0.15)' };
        case 'elite':
            return { label: 'Élite Natural', color: '#fbbf24', bg: 'rgba(251, 191, 36, 0.15)' };
        case 'genetic_limit':
            return { label: 'Límite Genético', color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.15)' };
    }
};

export const computeComprehensiveAnalysis = (
    m?: BodyMeasurements,
    sex: 'male' | 'female' = 'male'
): ComprehensiveAnalysis | null => {
    if (!m) return null;

    const getAvg = (val?: number | { left?: number; right?: number }): number => {
        if (!val) return 0;
        if (typeof val === 'number') return val;
        const l = val.left || 0;
        const r = val.right || 0;
        if (l > 0 && r > 0) return parseFloat(((l + r) / 2).toFixed(1));
        return l || r || 0;
    };

    const height = m.height || (sex === 'female' ? 165 : 178);
    const wristAvg = getAvg(m.wrist);
    const ankleAvg = getAvg(m.ankle);
    const wrist = wristAvg > 0 ? wristAvg : (sex === 'female' ? 15.5 : 17.5);
    const ankle = ankleAvg > 0 ? ankleAvg : (sex === 'female' ? 20.5 : 22.5);

    const potentials = calculateSkeletalPotential(wrist, ankle, height, sex);
    const ffmi = calculateFFMI(m.weight || 75, height, m.bodyFat || 15);

    const armCurrent = getAvg(m.arm);
    const forearmCurrent = getAvg(m.forearm);
    const chestCurrent = m.pecho || 0;
    const neckCurrent = m.neck || 0;
    const thighCurrent = getAvg(m.thigh);
    const calfCurrent = getAvg(m.calf);
    const waistCurrent = m.waist || 0;

    const buildBenchmark = (
        key: string,
        label: string,
        current: number,
        maxPotential: number,
        customScale?: [number, number, number, number]
    ): MuscleBenchmark => {
        const scale = customScale || [0.75, 0.85, 0.94, 1.0];
        const begMax = parseFloat((maxPotential * scale[0]).toFixed(1));
        const interMax = parseFloat((maxPotential * scale[1]).toFixed(1));
        const advMax = parseFloat((maxPotential * scale[2]).toFixed(1));
        const eliteMax = parseFloat((maxPotential * scale[3]).toFixed(1));

        let level: MuscleLevel = 'beginner';
        let deltaToNextLevel: number | undefined = undefined;
        let nextLevelLabel: string | undefined = undefined;

        if (current >= eliteMax) {
            level = 'genetic_limit';
        } else if (current >= advMax) {
            level = 'elite';
            deltaToNextLevel = parseFloat((eliteMax - current).toFixed(1));
            nextLevelLabel = 'Límite Genético';
        } else if (current >= interMax) {
            level = 'advanced';
            deltaToNextLevel = parseFloat((advMax - current).toFixed(1));
            nextLevelLabel = 'Élite';
        } else if (current >= begMax) {
            level = 'intermediate';
            deltaToNextLevel = parseFloat((interMax - current).toFixed(1));
            nextLevelLabel = 'Avanzado';
        } else {
            level = 'beginner';
            deltaToNextLevel = parseFloat((begMax - current).toFixed(1));
            nextLevelLabel = 'Intermedio';
        }

        const percentOfMax = maxPotential > 0 ? Math.min(105, Math.round((current / maxPotential) * 100)) : 0;
        const meta = getMuscleLevelMeta(level);

        return {
            key,
            label,
            current,
            potentialMax: maxPotential,
            percentOfMax,
            level,
            levelLabel: meta.label,
            levelColor: meta.color,
            levelBg: meta.bg,
            referenceRanges: {
                beginner: [0, begMax],
                intermediate: [begMax, interMax],
                advanced: [interMax, advMax],
                elite: [advMax, eliteMax]
            },
            deltaToNextLevel: deltaToNextLevel !== undefined && deltaToNextLevel > 0 ? deltaToNextLevel : undefined,
            nextLevelLabel
        };
    };

    const muscleBenchmarks: MuscleBenchmark[] = [
        buildBenchmark('arm', 'Brazo (Bíceps/Tríceps)', armCurrent, potentials.biceps, [0.75, 0.85, 0.94, 1.0]),
        buildBenchmark('pecho', 'Pecho / Torso', chestCurrent, potentials.chest, [0.78, 0.87, 0.95, 1.0]),
        buildBenchmark('thigh', 'Muslo / Cuádriceps', thighCurrent, potentials.thighs, [0.78, 0.87, 0.95, 1.0]),
        buildBenchmark('calf', 'Gemelo / Pantorrilla', calfCurrent, potentials.calves, [0.80, 0.88, 0.96, 1.0]),
        buildBenchmark('forearm', 'Antebrazo', forearmCurrent, potentials.forearms, [0.75, 0.85, 0.94, 1.0]),
        buildBenchmark('neck', 'Cuello', neckCurrent, potentials.neck, [0.78, 0.88, 0.95, 1.0])
    ].filter(b => b.current > 0);

    // Calculate Overall Development Score
    const totalPercent = muscleBenchmarks.reduce((acc, curr) => acc + curr.percentOfMax, 0);
    const overallScore = muscleBenchmarks.length > 0 ? Math.round(totalPercent / muscleBenchmarks.length) : 50;

    let overallLevel: MuscleLevel = 'beginner';
    if (overallScore >= 95) overallLevel = 'genetic_limit';
    else if (overallScore >= 90) overallLevel = 'elite';
    else if (overallScore >= 82) overallLevel = 'advanced';
    else if (overallScore >= 72) overallLevel = 'intermediate';

    const overallLevelLabel = getMuscleLevelMeta(overallLevel).label;

    // Strong vs Lagging Points (Sorted by percentOfMax)
    const sortedMuscles = [...muscleBenchmarks].sort((a, b) => b.percentOfMax - a.percentOfMax);
    const strongPoints = sortedMuscles.filter(m => m.percentOfMax >= overallScore + 2);
    const laggingPoints = sortedMuscles.filter(m => m.percentOfMax <= overallScore - 2).reverse();

    // Key Ratio Benchmarks with Clear Scales
    const ratioBenchmarks: RatioBenchmark[] = [];

    // 1. V-Taper Ratio (Pecho o Espalda / Cintura)
    if (chestCurrent > 0 && waistCurrent > 0) {
        const vRatio = parseFloat((chestCurrent / waistCurrent).toFixed(2));
        let status: 'optimal' | 'good' | 'needs_work' = 'good';
        let statusText = 'V-Shape Atlético';
        let statusColor = '#34d399';
        let statusBg = 'rgba(52, 211, 153, 0.15)';

        if (vRatio >= 1.45) {
            status = 'optimal';
            statusText = 'V-Taper Élite / Proporción Áurea';
            statusColor = '#fbbf24';
            statusBg = 'rgba(251, 191, 36, 0.15)';
        } else if (vRatio >= 1.25) {
            status = 'good';
            statusText = 'V-Shape Atlético Marcado';
            statusColor = '#60a5fa';
            statusBg = 'rgba(96, 165, 250, 0.15)';
        } else {
            status = 'needs_work';
            statusText = 'En Desarrollo (Cilíndrico)';
            statusColor = '#f59e0b';
            statusBg = 'rgba(245, 158, 11, 0.15)';
        }

        ratioBenchmarks.push({
            id: 'v_taper',
            name: 'Ratio V-Taper (Pecho / Cintura)',
            label: `${vRatio}x`,
            currentValue: vRatio,
            idealValue: 1.618,
            scaleDescription: 'Objetivo Áureo: 1.45x - 1.62x',
            status,
            statusText,
            statusColor,
            statusBg,
            explanation: 'Mide la ilusión de torso cónico. Se optimiza aumentando la amplitud de dorsales/pecho y reduciendo el perímetro de cintura.',
            referenceTiers: [
                { label: 'Cilíndrico / Base', range: '< 1.25', isCurrent: vRatio < 1.25 },
                { label: 'Atlético', range: '1.25 - 1.40', isCurrent: vRatio >= 1.25 && vRatio < 1.40 },
                { label: 'Avanzado V-Shape', range: '1.40 - 1.55', isCurrent: vRatio >= 1.40 && vRatio < 1.55 },
                { label: 'Élite Golden Ratio', range: '1.55 - 1.62+', isCurrent: vRatio >= 1.55 }
            ]
        });
    }

    // 2. Ratio Brazo / Muñeca (Desarrollo Extremidad Superior)
    if (armCurrent > 0 && wrist > 0) {
        const armWristRatio = parseFloat((armCurrent / wrist).toFixed(2));
        let status: 'optimal' | 'good' | 'needs_work' = 'good';
        let statusText = 'Desarrollo Intermedio';
        let statusColor = '#60a5fa';
        let statusBg = 'rgba(96, 165, 250, 0.15)';

        if (armWristRatio >= 2.45) {
            status = 'optimal';
            statusText = 'Extremidad Élite / Límite Natural';
            statusColor = '#fbbf24';
            statusBg = 'rgba(251, 191, 36, 0.15)';
        } else if (armWristRatio >= 2.25) {
            status = 'good';
            statusText = 'Avanzado Muscular';
            statusColor = '#34d399';
            statusBg = 'rgba(52, 211, 153, 0.15)';
        } else if (armWristRatio >= 2.00) {
            status = 'good';
            statusText = 'Intermedio Sólido';
            statusColor = '#60a5fa';
            statusBg = 'rgba(96, 165, 250, 0.15)';
        } else {
            status = 'needs_work';
            statusText = 'Inicial / Recreacional';
            statusColor = '#94a3b8';
            statusBg = 'rgba(148, 163, 184, 0.15)';
        }

        ratioBenchmarks.push({
            id: 'arm_wrist',
            name: 'Ratio Brazo / Muñeca (Densidad de Brazos)',
            label: `${armWristRatio}x`,
            currentValue: armWristRatio,
            idealValue: 2.50,
            scaleDescription: 'Referencia Natural: 2.30x - 2.55x',
            status,
            statusText,
            statusColor,
            statusBg,
            explanation: 'Indica cuánta masa muscular magra has construido alrededor de tu estructura ósea de muñeca.',
            referenceTiers: [
                { label: 'Inicial', range: '< 2.00', isCurrent: armWristRatio < 2.00 },
                { label: 'Intermedio', range: '2.00 - 2.25', isCurrent: armWristRatio >= 2.00 && armWristRatio < 2.25 },
                { label: 'Avanzado', range: '2.25 - 2.45', isCurrent: armWristRatio >= 2.25 && armWristRatio < 2.45 },
                { label: 'Élite Natural', range: '2.45 - 2.60+', isCurrent: armWristRatio >= 2.45 }
            ]
        });
    }

    // 3. Ratio Cintura / Estatura (WHtR - Estética y Grasa Visceral)
    if (waistCurrent > 0 && height > 0) {
        const whtr = parseFloat((waistCurrent / height).toFixed(2));
        let status: 'optimal' | 'good' | 'needs_work' = 'good';
        let statusText = 'Saludable / Atlético';
        let statusColor = '#34d399';
        let statusBg = 'rgba(52, 211, 153, 0.15)';

        if (whtr >= 0.44 && whtr <= 0.48) {
            status = 'optimal';
            statusText = 'Zona Estética Óptima';
            statusColor = '#fbbf24';
            statusBg = 'rgba(251, 191, 36, 0.15)';
        } else if (whtr < 0.44) {
            status = 'good';
            statusText = 'Muy Magro / Definición Alta';
            statusColor = '#60a5fa';
            statusBg = 'rgba(96, 165, 250, 0.15)';
        } else if (whtr <= 0.52) {
            status = 'good';
            statusText = 'Superávit / Volumen Controlado';
            statusColor = '#f59e0b';
            statusBg = 'rgba(245, 158, 11, 0.15)';
        } else {
            status = 'needs_work';
            statusText = 'Cintura Elevada (Prioridad Reducción)';
            statusColor = '#f43f5e';
            statusBg = 'rgba(244, 63, 94, 0.15)';
        }

        ratioBenchmarks.push({
            id: 'whtr',
            name: 'Índice Cintura / Estatura (WHtR)',
            label: `${whtr}`,
            currentValue: whtr,
            idealValue: 0.46,
            scaleDescription: 'Rango Óptimo Estético: 0.44 - 0.48',
            status,
            statusText,
            statusColor,
            statusBg,
            explanation: 'El predictor antropométrico #1 de estética corporal y bajo riesgo de grasa visceral profunda.',
            referenceTiers: [
                { label: 'Muy Magro', range: '< 0.44', isCurrent: whtr < 0.44 },
                { label: 'Zona Estética Óptima', range: '0.44 - 0.48', isCurrent: whtr >= 0.44 && whtr <= 0.48 },
                { label: 'Volumen Moderado', range: '0.49 - 0.52', isCurrent: whtr > 0.48 && whtr <= 0.52 },
                { label: 'Corte Recomendado', range: '> 0.52', isCurrent: whtr > 0.52 }
            ]
        });
    }

    // 4. Steve Reeves Triad (Brazo vs Cuello vs Gemelo)
    if (armCurrent > 0 && neckCurrent > 0 && calfCurrent > 0) {
        const diffArmNeck = parseFloat(Math.abs(armCurrent - neckCurrent).toFixed(1));
        const diffArmCalf = parseFloat(Math.abs(armCurrent - calfCurrent).toFixed(1));
        const maxDiff = Math.max(diffArmNeck, diffArmCalf);

        let status: 'optimal' | 'good' | 'needs_work' = 'good';
        let statusText = 'Equilibrio Aceptable';
        let statusColor = '#60a5fa';
        let statusBg = 'rgba(96, 165, 250, 0.15)';

        if (maxDiff <= 1.0) {
            status = 'optimal';
            statusText = 'Simetría Reeves Perfecta (1:1:1)';
            statusColor = '#fbbf24';
            statusBg = 'rgba(251, 191, 36, 0.15)';
        } else if (maxDiff <= 2.0) {
            status = 'good';
            statusText = 'Buena Armonía';
            statusColor = '#34d399';
            statusBg = 'rgba(52, 211, 153, 0.15)';
        } else {
            status = 'needs_work';
            statusText = 'Desbalance en Tríada';
            statusColor = '#f59e0b';
            statusBg = 'rgba(245, 158, 11, 0.15)';
        }

        ratioBenchmarks.push({
            id: 'reeves_triad',
            name: 'Tríada de Steve Reeves (Brazo = Cuello = Gemelo)',
            label: `${armCurrent} / ${neckCurrent} / ${calfCurrent} cm`,
            currentValue: maxDiff,
            idealValue: 0,
            scaleDescription: 'Delta Máximo Ideal: ≤ 1.0 cm',
            status,
            statusText,
            statusColor,
            statusBg,
            explanation: 'En el canon clásico de Reeves, el brazo, el cuello y el gemelo deben tener exactamente la misma medida para crear la ilusión de proporción perfecta.',
            referenceTiers: [
                { label: 'Simetría Reeves Perfecta', range: 'Delta ≤ 1.0 cm', isCurrent: maxDiff <= 1.0 },
                { label: 'Armonía Buena', range: 'Delta 1.1 - 2.0 cm', isCurrent: maxDiff > 1.0 && maxDiff <= 2.0 },
                { label: 'Desbalance Leve', range: 'Delta 2.1 - 3.5 cm', isCurrent: maxDiff > 2.0 && maxDiff <= 3.5 },
                { label: 'Prioridad de Balance', range: 'Delta > 3.5 cm', isCurrent: maxDiff > 3.5 }
            ]
        });
    }

    // Recommendation generator
    let recommendation = 'Tu físico presenta una sólida base estructural. ';
    if (laggingPoints.length > 0) {
        const names = laggingPoints.map(l => l.label).join(', ');
        recommendation += `Para maximizar la armonía visual de tu silueta, enfoca el volumen de entrenamiento prioritario (16-20 series semanales) en: ${names}.`;
    } else if (strongPoints.length > 0) {
        recommendation += `Presentas excelente hipertrofia en ${strongPoints.map(s => s.label).join(', ')}. Mantén el volumen de mantenimiento en estos grupos y continúa consolidando el torso.`;
    } else {
        recommendation += 'Tus grupos musculares se encuentran simétricamente balanceados. Mantén una progresión de cargas sostenida.';
    }

    const ffmiVal = ffmi?.normalizedFFMI || 20.0;
    const ffmiStatus = ffmiVal >= 23.5 ? 'Élite Natural' : ffmiVal >= 22 ? 'Avanzado' : ffmiVal >= 20 ? 'Atlético' : 'Base';

    return {
        overallLevel,
        overallLevelLabel,
        overallScore,
        ffmiScore: {
            value: ffmiVal,
            category: ffmi?.categoryKey || 'average',
            statusText: ffmiStatus,
            scorePercent: ffmi?.scorePercent || 50
        },
        muscleBenchmarks,
        ratioBenchmarks,
        strongPoints,
        laggingPoints,
        recommendation
    };
};
