import type { BodyMeasurements } from '../types/measurements';

export interface LimbSymmetryItem {
    name: string;
    key: 'arm' | 'forearm' | 'thigh' | 'calf';
    leftCm: number;
    rightCm: number;
    diffCm: number;
    asymmetryPercent: number;
    dominantSide: 'left' | 'right' | 'equal';
    status: 'optimal' | 'mild_imbalance' | 'critical_asymmetry';
    recommendation: string;
}

export interface BilateralSymmetryResult {
    overallScore: number; // 0 to 100%
    overallStatus: 'excellent' | 'good' | 'imbalanced';
    criticalAsymmetryCount: number;
    limbs: LimbSymmetryItem[];
    summary: string;
}

/**
 * Audits bilateral muscular symmetry (Left vs Right) and issues biomechanical corrective prescriptions.
 */
export const calculateBilateralSymmetry = (measurements?: Partial<BodyMeasurements>): BilateralSymmetryResult => {
    if (!measurements) {
        return {
            overallScore: 100,
            overallStatus: 'excellent',
            criticalAsymmetryCount: 0,
            limbs: [],
            summary: 'Sin datos bilaterales suficientes para auditar simetría.'
        };
    }

    const limbDefs: { key: 'arm' | 'forearm' | 'thigh' | 'calf'; name: string; exercise: string }[] = [
        { key: 'arm', name: 'Bíceps / Brazo', exercise: 'Curl concentrado / mancuernas unilaterales' },
        { key: 'forearm', name: 'Antebrazo', exercise: 'Curl de muñeca unilateral con mancuerna' },
        { key: 'thigh', name: 'Muslo / Cuádriceps', exercise: 'Sentadilla búlgara / prensa unilateral' },
        { key: 'calf', name: 'Gemelo / Pantorrilla', exercise: 'Elevación de talones a una pierna' }
    ];

    const auditedLimbs: LimbSymmetryItem[] = [];
    let totalAsymmetry = 0;
    let countedPairs = 0;
    let criticalCount = 0;

    limbDefs.forEach(({ key, name, exercise }) => {
        const val = measurements[key];
        if (val && typeof val === 'object') {
            const left = Number(val.left) || 0;
            const right = Number(val.right) || 0;

            if (left > 0 && right > 0) {
                const diffCm = parseFloat(Math.abs(left - right).toFixed(1));
                const maxVal = Math.max(left, right);
                const asymmetryPercent = parseFloat(((diffCm / maxVal) * 100).toFixed(1));

                let dominantSide: 'left' | 'right' | 'equal' = 'equal';
                if (left > right) dominantSide = 'left';
                else if (right > left) dominantSide = 'right';

                let status: 'optimal' | 'mild_imbalance' | 'critical_asymmetry' = 'optimal';
                let recommendation = 'Simetría anatómica excelente. Mantener volumen bilateral equitativo.';

                if (asymmetryPercent > 4.5) {
                    status = 'critical_asymmetry';
                    criticalCount++;
                    const weakerSide = dominantSide === 'left' ? 'derecho' : 'izquierdo';
                    recommendation = `Asimetría >4.5% detectada. Priorizar ${exercise} iniciando series con el lado ${weakerSide} y limitando las repeticiones del lado fuerte.`;
                } else if (asymmetryPercent > 2.0) {
                    status = 'mild_imbalance';
                    recommendation = `Ligera asimetría (${asymmetryPercent}%). Controlar tempo excéntrico y evitar compensación involuntaria con barra.`;
                }

                auditedLimbs.push({
                    name,
                    key,
                    leftCm: left,
                    rightCm: right,
                    diffCm,
                    asymmetryPercent,
                    dominantSide,
                    status,
                    recommendation
                });

                totalAsymmetry += asymmetryPercent;
                countedPairs++;
            }
        }
    });

    if (countedPairs === 0) {
        return {
            overallScore: 100,
            overallStatus: 'excellent',
            criticalAsymmetryCount: 0,
            limbs: [],
            summary: 'Registra medidas bilaterales (Izq y Der) para desbloquear la auditoría de simetría.'
        };
    }

    const avgAsymmetry = totalAsymmetry / countedPairs;
    const overallScore = Math.min(100, Math.max(50, Math.round(100 - avgAsymmetry * 3.5)));

    let overallStatus: 'excellent' | 'good' | 'imbalanced' = 'excellent';
    let summary = '';

    if (overallScore >= 95) {
        overallStatus = 'excellent';
        summary = `Simetría bilateral de élite (${overallScore}%). El balance entre ambos hemisferios corporales previene compensaciones y optimiza la estética áurea.`;
    } else if (overallScore >= 88) {
        overallStatus = 'good';
        summary = `Buen balance bilateral (${overallScore}%). Ligeras diferencias dentro de rangos normales de dominancia lateral sin riesgo biomecánico.`;
    } else {
        overallStatus = 'imbalanced';
        summary = `Asimetrías significativas detectadas (${overallScore}%). Se recomienda incorporar trabajo unilateral estricto para proteger salud articular y armonía.`;
    }

    return {
        overallScore,
        overallStatus,
        criticalAsymmetryCount: criticalCount,
        limbs: auditedLimbs,
        summary
    };
};
