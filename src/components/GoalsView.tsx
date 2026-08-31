import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Target, Plus, Trash2, TrendingUp, ChevronRight, Sparkles, Calendar, ArrowRight, Clock } from 'lucide-react';
import type { GrowthGoal, MeasurementRecord, UserProfile } from '../types/measurements';
import { calculateSkeletalPotential } from '../utils/skeletal';
import { predictGoalTimeline } from '../utils/goalPredictor';

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
        if (!profile?.baseline) return [];

        const height = (latestRecord?.measurements.height) || profile?.height || (profile?.sex === 'female' ? 165 : 178);
        const potential = calculateSkeletalPotential(
            profile.baseline.wrist,
            profile.baseline.ankle,
            height,
            profile.sex || 'male'
        );

        return [
            {
                label: t('common.goals.suggestions.chest_potential'),
                type: 'pecho',
                value: potential.chest,
                reason: t('common.goals.suggestions.reason_bone')
            },
            {
                label: t('common.goals.suggestions.arm_potential'),
                type: 'arm.right',
                value: potential.biceps,
                reason: t('common.goals.suggestions.reason_limit')
            },
            {
                label: t('common.goals.suggestions.waist_golden'),
                type: 'waist',
                value: parseFloat((potential.chest * 0.75).toFixed(1)),
                reason: t('common.goals.suggestions.reason_ratio')
            }
        ];
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

        // Simple percent towards target
        // If target > current (Bulking): 
        // 100 - ((Target - Current) / Target * 100) -> No.
        // Let's assume start was 0? No.
        // We lack "Start Value" in the goal. Simple visual deviation.
        const gap = Math.abs(goal.targetValue - current);
        const target = goal.targetValue;
        // If gap is 0, 100%. If gap is 10% of target, 90%?
        // Let's just do a Closeness metric.
        // 100% - (Gap / Target * 100)
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
            setIsAdding(false);
        } catch (error) {
            console.error("[GoalsView] Failed to add goal:", error);
            // alert("Error al guardar la meta. Revisa la consola."); // Optional: verify if alert helps
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

            {/* Smart Suggestions */}
            {suggestions.length > 0 && !isAdding && (
                <div className="suggestions-scroll">
                    {suggestions.map((s, idx) => (
                        <div key={idx} className="suggestion-card glass" onClick={() => quickAdd(s)}>
                            <div className="sug-header">
                                <Sparkles size={16} className="text-primary" />
                                <span>{t('common.goals.suggestion')}</span>
                            </div>
                            <h4>{s.label}</h4>
                            <div className="sug-val">{s.value} cm</div>
                            <p>{s.reason}</p>
                            <div className="sug-action">
                                {t('common.goals.use_goal')} <ArrowRight size={14} />
                            </div>
                        </div>
                    ))}
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
                                            {new Date(goal.targetDate).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <button className="delete-btn" onClick={() => onDeleteGoal(goal.id)}>
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
