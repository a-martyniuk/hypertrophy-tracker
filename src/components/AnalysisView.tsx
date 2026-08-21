import React, { useState } from 'react';
import {
    Line,
    ReferenceLine,
    YAxis
} from 'recharts';
import { ArrowLeft, Target, BarChart3, TrendingUp, Sparkles, Scale } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { MeasurementRecord, GrowthGoal } from '../types/measurements';
import { useAnalysisData } from '../hooks/useAnalysisData';
import { computeComprehensiveAnalysis } from '../utils/benchmarkAnalysis';
import { MeasurementChart } from './analysis/MeasurementChart';
import { AnalysisFilter } from './analysis/AnalysisFilter';
import { ProportionsRadar } from './analysis/ProportionsRadar';
import { PhysiqueOverviewHero } from './analysis/PhysiqueOverviewHero';
import { BenchmarkCard } from './analysis/BenchmarkCard';
import { RatioBenchmarkCard } from './analysis/RatioBenchmarkCard';
import './AnalysisView.css';

interface Props {
    records: MeasurementRecord[];
    goals: GrowthGoal[];
    sex?: 'male' | 'female';
}

export const AnalysisView: React.FC<Props> = ({ records, goals, sex = 'male' }) => {
    const { t } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();
    const muscleId = searchParams.get('muscle');
    const [activeTab, setActiveTab] = useState<'benchmarks' | 'ratios' | 'history'>('benchmarks');

    const latestRecord = records[0];
    const comprehensiveAnalysis = computeComprehensiveAnalysis(latestRecord?.measurements, sex);

    // Helper map for muscle detail
    const getMuscleLabel = (id: string) => {
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
        getGoalValue
    } = useAnalysisData({ records, goals, sex });

    // --- SUB-COMPONENT: MUSCLE DETAIL DRILL-DOWN ---
    if (muscleId) {
        const muscleLabel = getMuscleLabel(muscleId);
        const isBilateral = muscleId.includes('-left') || muscleId.includes('-right');
        const baseKey = isBilateral ? muscleId.split('-')[0] : muscleId;
        const side = muscleId.includes('-left') ? 'left' : muscleId.includes('-right') ? 'right' : undefined;

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
            if (baseKey === 'arm') return g.measurementType === 'biceps' || g.measurementType === 'arm.right' || g.measurementType === 'arm.left';
            if (baseKey === 'pecho') return g.measurementType === 'chest' || g.measurementType === 'pecho';
            if (baseKey === 'thigh') return g.measurementType === 'thigh' || g.measurementType === 'thigh.right' || g.measurementType === 'thigh.left';
            if (baseKey === 'calf') return g.measurementType === 'calves' || g.measurementType === 'calf.right' || g.measurementType === 'calf.left';
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

                <div className="card glass p-6 rounded-2xl border border-amber-500/30" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>{t('analysis.title', { muscle: muscleLabel })}</h2>
                        <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--primary-color)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>{currentVal} cm</div>
                    </div>
                    {goal && (
                        <div style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#fbbf24', padding: '6px 12px', borderRadius: '10px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Target size={16} /> {t('analysis.meta_label', { value: goal.targetValue })}
                        </div>
                    )}
                </div>

                <div className="physique-split-grid">
                    <div className="physique-split-box">
                        <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{t('analysis.total_growth')}</label>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-mono)', marginTop: '4px', color: totalGrowth >= 0 ? '#34d399' : '#f43f5e' }}>
                            {totalGrowth > 0 ? '+' : ''}{totalGrowth.toFixed(1)} cm
                        </div>
                    </div>
                    <div className="physique-split-box">
                        <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{t('analysis.projection_meta')}</label>
                        <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-mono)', marginTop: '4px', color: 'var(--primary-color)' }}>
                            {projectedDateText}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>{projectionMsg}</div>
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

    // --- EMPTY STATE FALLBACK ---
    if (!latestRecord || !comprehensiveAnalysis) {
        return (
            <div className="analysis-view animate-fade">
                <div className="card glass p-10 text-center rounded-3xl border border-amber-500/30" style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
                    <BarChart3 style={{ margin: '0 auto 1rem', color: 'var(--primary-color)', opacity: 0.8 }} size={48} />
                    <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono)', marginBottom: '0.5rem' }}>
                        Sin Datos de Análisis Suficientes
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: '#94a3b8', maxWidth: '480px', margin: '0 auto 1.5rem' }}>
                        Registra tu primera medición antropométrica en "Nueva Medida" para calibrar tus benchmarks corporales, niveles de hipertrofia y ratios clásicos.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="analysis-view animate-fade">
            {/* Top Navigation / Section Switcher */}
            <div className="analysis-nav-header">
                <div className="analysis-title-group">
                    <h1>
                        <BarChart3 style={{ color: 'var(--primary-color)' }} size={24} />
                        <span>ANÁLISIS BIOMÉTRICO & BENCHMARKS</span>
                    </h1>
                    <p>
                        Evaluación anatómica contra modelos de Steve Reeves, Casey Butt y proporciones áureas.
                    </p>
                </div>

                <div className="analysis-tabs">
                    <button
                        onClick={() => setActiveTab('benchmarks')}
                        className={`analysis-tab-btn ${activeTab === 'benchmarks' ? 'active' : ''}`}
                    >
                        <Scale size={14} />
                        <span>Niveles & Benchmarks</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('ratios')}
                        className={`analysis-tab-btn ${activeTab === 'ratios' ? 'active' : ''}`}
                    >
                        <Sparkles size={14} />
                        <span>Ratios & Simetría</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`analysis-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
                    >
                        <TrendingUp size={14} />
                        <span>Tendencias</span>
                    </button>
                    <a
                        href="/potential"
                        className="analysis-tab-btn"
                        style={{ color: '#fbbf24', textDecoration: 'none', borderLeft: '1px solid rgba(255, 255, 255, 0.1)', paddingLeft: '0.75rem' }}
                    >
                        <span>🧬 Simulador Genético &rarr;</span>
                    </a>
                </div>
            </div>

            {/* 1. Global Executive Development Banner */}
            <PhysiqueOverviewHero analysis={comprehensiveAnalysis} />

            {/* Alerts Strip */}
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

            {/* TAB 1: BENCHMARKS & PROGRESS TOWARDS GENETIC LIMIT */}
            {activeTab === 'benchmarks' && (
                <section style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                                <Scale style={{ color: 'var(--primary-color)' }} size={18} />
                                <span>MATRIZ DE BENCHMARKS POR GRUPO MUSCULAR</span>
                            </h3>
                            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '4px 0 0 0' }}>
                                Compara cada uno de tus perímetros corporales contra las referencias estadísticas: <strong>Base &lt; Intermedio &lt; Avanzado &lt; Élite Natural</strong>.
                            </p>
                        </div>
                    </div>

                    <div className="benchmarks-grid">
                        {comprehensiveAnalysis.muscleBenchmarks.map((bm) => (
                            <BenchmarkCard
                                key={bm.key}
                                benchmark={bm}
                                onClick={() => setSearchParams({ muscle: bm.key })}
                            />
                        ))}
                    </div>
                </section>
            )}

            {/* TAB 2: RATIOS BIOMECÁNICOS Y CÁNONES CLÁSICOS */}
            {activeTab === 'ratios' && (
                <section style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                            <Sparkles style={{ color: 'var(--primary-color)' }} size={18} />
                            <span>AUDITORÍA DE RATIOS CLÁSICOS Y ESTÉTICOS</span>
                        </h3>
                        <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '4px 0 0 0' }}>
                            Escalas de proporción para evaluar la conicidad del torso (V-Taper), armonía entre extremidades y salud metabólica.
                        </p>
                    </div>

                    <div className="ratios-grid">
                        {comprehensiveAnalysis.ratioBenchmarks.map((ratio) => (
                            <RatioBenchmarkCard key={ratio.id} benchmark={ratio} />
                        ))}
                    </div>

                    {/* Radar Chart de Simetría */}
                    <div style={{ paddingTop: '1rem' }}>
                        <ProportionsRadar measurements={latestRecord?.measurements} />
                    </div>
                </section>
            )}

            {/* TAB 3: TENDENCIAS Y EVOLUCIÓN HISTÓRICA */}
            {activeTab === 'history' && (
                <section style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                        <div>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono)', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                                <TrendingUp style={{ color: 'var(--primary-color)' }} size={18} />
                                <span>EVOLUCIÓN TEMPORAL DE TELEMETRÍA</span>
                            </h3>
                            <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '4px 0 0 0' }}>
                                Seguimiento longitudinal de peso corporal, extremidades y composición.
                            </p>
                        </div>
                        <AnalysisFilter currentRange={timeRange} onChange={setTimeRange} />
                    </div>

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
                </section>
            )}
        </div>
    );
};
