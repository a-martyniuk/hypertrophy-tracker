import type { MeasurementRecord } from '../types/measurements';

export interface TacticalMetricItem {
    label: string;
    value: string;
    trend?: 'up' | 'down' | 'neutral';
}

export interface TacticalDiagnosis {
    headline: string;
    statusBadge: 'HYPERTROPHY_PEAK' | 'CLEAN_RECOMP' | 'SURPLUS_GROWTH' | 'LEAN_CUT' | 'STABLE' | 'FIRST_RECORD';
    statusText: string;
    summary: string;
    highlights: string[];
    metrics: TacticalMetricItem[];
    actionableAdvice: string;
    vTaperDeltaPercent?: number;
    leanMassDeltaKg?: number;
}

export const generateTacticalDiagnosis = (
    current?: MeasurementRecord,
    previous?: MeasurementRecord
): TacticalDiagnosis => {
    if (!current) {
        return {
            headline: 'SIN DATOS SUFICIENTES',
            statusBadge: 'STABLE',
            statusText: 'MODO OBSERVACIÓN',
            summary: 'Registra tu primera medición antropométrica para calibrar los algoritmos de diagnóstico.',
            highlights: ['Esperando telemetría inicial.'],
            metrics: [],
            actionableAdvice: 'Ingresa al formulario y completa las medidas base.'
        };
    }

    if (!previous) {
        const m = current.measurements;
        const chest = m.pecho || 0;
        const waist = m.waist || 0;
        const vRatio = waist > 0 ? (chest / waist).toFixed(2) : '1.0';

        return {
            headline: 'LÍNEA BASE ESTABLECIDA',
            statusBadge: 'FIRST_RECORD',
            statusText: 'CALIBRACIÓN INICIAL',
            summary: `Vector biométrico inicial registrado con éxito. Ratio V-Taper de referencia establecido en ${vRatio}.`,
            highlights: [
                `Peso: ${m.weight} kg`,
                `Pecho: ${m.pecho || '-'} cm / Espalda: ${m.back || '-'} cm`,
                `Cintura: ${m.waist || '-'} cm`
            ],
            metrics: [
                { label: 'Peso de Referencia', value: `${m.weight} kg` },
                { label: 'Torso Superior', value: `Pecho ${m.pecho || '-'} / Espalda ${m.back || '-'} cm` },
                { label: 'Cintura Base', value: `${m.waist || '-'} cm` },
                { label: 'Ratio V-Taper Base', value: `${vRatio}x` }
            ],
            actionableAdvice: 'Mantén tu plan de entrenamiento y nutrición durante 2 a 4 semanas antes de registrar la siguiente auditoría.'
        };
    }

    const cur = current.measurements;
    const prev = previous.measurements;

    // Deltas
    const weightDiff = (cur.weight || 0) - (prev.weight || 0);
    const waistDiff = (cur.waist || 0) - (prev.waist || 0);
    const chestDiff = (cur.pecho || 0) - (prev.pecho || 0);
    const backDiff = (cur.back || 0) - (prev.back || 0);

    const getAvgArm = (m: typeof cur) => {
        const l = m.arm?.left || 0;
        const r = m.arm?.right || 0;
        return (l > 0 && r > 0) ? (l + r) / 2 : (l || r || 0);
    };

    const curArm = getAvgArm(cur);
    const prevArm = getAvgArm(prev);
    const armDiff = curArm - prevArm;

    const curThigh = ((cur.thigh?.left || 0) + (cur.thigh?.right || 0)) / 2;
    const prevThigh = ((prev.thigh?.left || 0) + (prev.thigh?.right || 0)) / 2;
    const thighDiff = curThigh - prevThigh;

    // V-Taper
    const prevVTaper = prev.waist > 0 ? (prev.pecho || 0) / prev.waist : 1;
    const curVTaper = cur.waist > 0 ? (cur.pecho || 0) / cur.waist : 1;
    const vTaperDelta = parseFloat((((curVTaper - prevVTaper) / prevVTaper) * 100).toFixed(1));

    // Lean Mass Delta (if body fat is recorded)
    let leanMassDeltaKg: number | undefined;
    if (cur.bodyFat && prev.bodyFat && cur.weight && prev.weight) {
        const curLean = cur.weight * (1 - cur.bodyFat / 100);
        const prevLean = prev.weight * (1 - prev.bodyFat / 100);
        leanMassDeltaKg = parseFloat((curLean - prevLean).toFixed(1));
    }

    const highlights: string[] = [];
    const metrics: TacticalMetricItem[] = [];

    if (weightDiff !== 0) {
        metrics.push({
            label: 'Peso Corporal',
            value: `${weightDiff > 0 ? '+' : ''}${weightDiff.toFixed(1)} kg`,
            trend: weightDiff > 0 ? 'up' : 'down'
        });
    }
    if (chestDiff !== 0) {
        highlights.push(`Pecho: ${chestDiff > 0 ? '+' : ''}${chestDiff.toFixed(1)} cm`);
        metrics.push({
            label: 'Pecho / Torso',
            value: `${chestDiff > 0 ? '+' : ''}${chestDiff.toFixed(1)} cm`,
            trend: chestDiff > 0 ? 'up' : 'down'
        });
    }
    if (backDiff !== 0) {
        highlights.push(`Espalda: ${backDiff > 0 ? '+' : ''}${backDiff.toFixed(1)} cm`);
        metrics.push({
            label: 'Espalda / Dorsal',
            value: `${backDiff > 0 ? '+' : ''}${backDiff.toFixed(1)} cm`,
            trend: backDiff > 0 ? 'up' : 'down'
        });
    }
    if (armDiff !== 0) {
        highlights.push(`Brazos: ${armDiff > 0 ? '+' : ''}${armDiff.toFixed(1)} cm`);
        metrics.push({
            label: 'Bíceps / Tríceps',
            value: `${armDiff > 0 ? '+' : ''}${armDiff.toFixed(1)} cm`,
            trend: armDiff > 0 ? 'up' : 'down'
        });
    }
    if (waistDiff !== 0) {
        highlights.push(`Cintura: ${waistDiff > 0 ? '+' : ''}${waistDiff.toFixed(1)} cm`);
        metrics.push({
            label: 'Perímetro Cintura',
            value: `${waistDiff > 0 ? '+' : ''}${waistDiff.toFixed(1)} cm`,
            trend: waistDiff < 0 ? 'down' : 'up'
        });
    }
    if (thighDiff !== 0) {
        highlights.push(`Muslos: ${thighDiff > 0 ? '+' : ''}${thighDiff.toFixed(1)} cm`);
        metrics.push({
            label: 'Muslos / Cuádriceps',
            value: `${thighDiff > 0 ? '+' : ''}${thighDiff.toFixed(1)} cm`,
            trend: thighDiff > 0 ? 'up' : 'down'
        });
    }

    if (vTaperDelta !== 0) {
        metrics.push({
            label: 'Evolución V-Taper',
            value: `${vTaperDelta > 0 ? '+' : ''}${vTaperDelta}%`,
            trend: vTaperDelta > 0 ? 'up' : 'down'
        });
    }

    // Diagnosis Logic
    if (chestDiff >= 0.5 && armDiff >= 0.3 && waistDiff <= 0.2) {
        return {
            headline: 'RECOMPOSICIÓN TÁCTICA ÓPTIMA',
            statusBadge: 'CLEAN_RECOMP',
            statusText: 'HIPERTROFIA MAGRA',
            summary: `Vector de crecimiento limpio: Incremento muscular significativo en torso (+${chestDiff.toFixed(1)} cm) y brazos (+${armDiff.toFixed(1)} cm) con cintura controlada (${waistDiff <= 0 ? 'reducción/estable' : `+${waistDiff} cm`}).`,
            highlights,
            metrics,
            vTaperDeltaPercent: vTaperDelta,
            leanMassDeltaKg,
            actionableAdvice: 'Tu balance calórico actual y estímulo mecánico son óptimos. Mantén el volumen de entrenamiento sin alterar el superávit.'
        };
    }

    if (chestDiff > 0 || armDiff > 0 || thighDiff > 0) {
        if (waistDiff > 1.5) {
            return {
                headline: 'CRECIMIENTO CON SUPERÁVIT ELEVADO',
                statusBadge: 'SURPLUS_GROWTH',
                statusText: 'VOLUMEN ALTO',
                summary: `Ganancia muscular detectada pero acompañada de un aumento en el perímetro abdominal (+${waistDiff.toFixed(1)} cm).`,
                highlights,
                metrics,
                vTaperDeltaPercent: vTaperDelta,
                leanMassDeltaKg,
                actionableAdvice: 'Considera reducir ligeramente las calorías en días de descanso (-150 a -250 kcal) para priorizar partición de nutrientes magros.'
            };
        }

        return {
            headline: 'PULSO DE HIPERTROFIA ACTIVO',
            statusBadge: 'HYPERTROPHY_PEAK',
            statusText: 'CRECIMIENTO POSITIVO',
            summary: `Desarrollo sostenido en grupos clave. V-Taper evolucionando favorablemente (${vTaperDelta > 0 ? `+${vTaperDelta}%` : 'estable'}).`,
            highlights,
            metrics,
            vTaperDeltaPercent: vTaperDelta,
            leanMassDeltaKg,
            actionableAdvice: 'Asegura 1.8 a 2.2 g de proteína por kg y optimiza la sobrecarga progresiva en los levantamientos principales.'
        };
    }

    if (waistDiff < -0.5 && weightDiff < 0) {
        return {
            headline: 'DEFINICIÓN Y DÉFICIT EFICIENTE',
            statusBadge: 'LEAN_CUT',
            statusText: 'CORTE DE GRASA',
            summary: `Reducción exitosa de cintura (${waistDiff.toFixed(1)} cm) preservando perímetros en brazos y torso.`,
            highlights,
            metrics,
            vTaperDeltaPercent: vTaperDelta,
            leanMassDeltaKg,
            actionableAdvice: 'Excelente retención de masa magra durante la fase de corte. Mantén alta la intensidad de entrenamiento.'
        };
    }

    return {
        headline: 'ESTADO DE CONSOLIDACIÓN Y ESTABILIDAD',
        statusBadge: 'STABLE',
        statusText: 'MANTENIMIENTO',
        summary: 'Perímetros estables sin fluctuaciones significativas entre ciclos de registro.',
        highlights,
        metrics,
        vTaperDeltaPercent: vTaperDelta,
        leanMassDeltaKg,
        actionableAdvice: 'Si buscas hipertrofia, aumenta gradualmente el volumen efectivo semanal (1-2 series por grupo objetivo).'
    };
};
