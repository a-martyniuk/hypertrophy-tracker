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



import { useTranslation } from 'react-i18next';

export const AnalysisView = ({ records, goals, sex = 'male' }: Props) => {
    const { t } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();
    const muscleId = searchParams.get('muscle');

    // Helper map
    const getMuscleLabel = (id: string) => {
        // Reuse common form labels where possible
        const map: Record<string, string> = {
            'neck': t('common.form.neck'),
            'pecho': t('common.form.chest'),
            'waist': t('common.form.waist'),
            'hips': t('common.form.hips'),
            'arm-right': `${t('common.form.arm')} (R)`,
            'arm-left': `${t('common.form.arm')} (L)`,
            'forearm-right': `${t('common.form.forearm')} (R)`,
            'forearm-left': `${t('common.form.forearm')} (L)`,
            'thigh-right': `${t('common.form.thigh')} (R)`,
            'thigh-left': `${t('common.form.thigh')} (L)`,
            'calf-right': `${t('common.form.calf')} (R)`,
            'calf-left': `${t('common.form.calf')} (L)`,
        };
        return map[id] || id;
    };

    const {
        timeRange,
        setTimeRange,
        chartData,
        alerts,
        getGoalValue,
        stats
    } = useAnalysisData({ records, goals, sex });

    // --- SUB-COMPONENT: MUSCLE DETAIL VIEW ---
    if (muscleId) {
        const muscleLabel = getMuscleLabel(muscleId);
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
        let projectionMsg = t('analysis.projection.insufficient_data');
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
                projectionMsg = t('analysis.projection.estimated', { rate: (growthPerDay * 30).toFixed(1), date: projectedDateText });
            } else if (currentVal >= goal.targetValue) {
                projectionMsg = t('analysis.projection.reached');
                projectedDateText = t('analysis.projection.logrado');
            } else {
                projectionMsg = t('analysis.projection.stagnant');
            }
        }

        return (
            <div className="analysis-view animate-fade">
                <button className="back-link" onClick={() => setSearchParams({})}>
                    <ArrowLeft size={16} /> {t('analysis.back_to_panel')}
                </button>

                <div className="muscle-header glass">
                    <div className="header-content">
                        <h2>{t('analysis.title', { muscle: muscleLabel })}</h2>
                        <div className="highlight-val">{currentVal} cm</div>
                    </div>
                    {goal && (
                        <div className="goal-badge">
                            <Target size={16} /> {t('analysis.meta_label', { value: goal.targetValue })}
                        </div>
                    )}
                </div>

                <div className="stats-mini-grid">
                    <div className="stat-card glass">
                        <label>{t('analysis.total_growth')}</label>
                        <div className={`value ${totalGrowth >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {totalGrowth > 0 ? '+' : ''}{totalGrowth.toFixed(1)} cm
                        </div>
                    </div>
                    <div className="stat-card glass">
                        <label>{t('analysis.projection_meta')}</label>
                        <div className="value text-amber-400">
                            {projectedDateText}
                        </div>
                        <div className="subtext">{projectionMsg}</div>
                    </div>
                </div>

                <MeasurementChart title={t('analysis.historical_evolution')} data={muscleHistory} height={400}>
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
                    tooltipContent={<div>{t('common.tooltips.whr')}</div>}
                />
                <StatCard
                    label="Ratio Brazo/Muñeca"
                    value={stats.armPotential}
                    subtitle="Potencial Genético"
                    tooltipContent={<div>{t('common.tooltips.arm_potential')}</div>}
                />
                <StatCard
                    label="Ratio Cintura/Pecho"
                    value={stats.vShapeRatio}
                    subtitle="Estética (V-Shape)"
                    tooltipContent={<div>{t('common.tooltips.v_shape')}</div>}
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

            <h2>{t('analysis.panel_title')}</h2>

            <div className="charts-grid">
                <MeasurementChart
                    title={t('analysis.charts.weight_waist.title')}
                    tooltip={t('analysis.charts.weight_waist.tooltip')}
                    data={chartData}
                >
                    {getGoalValue('peso') && <ReferenceLine y={getGoalValue('peso')!} stroke="#ef4444" strokeDasharray="3 3" />}
                    {getGoalValue('cintura') && <ReferenceLine y={getGoalValue('cintura')!} stroke="#ef4444" strokeDasharray="3 3" />}
                    <Line type="monotone" dataKey="peso" stroke="#f59e0b" name={t('analysis.charts.weight_waist.weight')} strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="cintura" stroke="#fbbf24" name={t('analysis.charts.weight_waist.waist')} strokeWidth={2} dot={{ r: 4 }} />
                </MeasurementChart>

                <MeasurementChart
                    title={t('analysis.charts.arms_comparison.title')}
                    tooltip={t('analysis.charts.arms_comparison.tooltip')}
                    data={chartData}
                >
                    <Line type="monotone" dataKey="brazoDer" stroke="#f59e0b" name={t('analysis.charts.arms_comparison.right')} strokeWidth={2} />
                    <Line type="monotone" dataKey="brazoIzq" stroke="#fbbf24" name={t('analysis.charts.arms_comparison.left')} strokeWidth={2} />
                </MeasurementChart>

                <MeasurementChart
                    title={t('analysis.charts.legs_comparison.title')}
                    tooltip={t('analysis.charts.legs_comparison.tooltip')}
                    data={chartData}
                >
                    <Line type="monotone" dataKey="piernaDer" stroke="#f59e0b" name={t('analysis.charts.arms_comparison.right')} strokeWidth={2} />
                    <Line type="monotone" dataKey="piernaIzq" stroke="#fbbf24" name={t('analysis.charts.arms_comparison.left')} strokeWidth={2} />
                </MeasurementChart>

                <MeasurementChart
                    title={t('analysis.charts.torso_proportion.title')}
                    tooltip={t('analysis.charts.torso_proportion.tooltip')}
                    data={chartData}
                >
                    <Line type="step" dataKey="tronco" stroke="#f59e0b" name={t('analysis.charts.torso_proportion.avg_torso')} strokeWidth={3} />
                </MeasurementChart>

                <MeasurementChart
                    title={t('analysis.charts.whr.title')}
                    tooltip={t('analysis.charts.whr.tooltip')}
                    data={chartData}
                >
                    <YAxis domain={[0.5, 1.2]} stroke="#94a3b8" fontSize={12} />
                    <Line type="monotone" dataKey="whr" stroke="#fbbf24" name={t('analysis.charts.whr.series')} strokeWidth={2} />
                </MeasurementChart>
            </div>
        </div>
    );
};
