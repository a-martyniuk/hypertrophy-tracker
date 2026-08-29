import { calculateBerkhanLimit } from './skeletal';
import type { BodyMeasurements } from '../types/measurements';

export interface GeneticMilestone {
    percent: number;
    targetLeanMassKg: number;
    additionalLeanMassKg: number;
    estimatedMonths: number;
    projectedDate: string;
    isAchieved: boolean;
}

export interface GeneticTrajectoryResult {
    currentLeanMassKg: number;
    maxNaturalLeanMassKg: number;
    currentPotentialPercent: number;
    trainingExperienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'elite';
    monthlyGainRateKg: number;
    monthsToCeiling: number;
    milestones: GeneticMilestone[];
    trajectorySummary: string;
}

/**
 * Calculates projected hypertrophy trajectory to natural genetic ceiling
 * based on Casey Butt, Martin Berkhan, and Helms/McDonald rate-of-gain models.
 */
export const calculateGeneticTrajectory = (
    weight: number,
    height: number,
    bodyFat: number,
    sex: 'male' | 'female' = 'male',
    trainingYears: number = 2,
    _measurements?: BodyMeasurements
): GeneticTrajectoryResult => {
    const safeWeight = weight > 0 ? weight : 75;
    const safeHeight = height > 0 ? height : 178;
    const safeBf = Math.max(3, Math.min(50, bodyFat || (sex === 'female' ? 22 : 15)));

    const currentLeanMassKg = parseFloat((safeWeight * (1 - safeBf / 100)).toFixed(1));
    const berkhan = calculateBerkhanLimit(safeHeight, sex, safeBf);
    const maxNaturalLeanMassKg = berkhan.maxLeanWeightKg;

    const rawPotential = (currentLeanMassKg / maxNaturalLeanMassKg) * 100;
    const currentPotentialPercent = Math.min(100, Math.max(10, parseFloat(rawPotential.toFixed(1))));

    // Determine experience level and realistic monthly gain rate (Helms/McDonald model)
    let trainingExperienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'elite' = 'intermediate';
    let monthlyGainRateKg = 0.4;

    if (trainingYears < 1 || currentPotentialPercent < 75) {
        trainingExperienceLevel = 'beginner';
        monthlyGainRateKg = sex === 'female' ? 0.45 : 0.85;
    } else if (trainingYears < 3 || currentPotentialPercent < 88) {
        trainingExperienceLevel = 'intermediate';
        monthlyGainRateKg = sex === 'female' ? 0.25 : 0.45;
    } else if (trainingYears < 6 || currentPotentialPercent < 96) {
        trainingExperienceLevel = 'advanced';
        monthlyGainRateKg = sex === 'female' ? 0.12 : 0.22;
    } else {
        trainingExperienceLevel = 'elite';
        monthlyGainRateKg = sex === 'female' ? 0.05 : 0.10;
    }

    const milestonePercents = [85, 90, 95, 98, 100];
    const now = new Date();

    const milestones: GeneticMilestone[] = milestonePercents.map((pct) => {
        const targetLeanMassKg = parseFloat(((maxNaturalLeanMassKg * pct) / 100).toFixed(1));
        const needed = parseFloat(Math.max(0, targetLeanMassKg - currentLeanMassKg).toFixed(1));
        const isAchieved = currentPotentialPercent >= pct;

        let estimatedMonths = 0;
        let projectedDateStr = 'Alcanzado';

        if (!isAchieved && needed > 0) {
            // Adaptive rate damping as athlete nears 100% ceiling
            let adaptiveRate = monthlyGainRateKg;
            if (pct >= 95) adaptiveRate = Math.max(0.08, monthlyGainRateKg * 0.65);
            if (pct >= 98) adaptiveRate = Math.max(0.05, monthlyGainRateKg * 0.4);

            estimatedMonths = Math.ceil(needed / adaptiveRate);
            const futureDate = new Date(now.getTime() + estimatedMonths * 30.44 * 24 * 60 * 60 * 1000);
            projectedDateStr = futureDate.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
        }

        return {
            percent: pct,
            targetLeanMassKg,
            additionalLeanMassKg: needed,
            estimatedMonths,
            projectedDate: projectedDateStr,
            isAchieved
        };
    });

    const unachieved100 = milestones.find(m => m.percent === 100);
    const monthsToCeiling = unachieved100 ? unachieved100.estimatedMonths : 0;

    let trajectorySummary = '';
    if (currentPotentialPercent >= 98) {
        trajectorySummary = `Estás en la cúspide de tu potencial genético natural (${currentPotentialPercent}%). Tu foco debe ser máxima densidad, simetría y refinamiento estético.`;
    } else if (currentPotentialPercent >= 90) {
        trajectorySummary = `Físico de nivel avanzado (${currentPotentialPercent}% del techo). Con una tasa de ganancia de ~${monthlyGainRateKg} kg/mes, alcanzarás tu potencial máximo en ~${monthsToCeiling} meses.`;
    } else {
        trajectorySummary = `Alto margen de crecimiento (${currentPotentialPercent}% del potencial). Manteniendo sobrecarga progresiva y superávit limpio, sumarás masa magra a un ritmo de ~${monthlyGainRateKg} kg/mes.`;
    }

    return {
        currentLeanMassKg,
        maxNaturalLeanMassKg,
        currentPotentialPercent,
        trainingExperienceLevel,
        monthlyGainRateKg,
        monthsToCeiling,
        milestones,
        trajectorySummary
    };
};
