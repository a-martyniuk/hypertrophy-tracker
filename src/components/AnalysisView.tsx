import {
    Line,
    ReferenceLine,
    YAxis
} from 'recharts';
import { ArrowLeft, Target } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import type { MeasurementRecord, GrowthGoal } from '../types/measurements';
import { StatCard } from './ui/StatCard';
import { useAnalysisData } from '../hooks/useAnalysisData';
import { MeasurementChart } from './analysis/MeasurementChart';
import { AnalysisFilter } from './analysis/AnalysisFilter';
import './AnalysisView.css';

interface Props {
    records: MeasurementRecord[];
    goals: GrowthGoal[];
    sex?: 'male' | 'female';
}

const MUSCLE_LABELS: Record<string, string> = {
    'neck': 'Cuello',
    'pecho': 'Pecho',
    'waist': 'Cintura',
    'hips': 'Cadera',
    'arm-right': 'Bíceps (Der)',
    'arm-left': 'Bíceps (Izq)',
    'forearm-right': 'Antebrazo (Der)',
    'forearm-left': 'Antebrazo (Izq)',
    'thigh-right': 'Muslo (Der)',
    'thigh-left': 'Muslo (Izq)',
    'calf-right': 'Gemelo (Der)',
    'calf-left': 'Gemelo (Izq)',
};

