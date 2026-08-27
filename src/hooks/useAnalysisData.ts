import { useState, useMemo } from 'react';
import type { MeasurementRecord, GrowthGoal } from '../types/measurements';

export type TimeRange = 'all' | '1y' | '6m' | '3m';

interface UseAnalysisDataProps {
    records: MeasurementRecord[];
    goals: GrowthGoal[];
    sex?: 'male' | 'female';
}

export const useAnalysisData = ({ records, goals, sex = 'male' }: UseAnalysisDataProps) => {
    const [timeRange, setTimeRange] = useState<TimeRange>('all');

    const filteredRecords = useMemo(() => {
        if (timeRange === 'all') return records;

        const now = new Date();
        const cutoffDate = new Date();

        switch (timeRange) {
            case '1y': cutoffDate.setFullYear(now.getFullYear() - 1); break;
            case '6m': cutoffDate.setMonth(now.getMonth() - 6); break;
            case '3m': cutoffDate.setMonth(now.getMonth() - 3); break;
        }

        return records.filter(r => new Date(r.date) >= cutoffDate);
    }, [records, timeRange]);

    const chartData = useMemo(() => {
        return [...filteredRecords].reverse().map(r => {
            const m = r.measurements || {};
            const p = m.pecho || 0;
            const b = m.back || 0;
            const n = m.neck || 0;
            const torsoParts = [p, b, n].filter(v => v > 0);
            const tronco = torsoParts.length > 0
                ? parseFloat((torsoParts.reduce((acc, curr) => acc + curr, 0) / torsoParts.length).toFixed(1))
                : (p || 0);

            return {
                date: new Date(r.date).toLocaleDateString(undefined, { month: '2-digit', day: '2-digit', year: '2-digit' }),
                fullDate: new Date(r.date).toLocaleDateString(),
                peso: m.weight || 0,
                cintura: m.waist || 0,
                cadera: m.hips || 0,
                pecho: p,
                whr: (m.hips && m.hips > 0 && m.waist && m.waist > 0) ? Number((m.waist / m.hips).toFixed(2)) : 0,
                tronco,
                brazoDer: m.arm?.right || 0,
                brazoIzq: m.arm?.left || 0,
                piernaDer: m.thigh?.right || 0,
                piernaIzq: m.thigh?.left || 0,
                condition: r.metadata?.condition || 'fasted',
                sleepHours: r.metadata?.sleepHours || 8,
            };
        });
    }, [filteredRecords]);

    const alerts = useMemo(() => {
        const latest = records[0];
        const previous = records[1];
        const newAlerts = [];

        if (latest && previous) {
            // Asymmetries (only evaluate if both sides were measured > 0)
            const armL = latest.measurements.arm?.left || 0;
            const armR = latest.measurements.arm?.right || 0;
            if (armL > 0 && armR > 0) {
                const armDiff = Math.abs(armL - armR);
                if (armDiff > 1.5) newAlerts.push({ type: 'warning', msg: `Asimetría en brazos detectada: ${armDiff.toFixed(1)}cm` });
            }

            const legL = latest.measurements.thigh?.left || 0;
            const legR = latest.measurements.thigh?.right || 0;
            if (legL > 0 && legR > 0) {
                const legDiff = Math.abs(legL - legR);
                if (legDiff > 1.5) newAlerts.push({ type: 'warning', msg: `Asimetría en muslos detectada: ${legDiff.toFixed(1)}cm` });
            }

            // Stagnation (last 3 records)
            if (records.length >= 3) {
                const last3 = records.slice(0, 3);
                const w0 = last3[0].measurements.weight || 0;
                const w2 = last3[2].measurements.weight || 0;
                if (w0 > 0 && w2 > 0) {
                    const weightDelta = w0 - w2;
                    if (Math.abs(weightDelta) < 0.2) {
                        newAlerts.push({ type: 'info', msg: 'Peso estancado en las últimas 3 mediciones.' });
                    }
                }
            }
        }
        return newAlerts;
    }, [records]);

    const getGoalValue = (type: string) => {
        const goal = goals.find(g => (g.measurementType === type || (type === 'arm' && (g.measurementType === 'biceps' || g.measurementType.startsWith('arm.')))) && g.status === 'active');
        return goal ? goal.targetValue : null;
    };

    const latest = records[0];
    const lm = latest?.measurements;
    const whrValue = (lm?.waist && lm?.hips && lm.hips > 0) ? (lm.waist / lm.hips).toFixed(2) : '--';
    const whrThreshold = sex === 'female' ? 0.85 : 0.90;
    const armR = lm?.arm?.right || lm?.arm?.left || 0;
    const wristR = lm?.wrist?.right || lm?.wrist?.left || 0;
    const armPotential = (armR > 0 && wristR > 0) ? (armR / wristR).toFixed(2) : '--';
    const chestVal = lm?.pecho || 0;
    const waistVal = lm?.waist || 0;
    const vShapeRatio = (chestVal > 0 && waistVal > 0) ? (chestVal / waistVal).toFixed(2) : '--';

    return {
        timeRange,
        setTimeRange,
        chartData,
        alerts,
        getGoalValue,
        stats: {
            whrValue,
            whrThreshold,
            armPotential,
            vShapeRatio
        }
    };
};
