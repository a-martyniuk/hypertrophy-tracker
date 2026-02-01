import { useState, useMemo, useEffect } from 'react';
import { Target, Plus, Trash2, TrendingUp, ChevronRight, Sparkles, Calendar, ArrowRight } from 'lucide-react';
import type { GrowthGoal, MeasurementRecord, UserProfile } from '../types/measurements';
import { calculateSkeletalPotential } from '../utils/skeletal';

interface Props {
    goals: GrowthGoal[];
    onAddGoal: (goal: Omit<GrowthGoal, 'id' | 'createdAt'>) => Promise<void>;
    onDeleteGoal: (id: string) => Promise<void>;
    latestRecord?: MeasurementRecord;
    profile?: UserProfile | null;
    records?: MeasurementRecord[];
    onRefresh?: () => void;
}

export const GoalsView = ({ goals, onAddGoal, onDeleteGoal, latestRecord, profile, records = [], onRefresh }: Props) => {
    // Refresh data on mount to ensure we aren't seeing stale empty state
    useEffect(() => {
        if (onRefresh) onRefresh();
    }, []);

    const [isAdding, setIsAdding] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    // ... state ...

    // ... methods ...

    // Removed duplicate handleSubmit

    const [newGoal, setNewGoal] = useState({
        measurementType: 'weight',
        targetValue: 0,
        targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Default 3 months
        status: 'active' as const
    });

    // ... (rest of the code)

    // In the JSX:
    // <button type="submit" className="btn-primary" disabled={submitting}>
    //   {submitting ? 'Guardando...' : 'Guardar Objetivo'}
    // </button>

    const measurementLabels: Record<string, string> = {
        weight: 'Peso (kg)',
        bodyFat: 'Grasa (%)',
        neck: 'Cuello (cm)',
        back: 'Espalda (cm)',
        pecho: 'Pecho (cm)',
        waist: 'Cintura (cm)',
        hips: 'Caderas (cm)',
        'arm.left': 'Brazo Izq (cm)',
        'arm.right': 'Brazo Der (cm)',
        'thigh.left': 'Muslo Izq (cm)',
        'thigh.right': 'Muslo Der (cm)',
        'calf.left': 'Pantorrilla Izq (cm)',
        'calf.right': 'Pantorrilla Der (cm)',
    };

    const suggestions = useMemo(() => {
        if (!profile?.baseline) return [];

        // Calculate potential based on skeletal frame
        // Assuming height 177 if missing (avg)
        const height = (latestRecord?.measurements.height) || 177;
        const potential = calculateSkeletalPotential(
            profile.baseline.wrist,
            profile.baseline.ankle,
            height,
            profile.sex
        );

        return [
            {
                label: 'Máximo Potencial de Pecho',
                type: 'pecho',
                value: potential.chest,
                reason: 'Basado en tu estructura ósea (Casey Butt)'
            },
            {
                label: 'Máximo Potencial de Brazos',
                type: 'arm.right',
                value: potential.biceps,
                reason: 'Límite estimado para tu muñeca'
            },
            {
                label: 'Cintura Estética (Golden Ratio)',
                type: 'waist',
                value: parseFloat((potential.chest * 0.75).toFixed(1)),
                reason: 'Ratio Cintura/Pecho de 0.75 (Ideal Old School)'
            }
        ];
    }, [profile, latestRecord]);

    const getLatestValue = (type: string): number => {
        if (!latestRecord) return 0;
        const measurements = latestRecord.measurements as any;
        if (type.includes('.')) {
            const [base, side] = type.split('.');
            return measurements[base]?.[side] || 0;
        }
        return measurements[type] || 0;
    };

    const calculateTimeEstimate = (goal: GrowthGoal, current: number) => {
        // Find historical rate of change per week
        // Simply: (Current - Oldest) / weeks
        if (records.length < 2) return null;

        const type = goal.measurementType;
        const getValue = (r: MeasurementRecord) => {
            const m = r.measurements as any;
            if (type.includes('.')) {
                const [b, s] = type.split('.');
                return m[b]?.[s];
            }
            return m[type];
        };

        const oldest = records[records.length - 1];
        const oldestVal = getValue(oldest);

        if (!oldestVal) return null;

        const weeksDiff = (new Date(latestRecord!.date).getTime() - new Date(oldest.date).getTime()) / (1000 * 60 * 60 * 24 * 7);
        if (weeksDiff < 1) return null;

        const growth = current - oldestVal;
        const ratePerWeek = growth / weeksDiff;

        if (Math.abs(ratePerWeek) < 0.01) return null; // Stagnant

        const remaining = goal.targetValue - current;

        // Check if moving in right direction
        if ((remaining > 0 && ratePerWeek < 0) || (remaining < 0 && ratePerWeek > 0)) {
            return { weeks: 0, impossible: true };
        }

        const weeksToGoal = Math.abs(remaining / ratePerWeek);
        return { weeks: Math.round(weeksToGoal), rate: ratePerWeek };
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
                userId: 'default-user',
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
            measurementType: s.type,
            targetValue: s.value
        });
        setIsAdding(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="goals-view animate-fade">
            <header className="view-header glass">
                <div className="header-info">
                    <h2>Centro de Objetivos</h2>
                    <p className="subtitle">Define metas basadas en tu potencial genético</p>
                </div>
                <button className="btn-primary" onClick={() => setIsAdding(!isAdding)}>
                    <Plus size={18} /> {isAdding ? 'Cancelar' : 'Nueva Meta'}
                </button>
            </header>

            {/* Smart Suggestions */}
            {suggestions.length > 0 && !isAdding && (
                <div className="suggestions-scroll">
                    {suggestions.map((s, idx) => (
                        <div key={idx} className="suggestion-card glass" onClick={() => quickAdd(s)}>
                            <div className="sug-header">
                                <Sparkles size={16} className="text-primary" />
                                <span>Sugerencia</span>
                            </div>
                            <h4>{s.label}</h4>
                            <div className="sug-val">{s.value} cm</div>
                            <p>{s.reason}</p>
                            <div className="sug-action">
                                Usar Meta <ArrowRight size={14} />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isAdding && (
                <form className="goal-form glass animate-slide-down" onSubmit={handleSubmit}>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Métrica</label>
                            <select
                                value={newGoal.measurementType}
                                onChange={(e) => setNewGoal({ ...newGoal, measurementType: e.target.value })}
                            >
                                {Object.entries(measurementLabels).map(([key, label]) => (
                                    <option key={key} value={key}>{label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Valor Objetivo</label>
                            <input
                                type="number"
                                step="0.1"
                                value={newGoal.targetValue || ''}
                                onChange={(e) => setNewGoal({ ...newGoal, targetValue: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Fecha Límite</label>
                            <input
                                type="date"
                                value={newGoal.targetDate}
                                onChange={(e) => setNewGoal({ ...newGoal, targetDate: e.target.value })}
                            />
                        </div>
                    </div>
                    <button type="submit" className="btn-primary" disabled={submitting}>
                        {submitting ? 'Guardando...' : 'Guardar Objetivo'}
                    </button>
                </form>
            )}

            <div className="goals-grid">
                {goals.length === 0 ? (
                    <div className="empty-state glass">
                        <Target size={48} />
                        <p>No tienes metas activas. Usa las sugerencias o crea una manual.</p>
                    </div>
                ) : (
                    goals.map(goal => {
                        const progress = calculateProgress(goal);
                        const current = getLatestValue(goal.measurementType);
                        const estimate = calculateTimeEstimate(goal, current);

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
                                        <label>Actual</label>
                                        <div className="val">{current}</div>
                                    </div>
                                    <ChevronRight className="arrow" size={14} />
                                    <div className="stat">
                                        <label>Objetivo</label>
                                        <div className="val highlight">{goal.targetValue}</div>
                                    </div>
                                </div>

                                <div className="progress-section">
                                    {estimate && (
                                        <div className="estimate-tag">
                                            {estimate.impossible
                                                ? 'Tendencia opuesta ⚠️'
                                                : `Est. ${estimate.weeks} semanas al ritmo actual`}
                                        </div>
                                    )}
                                    <div className="progress-header">
                                        <span>Proximidad</span>
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

            <style>{`
                .goals-view {
                    display: flex;
                    flex-direction: column;
                    gap: 2rem;
                    max-width: 1200px;
                    margin: 0 auto;
                    width: 100%;
                }
                .view-header {
                    padding: 1.5rem;
                    border-radius: 16px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .goal-form {
                    padding: 2rem;
                    border-radius: 16px;
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }
                .form-grid {
                    display: grid;
                    grid-template-columns: repeat(3, 1fr);
                    gap: 1.5rem;
                }
                .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }
                .form-group label {
                    font-size: 0.7rem;
                    color: var(--text-secondary);
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                .form-group select, .form-group input {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    color: white;
                    padding: 0.75rem;
                    border-radius: 8px;
                    outline: none;
                }
                .form-group select option {
                    background: #1a1a1d;
                }

                .suggestions-scroll {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                    gap: 1rem;
                    margin-bottom: 0.5rem;
                }
                .suggestion-card {
                    padding: 1.25rem;
                    border-radius: 16px;
                    border: 1px dashed rgba(245, 158, 11, 0.3);
                    cursor: pointer;
                    transition: all 0.2s;
                    position: relative;
                    overflow: hidden;
                }
                .suggestion-card:hover {
                    background: rgba(245, 158, 11, 0.1);
                    border-style: solid;
                }
                .sug-header {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 0.7rem;
                    text-transform: uppercase;
                    color: var(--primary-color);
                    margin-bottom: 0.5rem;
                }
                .suggestion-card h4 {
                    font-size: 0.95rem;
                    margin-bottom: 0.25rem;
                }
                .sug-val {
                    font-size: 1.5rem;
                    font-weight: 800;
                    color: white;
                    margin-bottom: 0.5rem;
                }
                .suggestion-card p {
                    font-size: 0.75rem;
                    color: var(--text-secondary);
                    line-height: 1.4;
                    margin-bottom: 1rem;
                }
                .sug-action {
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-size: 0.8rem;
                    font-weight: bold;
                    color: var(--primary-color);
                }

                .goals-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
                    gap: 1.5rem;
                }
                .goal-card {
                    padding: 1.5rem;
                    border-radius: 20px;
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                    position: relative;
                    transition: all 0.3s ease;
                }
                .goal-card:hover {
                    border-color: #f59e0b;
                    box-shadow: 0 0 20px rgba(245, 158, 11, 0.1);
                    transform: translateY(-2px);
                }
                .goal-card-header {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }
                .icon-wrap {
                    width: 36px;
                    height: 36px;
                    border-radius: 10px;
                    background: rgba(245, 158, 11, 0.1);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #f59e0b;
                }
                .goal-title h3 {
                    font-size: 1rem;
                    margin-bottom: 2px;
                }
                .deadline {
                    font-size: 0.7rem;
                    color: var(--text-secondary);
                    opacity: 0.7;
                    display: flex;
                    align-items: center;
                }
                .delete-btn {
                    margin-left: auto;
                    color: var(--text-secondary);
                    opacity: 0.5;
                    transition: all 0.2s;
                    background: none;
                    border: none;
                    cursor: pointer;
                }
                .delete-btn:hover {
                    opacity: 1;
                    color: #ef4444;
                }

                .goal-stats {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    background: rgba(255, 255, 255, 0.02);
                    padding: 1rem;
                    border-radius: 12px;
                }
                .stat label {
                    font-size: 0.6rem;
                    color: var(--text-secondary);
                    text-transform: uppercase;
                    margin-bottom: 4px;
                    display: block;
                }
                .stat .val {
                    font-size: 1.25rem;
                    font-weight: 700;
                }
                .stat .val.highlight {
                    color: #f59e0b;
                }
                .arrow {
                    color: var(--text-secondary);
                    opacity: 0.3;
                }

                .progress-section {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }
                .estimate-tag {
                    font-size: 0.7rem;
                    color: var(--text-secondary);
                    background: rgba(255, 255, 255, 0.05);
                    padding: 2px 8px;
                    border-radius: 4px;
                    align-self: flex-start;
                    margin-bottom: 4px;
                }
                .progress-header {
                    display: flex;
                    justify-content: space-between;
                    font-size: 0.75rem;
                    color: var(--text-secondary);
                }
                .progress-bar-bg {
                    height: 8px;
                    background: rgba(255, 255, 255, 0.05);
                    border-radius: 4px;
                    overflow: hidden;
                }
                .progress-bar-fill {
                    height: 100%;
                    background: linear-gradient(90deg, #f59e0b, #fbbf24);
                    box-shadow: 0 0 10px rgba(245, 158, 11, 0.4);
                    border-radius: 4px;
                    transition: width 0.5s ease-out;
                }

                .empty-state {
                    grid-column: 1 / -1;
                    padding: 4rem;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 1rem;
                    color: var(--text-secondary);
                    text-align: center;
                    border-style: dashed;
                    border-width: 2px;
                }
                .text-primary { color: var(--primary-color); }

                @media (max-width: 768px) {
                    .goals-view {
                        padding: 0 1rem 2rem 1rem;
                    }
                    .view-header {
                        flex-direction: column;
                        align-items: stretch;
                        gap: 1rem;
                    }
                    .header-info {
                        text-align: center;
                    }
                    .goals-grid {
                        grid-template-columns: 1fr;
                    }
                    .form-grid {
                        grid-template-columns: 1fr;
                    }
                    .suggestions-scroll {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </div>
    );
};
