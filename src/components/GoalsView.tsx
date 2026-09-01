import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Target, Plus, Trash2, TrendingUp, ChevronRight, Sparkles, Calendar, ArrowRight, Clock } from 'lucide-react';
import type { GrowthGoal, MeasurementRecord, UserProfile } from '../types/measurements';
import { calculateSkeletalPotential, calculateBerkhanLimit } from '../utils/skeletal';
import { computeComprehensiveAnalysis } from '../utils/benchmarkAnalysis';
import { analyzeProportions } from '../utils/proportions';
import { predictGoalTimeline } from '../utils/goalPredictor';
import { formatDateSafe } from '../utils/dateUtils';
import { useToast } from './ui/ToastProvider';

interface Props {
    goals: GrowthGoal[];
    onAddGoal: (goal: Omit<GrowthGoal, 'id' | 'createdAt'>) => Promise<void>;
    onDeleteGoal: (id: string) => Promise<void>;
    latestRecord?: MeasurementRecord;
    profile?: UserProfile | null;
    records?: MeasurementRecord[];
    onRefresh?: () => void;
}

import './GoalsView.css';

export const GoalsView = ({ goals, onAddGoal, onDeleteGoal, latestRecord, profile, records: _records = [], onRefresh }: Props) => {
    const { t } = useTranslation();
    const { addToast } = useToast();

    // Refresh data on mount to ensure we aren't seeing stale empty state
    useEffect(() => {
        if (onRefresh) onRefresh();
    }, []);

    const [isAdding, setIsAdding] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [newGoal, setNewGoal] = useState({
        measurementType: 'weight' as GrowthGoal['measurementType'],
        targetValue: 0,
        targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default 3 months
        status: 'active' as const
    });

    const measurementLabels: Record<string, string> = {
        weight: t('common.goals.labels.weight'),
        bodyFat: t('common.goals.labels.bodyFat'),
        neck: t('common.goals.labels.neck'),
        back: t('common.goals.labels.back'),
        pecho: t('common.goals.labels.chest'),
        waist: t('common.goals.labels.waist'),
        hips: t('common.goals.labels.hips'),
        'arm.left': `${t('common.goals.labels.arm')} (L)`,
        'arm.right': `${t('common.goals.labels.arm')} (R)`,
        'forearm.left': `${t('common.goals.labels.forearm')} (L)`,
        'forearm.right': `${t('common.goals.labels.forearm')} (R)`,
        'thigh.left': `${t('common.goals.labels.thigh')} (L)`,
        'thigh.right': `${t('common.goals.labels.thigh')} (R)`,
        'calf.left': `${t('common.goals.labels.calf')} (L)`,
        'calf.right': `${t('common.goals.labels.calf')} (R)`,
    };

    const suggestions = useMemo(() => {
        const m = latestRecord?.measurements;
        const sex = profile?.sex || 'male';
        const height = m?.height || profile?.height || (sex === 'female' ? 165 : 178);
        const weight = m?.weight || profile?.weight || (sex === 'female' ? 60 : 75);
        const bodyFat = m?.bodyFat || (sex === 'female' ? 22 : 15);

        const getAvg = (val?: number | { left?: number; right?: number }): number => {
            if (!val) return 0;
            if (typeof val === 'number') return val;
            const l = val.left || 0;
            const r = val.right || 0;
            if (l > 0 && r > 0) return parseFloat(((l + r) / 2).toFixed(1));
            return l || r || 0;
        };

        const wristAvg = profile?.baseline?.wrist || getAvg(m?.wrist) || (sex === 'female' ? 15.5 : 17.5);
        const ankleAvg = profile?.baseline?.ankle || getAvg(m?.ankle) || (sex === 'female' ? 20.5 : 22.5);

        const potential = calculateSkeletalPotential(wristAvg, ankleAvg, height, sex);
        const berkhan = calculateBerkhanLimit(height, sex, bodyFat);
        const analysis = m ? computeComprehensiveAnalysis(m, sex) : null;
        const props = m ? analyzeProportions(m, sex) : null;

        const list: Array<{
            label: string;
            type: GrowthGoal['measurementType'];
            value: number;
            unit?: string;
            badge: string;
            badgeBg?: string;
            badgeColor?: string;
            badgeBorder?: string;
            reason: string;
            currentValue?: number;
            diff?: number;
        }> = [];

        // 1. Pautas de Puntos Rezagados / Próximo Nivel (del Análisis Integral)
        if (analysis?.muscleBenchmarks) {
            analysis.muscleBenchmarks.forEach(bm => {
                if (bm.deltaToNextLevel && bm.deltaToNextLevel > 0 && bm.nextLevelLabel) {
                    const targetVal = parseFloat((bm.current + bm.deltaToNextLevel).toFixed(1));
                    let goalType: GrowthGoal['measurementType'] = 'pecho';
                    if (bm.key === 'arm') goalType = 'arm.right';
                    else if (bm.key === 'forearm') goalType = 'forearm.right';
                    else if (bm.key === 'thigh') goalType = 'thigh.right';
                    else if (bm.key === 'calf') goalType = 'calf.right';
                    else if (bm.key === 'neck') goalType = 'neck';
                    else if (bm.key === 'chest') goalType = 'pecho';

                    list.push({
                        label: `Ascenso a ${bm.nextLevelLabel}: ${bm.label}`,
                        type: goalType,
                        value: targetVal,
                        unit: 'cm',
                        badge: bm.level === 'beginner' ? '🔥 Rezagado' : '⭐ Próximo Nivel',
                        badgeBg: bm.levelBg,
                        badgeColor: bm.levelColor,
                        badgeBorder: `${bm.levelColor}40`,
                        reason: `Faltan +${bm.deltaToNextLevel} cm para ascender de ${bm.levelLabel} a ${bm.nextLevelLabel} en el análisis.`,
                        currentValue: bm.current,
                        diff: bm.deltaToNextLevel
                    });
                }
            });
        }

        // 2. Pautas de Corrección de Asimetrías Bilaterales (del Análisis de Simetría)
        if (props?.asymmetries) {
            props.asymmetries.forEach(asym => {
                if (asym.severity !== 'none' && asym.diff >= 0.7) {
                    const laggingSide = asym.largerSide === 'right' ? 'left' : 'right';
                    const targetVal = asym.largerSide === 'right' ? asym.right : asym.left;
                    const curVal = asym.largerSide === 'right' ? asym.left : asym.right;
                    const goalType = `${asym.group}.${laggingSide}` as GrowthGoal['measurementType'];

                    list.push({
                        label: `Nivelación Bilateral: ${asym.label} (${laggingSide === 'left' ? 'Izq' : 'Der'})`,
                        type: goalType,
                        value: targetVal,
                        unit: 'cm',
                        badge: '⚖️ Asimetría',
                        badgeBg: 'rgba(239, 68, 68, 0.15)',
                        badgeColor: '#f87171',
                        badgeBorder: 'rgba(239, 68, 68, 0.35)',
                        reason: `Equiparar el lado rezagado (${curVal} cm) con el lado dominante (${targetVal} cm) para corregir el desbalance de ${asym.diff} cm.`,
                        currentValue: curVal,
                        diff: asym.diff
                    });
                }
            });
        }

        // 3. Pautas de Proporción Áurea & Adonis Index (del Análisis de Proporciones)
        if (props?.adonisIndex) {
            const chest = m?.pecho || 0;
            const waist = m?.waist || 0;
            if (chest > 0 && waist > 0) {
                // Ideal Chest for waist
                if (props.adonisIndex.idealChestForWaist > chest) {
                    const diff = parseFloat((props.adonisIndex.idealChestForWaist - chest).toFixed(1));
                    list.push({
                        label: 'V-Taper Dorado: Pecho Áureo (1.618)',
                        type: 'pecho',
                        value: props.adonisIndex.idealChestForWaist,
                        unit: 'cm',
                        badge: '✨ Proporción Áurea',
                        badgeBg: 'rgba(245, 158, 11, 0.15)',
                        badgeColor: '#fbbf24',
                        badgeBorder: 'rgba(245, 158, 11, 0.4)',
                        reason: `Desarrollo de torso óptimo (${props.adonisIndex.idealChestForWaist} cm) para alcanzar el ratio áureo 1.618 con tu cintura de ${waist} cm.`,
                        currentValue: chest,
                        diff
                    });
                }
                // Ideal Aesthetic Waist
                const idealWaist = parseFloat((chest / (sex === 'female' ? 1.38 : 1.618)).toFixed(1));
                if (waist > idealWaist + 1.5) {
                    const diff = parseFloat((idealWaist - waist).toFixed(1));
                    list.push({
                        label: 'Cintura Estética (V-Taper)',
                        type: 'waist',
                        value: idealWaist,
                        unit: 'cm',
                        badge: '✨ Cintura Proporcional',
                        badgeBg: 'rgba(56, 189, 248, 0.15)',
                        badgeColor: '#38bdf8',
                        badgeBorder: 'rgba(56, 189, 248, 0.4)',
                        reason: `Cintura de máxima estética para amplificar el V-Taper respecto a tu torso actual de ${chest} cm.`,
                        currentValue: waist,
                        diff
                    });
                }
            }
        }

        // 4. Tríada Clásica de Steve Reeves (Arm ≈ Neck ≈ Calf)
        if (props?.reevesTriad) {
            const { armAvg, neck: _neck, calfAvg } = props.reevesTriad;
            if (armAvg > 0 && calfAvg > 0 && armAvg > calfAvg + 0.8) {
                const diff = parseFloat((armAvg - calfAvg).toFixed(1));
                list.push({
                    label: 'Tríada Reeves: Gemelos Simétricos',
                    type: 'calf.right',
                    value: armAvg,
                    unit: 'cm',
                    badge: '🏛️ Tríada Reeves 1:1:1',
                    badgeBg: 'rgba(168, 85, 247, 0.15)',
                    badgeColor: '#c084fc',
                    badgeBorder: 'rgba(168, 85, 247, 0.4)',
                    reason: `Igualar el perímetro de gemelos (${calfAvg} cm) con tus brazos (${armAvg} cm) para cumplir la proporción clásica de Steve Reeves.`,
                    currentValue: calfAvg,
                    diff
                });
            }
        }

        // 5. Techo Máximo Magro & Potencial Genético (Berkhan & Casey Butt)
        if (berkhan.maxLeanWeightKg > weight) {
            const diff = parseFloat((berkhan.maxLeanWeightKg - weight).toFixed(1));
            list.push({
                label: 'Límite Máximo Magro (Martin Berkhan)',
                type: 'weight',
                value: berkhan.maxLeanWeightKg,
                unit: 'kg',
                badge: '🧬 Techo Natural',
                badgeBg: 'rgba(16, 185, 129, 0.15)',
                badgeColor: '#34d399',
                badgeBorder: 'rgba(16, 185, 129, 0.4)',
                reason: `Techo muscular al 5% de grasa corporal estimado para tu estatura (${height} cm).`,
                currentValue: weight,
                diff
            });
        }

        // Potential Chest (Casey Butt)
        const curChest = m?.pecho || 0;
        if (potential.chest > curChest) {
            list.push({
                label: 'Potencial Genético de Pecho (Casey Butt)',
                type: 'pecho',
                value: potential.chest,
                unit: 'cm',
                badge: '🧬 Potencial Óseo',
                badgeBg: 'rgba(245, 158, 11, 0.15)',
                badgeColor: '#fbbf24',
                badgeBorder: 'rgba(245, 158, 11, 0.4)',
                reason: `Límite torácico natural derivado de tu muñeca (${wristAvg} cm) y tobillo (${ankleAvg} cm).`,
                currentValue: curChest || undefined,
                diff: curChest ? parseFloat((potential.chest - curChest).toFixed(1)) : undefined
            });
        }

        // Potential Arm (Casey Butt)
        const curArm = getAvg(m?.arm);
        if (potential.biceps > curArm) {
            list.push({
                label: 'Potencial Genético de Brazo (Casey Butt)',
                type: 'arm.right',
                value: potential.biceps,
                unit: 'cm',
                badge: '🧬 Potencial Óseo',
                badgeBg: 'rgba(245, 158, 11, 0.15)',
                badgeColor: '#fbbf24',
                badgeBorder: 'rgba(245, 158, 11, 0.4)',
                reason: `Límite de bíceps flexionado proyectado según tu estructura ósea.`,
                currentValue: curArm || undefined,
                diff: curArm ? parseFloat((potential.biceps - curArm).toFixed(1)) : undefined
            });
        }

        return list;
    }, [profile, latestRecord, t]);

    const getLatestValue = (type: string): number => {
        if (!latestRecord) return 0;
        const measurements = latestRecord.measurements as any;
        if (type.includes('.')) {
            const [base, side] = type.split('.');
            const val = measurements[base];
            if (typeof val === 'number') return val;
            return val?.[side] || 0;
        }
        if (type === 'biceps' || type === 'arm') {
            const val = measurements.arm;
            return typeof val === 'number' ? val : Math.max(val?.right || 0, val?.left || 0);
        }
        if (type === 'forearm') {
            const val = measurements.forearm;
            return typeof val === 'number' ? val : Math.max(val?.right || 0, val?.left || 0);
        }
        if (type === 'thigh') {
            const val = measurements.thigh;
            return typeof val === 'number' ? val : Math.max(val?.right || 0, val?.left || 0);
        }
        if (type === 'chest') return measurements.pecho || 0;
        if (type === 'calves' || type === 'calf') {
            const val = measurements.calf;
            return typeof val === 'number' ? val : Math.max(val?.right || 0, val?.left || 0);
        }
        return typeof measurements[type] === 'number' ? measurements[type] : 0;
    };

    const calculateProgress = (goal: GrowthGoal) => {
        const current = getLatestValue(goal.measurementType);
        if (current === 0) return 0;

        const gap = Math.abs(goal.targetValue - current);
        const target = goal.targetValue;
        return Math.max(0, Math.min(100, Math.round(100 - (gap / target * 100))));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('[GoalsView] Submitting new goal:', newGoal);
        try {
            setSubmitting(true);
            await onAddGoal({
                userId: profile?.id || 'guest',
                ...newGoal
            });
            console.log('[GoalsView] Add goal success, closing form');
            addToast('Nuevo objetivo fijado con éxito', 'success');
            setIsAdding(false);
        } catch (error) {
            console.error("[GoalsView] Failed to add goal:", error);
            addToast('Error al guardar el objetivo', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const quickAdd = (s: typeof suggestions[0]) => {
        setNewGoal({
            ...newGoal,
            measurementType: s.type as GrowthGoal['measurementType'],
            targetValue: s.value
        });
        setIsAdding(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="goals-view animate-fade">
            {/* Unified Page Header */}
            <div className="view-header" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '0.75rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--primary-color)' }}>
                        <Target size={24} />
                        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>{t('common.goals.title')}</h2>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                        {t('common.goals.subtitle')}
                    </p>
                </div>
                <button className="btn-primary" onClick={() => setIsAdding(!isAdding)}>
                    <Plus size={18} />
                    {isAdding ? t('common.goals.cancel') : t('common.goals.new_goal')}
                </button>
            </div>

            {/* Smart Suggestions from Analysis */}
            {suggestions.length > 0 && !isAdding && (
                <div className="suggestions-section">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <h3 style={{ fontSize: '0.9rem', fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                            <Sparkles size={16} />
                            <span>Pautas Recomendadas del Análisis</span>
                        </h3>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                            Toca una tarjeta para fijarla como meta
                        </span>
                    </div>
                    <div className="suggestions-scroll">
                        {suggestions.map((s, idx) => (
                            <div key={idx} className="suggestion-card glass" onClick={() => quickAdd(s)}>
                                <div className="sug-header">
                                    <span
                                        className="sug-badge"
                                        style={{
                                            background: s.badgeBg || 'rgba(245, 158, 11, 0.15)',
                                            color: s.badgeColor || '#fbbf24',
                                            borderColor: s.badgeBorder || 'rgba(245, 158, 11, 0.35)'
                                        }}
                                    >
                                        {s.badge}
                                    </span>
                                    {s.currentValue !== undefined && (
                                        <span className="sug-current">
                                            Actual: {s.currentValue} {s.unit || 'cm'}
                                        </span>
                                    )}
                                </div>
                                <h4>{s.label}</h4>
                                <div className="sug-val">
                                    {s.value} <span>{s.unit || 'cm'}</span>
                                    {s.diff !== undefined && (
                                        <span style={{ color: '#fbbf24', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', marginLeft: '0.5rem', fontWeight: 700 }}>
                                            ({s.diff > 0 ? `+${s.diff}` : s.diff} {s.unit || 'cm'})
                                        </span>
                                    )}
                                </div>
                                <p>{s.reason}</p>
                                <div className="sug-action">
                                    {t('common.goals.use_goal', 'Fijar este Objetivo')} <ArrowRight size={14} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {isAdding && (
                <form className="goal-form glass animate-slide-down" onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>{t('common.goals.metric')}</label>
                            <select
                                value={newGoal.measurementType}
                                onChange={(e) => setNewGoal({ ...newGoal, measurementType: e.target.value as GrowthGoal['measurementType'] })}
                            >
                                {Object.entries(measurementLabels).map(([key, label]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>{t('common.goals.target_value')}</label>
                            <input
                                type="number"
                                inputMode="decimal"
                                step="0.1"
                                value={newGoal.targetValue || ''}
                                onChange={(e) => setNewGoal({ ...newGoal, targetValue: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                        <div className="form-group">
                            <label>{t('common.goals.deadline')}</label>
                            <input
                                type="date"
                                value={newGoal.targetDate}
                                onChange={(e) => setNewGoal({ ...newGoal, targetDate: e.target.value })}
                            />
                        </div>
                    </div>
                    <button type="submit" className="btn-primary" disabled={submitting}>
                        {submitting ? t('common.goals.saving') : t('common.goals.save_btn')}
                    </button>
                </form>
            )}

            <div className="goals-grid">
                {goals.length === 0 ? (
                    <div className="empty-state glass">
                        <Target size={48} />
                        <p>{t('common.goals.empty')}</p>
                    </div>
                ) : (
                    goals.map(goal => {
                        const progress = calculateProgress(goal);
                        const current = getLatestValue(goal.measurementType);
                        const prediction = predictGoalTimeline(goal, latestRecord, profile);

                        return (
                            <div key={goal.id} className="goal-card glass">
                                <div className="goal-card-header">
                                    <div className="icon-wrap">
                                        <TrendingUp size={18} />
                                    </div>
                                    <div className="goal-title">
                                        <h3>{measurementLabels[goal.measurementType] || goal.measurementType}</h3>
                                        <span className="deadline">
                                            <Calendar size={10} style={{ marginRight: 4 }} />
                                            {formatDateSafe(goal.targetDate)}
                                        </span>
                                    </div>
                                    <button
                                        className="delete-btn"
                                        title={t('common.goals.confirm_delete')}
                                        onClick={async () => {
                                            if (window.confirm(t('common.goals.confirm_delete'))) {
                                                await onDeleteGoal(goal.id);
                                                addToast('Objetivo eliminado', 'info');
                                            }
                                        }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>

                                <div className="goal-stats">
                                    <div className="stat">
                                        <label>{t('common.goals.current')}</label>
                                        <div className="val">{current} {prediction.unit}</div>
                                    </div>
                                    <ChevronRight className="arrow" size={14} />
                                    <div className="stat">
                                        <label>{t('common.goals.target')}</label>
                                        <div className="val highlight">{goal.targetValue} {prediction.unit}</div>
                                    </div>
                                </div>

                                {/* Time-to-Goal Scientific Prediction Engine Widget */}
                                <div className="time-to-goal-widget glass-darker">
                                    <div className="ttg-top-row">
                                        <div className="ttg-date-group">
                                            <Clock size={13} className="text-amber-400" />
                                            <span className="ttg-date-lbl">Llegada Proyectada:</span>
                                            <strong className="ttg-date-val">{prediction.projectedDateFormatted}</strong>
                                        </div>
                                        <span 
                                            className="ttg-feasibility-badge"
                                            style={{ color: prediction.feasibilityColor, backgroundColor: prediction.feasibilityBg }}
                                        >
                                            {prediction.feasibilityLabel}
                                        </span>
                                    </div>

                                    {prediction.delta > 0 && (
                                        <div className="ttg-stats-bar">
                                            <span>Faltan: <strong>{prediction.delta} {prediction.unit}</strong></span>
                                            <span>Tiempo est.: <strong>~{prediction.estimatedMonths} meses ({prediction.estimatedWeeks} sem)</strong></span>
                                            <span>Ritmo: <strong>{prediction.monthlyRate} {prediction.unit}/mes</strong></span>
                                        </div>
                                    )}

                                    <p className="ttg-coaching-tip">{prediction.coachingTip}</p>
                                </div>

                                <div className="progress-section">
                                    <div className="progress-header">
                                        <span>{t('common.goals.proximity')}</span>
                                        <span>{progress}%</span>
                                    </div>
                                    <div className="progress-bar-bg">
                                        <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};
