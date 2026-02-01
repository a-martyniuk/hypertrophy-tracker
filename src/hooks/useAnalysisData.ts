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
        return [...filteredRecords].reverse().map(r => ({
            date: new Date(r.date).toLocaleDateString(undefined, { month: '2-digit', day: '2-digit', year: '2-digit' }),
            fullDate: new Date(r.date).toLocaleDateString(),
            peso: r.measurements.weight || 0,
            cintura: r.measurements.waist,
            cadera: r.measurements.hips,
            whr: r.measurements.hips ? Number((r.measurements.waist / r.measurements.hips).toFixed(2)) : 0,
            tronco: (r.measurements.pecho + r.measurements.back + r.measurements.neck) / 3,
            brazoDer: r.measurements.arm.right,
            brazoIzq: r.measurements.arm.left,
            piernaDer: r.measurements.thigh.right,
            piernaIzq: r.measurements.thigh.left,
            condition: r.metadata?.condition || 'fasted',
            sleepHours: r.metadata?.sleepHours || 8,
        }));
    }, [filteredRecords]);

    const alerts = useMemo(() => {
        const latest = records[0];
        const previous = records[1];
        const newAlerts = [];

        if (latest && previous) {
            // Asymmetries
            const armDiff = Math.abs(latest.measurements.arm.left - latest.measurements.arm.right);
            if (armDiff > 1.5) newAlerts.push({ type: 'warning', msg: `Asimetría en brazos detectada: ${armDiff.toFixed(1)}cm` });

            const legDiff = Math.abs(latest.measurements.thigh.left - latest.measurements.thigh.right);
            if (legDiff > 1.5) newAlerts.push({ type: 'warning', msg: `Asimetría en muslos detectada: ${legDiff.toFixed(1)}cm` });

            // Stagnation (last 3 records)
            if (records.length >= 3) {
                const last3 = records.slice(0, 3);
                const weightDelta = last3[0].measurements.weight - last3[2].measurements.weight;
                if (Math.abs(weightDelta) < 0.2) {
                    newAlerts.push({ type: 'info', msg: 'Peso estancado en las últimas 3 mediciones.' });
                }
            }
        }
        return newAlerts;
    }, [records]);

    const getGoalValue = (type: string) => {
        const goal = goals.find(g => g.measurementType === type && g.status === 'active');
        return goal ? goal.targetValue : null;
    };

    const latest = records[0];
    const whrValue = latest ? (latest.measurements.waist / latest.measurements.hips).toFixed(2) : '--';
    const whrThreshold = sex === 'female' ? 0.85 : 0.90;
    const armPotential = latest ? (latest.measurements.arm.right / latest.measurements.wrist.right).toFixed(2) : '--';
    const vShapeRatio = latest ? (latest.measurements.waist / latest.measurements.pecho).toFixed(2) : '--';

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