export const AnalysisView = ({ records, goals, sex = 'male' }: Props) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const muscleId = searchParams.get('muscle');

    const {
        timeRange,
        setTimeRange,
        chartData,
        alerts,
        getGoalValue,
        stats
    } = useAnalysisData({ records, goals, sex });

    // --- SUB-COMPONENT: MUSCLE DETAIL VIEW ---
    if (muscleId && MUSCLE_LABELS[muscleId]) {
        const muscleLabel = MUSCLE_LABELS[muscleId];
        const isBilateral = muscleId.includes('-left') || muscleId.includes('-right');
        const baseKey = isBilateral ? muscleId.split('-')[0] : muscleId;
        const side = muscleId.includes('-left') ? 'left' : muscleId.includes('-right') ? 'right' : undefined;

        // Custom Data Processing for single muscle
        const muscleHistory = records.map(r => {
            let val = 0;
            if (side) {
                // @ts-ignore
                val = r.measurements[baseKey]?.[side] || 0;
            } else {
                // @ts-ignore
                val = r.measurements[baseKey] || 0;
            }
            return {
                date: new Date(r.date).toLocaleDateString(),
                rawDate: new Date(r.date),
                value: val
            };
        }).filter(d => d.value > 0).reverse();

        const currentVal = muscleHistory[muscleHistory.length - 1]?.value || 0;
        const startVal = muscleHistory[0]?.value || 0;
        const totalGrowth = currentVal - startVal;

        const goal = goals.find(g => {
            if (baseKey === 'arm') return g.measurementType === 'biceps';
            if (baseKey === 'pecho') return g.measurementType === 'chest';
            if (baseKey === 'thigh') return g.measurementType === 'thigh';
            if (baseKey === 'calf') return g.measurementType === 'calves';
            return g.measurementType === baseKey;
        });

        // Projection Logic
        let projectionMsg = "Datos insuficientes para proyección.";
        let projectedDateText = "--";

        if (muscleHistory.length > 3 && goal) {
            const recent = muscleHistory.slice(-4);
            const lastDate = recent[recent.length - 1].rawDate;
            const firstDate = recent[0].rawDate;
            const daysDiff = (lastDate.getTime() - firstDate.getTime()) / (1000 * 3600 * 24);
            const growthPerDay = (recent[recent.length - 1].value - recent[0].value) / (daysDiff || 1);

            if (growthPerDay > 0 && currentVal < goal.targetValue) {
                const remaining = goal.targetValue - currentVal;
                const daysNeeded = remaining / growthPerDay;
                const date = new Date();
                date.setDate(date.getDate() + daysNeeded);
                projectedDateText = date.toLocaleDateString();
                projectionMsg = `A este ritmo (${(growthPerDay * 30).toFixed(1)} cm/mes), llegarás a tu meta el ${projectedDateText}.`;
            } else if (currentVal >= goal.targetValue) {
                projectionMsg = "¡Has alcanzado tu objetivo!";
                projectedDateText = "¡Logrado!";
            } else {
                projectionMsg = "El crecimiento reciente es estable o negativo.";
            }
        }

        return (
            <div className="analysis-view animate-fade">
                <button className="back-link" onClick={() => setSearchParams({})}>
                    <ArrowLeft size={16} /> Volver al Panel General
                </button>

                <div className="muscle-header glass">
                    <div className="header-content">
                        <h2>Análisis: {muscleLabel}</h2>
                        <div className="highlight-val">{currentVal} cm</div>
                    </div>
                    {goal && (
                        <div className="goal-badge">
                            <Target size={16} /> Meta: {goal.targetValue} cm
                        </div>
                    )}
                </div>

                <div className="stats-mini-grid">
                    <div className="stat-card glass">
                        <label>Crecimiento Total</label>
                        <div className={`value ${totalGrowth >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {totalGrowth > 0 ? '+' : ''}{totalGrowth.toFixed(1)} cm
                        </div>
                    </div>
                    <div className="stat-card glass">
                        <label>Proyección Meta</label>
                        <div className="value text-amber-400">
                            {projectedDateText}
                        </div>
                        <div className="subtext">{projectionMsg}</div>
                    </div>
                </div>

                <MeasurementChart title="Evolución Histórica" data={muscleHistory} height={400}>
                    <ReferenceLine y={goal?.targetValue} stroke="#ef4444" strokeDasharray="3 3" label="Meta" />
                    <Line
                        type="monotone"
                        dataKey="value"
                        stroke="var(--primary-color)"
                        name={muscleLabel}
                        strokeWidth={3}
                        dot={{ r: 4, strokeWidth: 2 }}
                        activeDot={{ r: 6 }}
                    />
                </MeasurementChart>
            </div>
        );
    }

    // --- STANDARD DASHBOARD VIEW ---

    return (
        <div className="analysis-view animate-fade">
            <AnalysisFilter currentRange={timeRange} onChange={setTimeRange} />

            <header className="view-header-stats">
                <StatCard
                    label="Indice W/H (Cintura/Cadera)"
                    value={stats.whrValue}
                    subtitle={
                        <span>
                            {Number(stats.whrValue) < stats.whrThreshold ? 'Rango Saludable' : 'Riesgo Elevado'}
                            <span style={{ fontSize: '0.6em', opacity: 0.7 }}> (Ref: {stats.whrThreshold})</span>
                        </span>
                    }
                    tooltipContent={<div>{/* Keep complex tooltip content or extract if needed */}</div>}
                />
                <StatCard
                    label="Ratio Brazo/Muñeca"
                    value={stats.armPotential}
                    subtitle="Potencial Genético"
                />
                <StatCard
                    label="Ratio Cintura/Pecho"
                    value={stats.vShapeRatio}
                    subtitle="Estética (V-Shape)"
                />
            </header>

            {alerts.length > 0 && (
                <div className="alerts-strip">
                    {alerts.map((a, i) => (
                        <div key={i} className={`alert-item ${a.type}`}>
                            <span className="dot"></span>
                            {a.msg}
                        </div>
                    ))}
                </div>
            )}

            <h2>Panel de Evoluciones</h2>

            <div className="charts-grid">
                <MeasurementChart
                    title="Peso & Cintura"
                    tooltip="Evolución temporal. La cintura es el mejor indicador de grasa corporal real."
                    data={chartData}
                >
                    {getGoalValue('peso') && <ReferenceLine y={getGoalValue('peso')!} stroke="#ef4444" strokeDasharray="3 3" />}
                    {getGoalValue('cintura') && <ReferenceLine y={getGoalValue('cintura')!} stroke="#ef4444" strokeDasharray="3 3" />}
                    <Line type="monotone" dataKey="peso" stroke="#f59e0b" name="Peso (kg)" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="cintura" stroke="#fbbf24" name="Cintura (cm)" strokeWidth={2} dot={{ r: 4 }} />
                </MeasurementChart>

                <MeasurementChart
                    title="Comparativa Brazos (R/L)"
                    tooltip="Detecta asimetrías. Pequeñas diferencias son normales, >1cm requiere atención."
                    data={chartData}
                >
                    <Line type="monotone" dataKey="brazoDer" stroke="#f59e0b" name="Derecho" strokeWidth={2} />
                    <Line type="monotone" dataKey="brazoIzq" stroke="#fbbf24" name="Izquierdo" strokeWidth={2} />
                </MeasurementChart>

                <MeasurementChart
                    title="Comparativa Piernas (R/L)"
                    tooltip="Comparativa de volumen."
                    data={chartData}
                >
                    <Line type="monotone" dataKey="piernaDer" stroke="#f59e0b" name="Derecho" strokeWidth={2} />
                    <Line type="monotone" dataKey="piernaIzq" stroke="#fbbf24" name="Izquierdo" strokeWidth={2} />
                </MeasurementChart>

                <MeasurementChart
                    title="Proporción Tronco"
                    tooltip="Media de Pecho, Espalda y Cuello. Indica crecimiento global del torso."
                    data={chartData}
                >
                    <Line type="step" dataKey="tronco" stroke="#f59e0b" name="Media Tronco" strokeWidth={3} />
                </MeasurementChart>

                <MeasurementChart
                    title="Ratio Cintura/Cadera"
                    tooltip="Indicador clave de salud metabólica."
                    data={chartData}
                >
                    <YAxis domain={[0.5, 1.2]} stroke="#94a3b8" fontSize={12} />
                    <Line type="monotone" dataKey="whr" stroke="#fbbf24" name="W/H Ratio" strokeWidth={2} />
                </MeasurementChart>
            </div>
        </div>
    );
};
