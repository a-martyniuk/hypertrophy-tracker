import { useState } from 'react';
import { Target, Plus, Trash2, TrendingUp, ChevronRight } from 'lucide-react';
import type { GrowthGoal, MeasurementRecord } from '../types/measurements';

interface Props {
    goals: GrowthGoal[];
    onAddGoal: (goal: Omit<GrowthGoal, 'id' | 'createdAt'>) => void;
    onDeleteGoal: (id: string) => void;
    latestRecord?: MeasurementRecord;
}

export const GoalsView = ({ goals, onAddGoal, onDeleteGoal, latestRecord }: Props) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newGoal, setNewGoal] = useState({
        measurementType: 'weight',
        targetValue: 0,
        targetDate: new Date().toISOString().split('T')[0],
        status: 'active' as const
    });

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

    const getLatestValue = (type: string): number => {
        if (!latestRecord) return 0;
        const measurements = latestRecord.measurements as any;
        if (type.includes('.')) {
            const [base, side] = type.split('.');
            return measurements[base]?.[side] || 0;
        }
        return measurements[type] || 0;
    };

    const calculateProgress = (goal: GrowthGoal) => {
        const current = getLatestValue(goal.measurementType);
        if (current === 0) return 0;

        // Handle both fat loss (target < current) and mass gain (target > current)
        // This is a simplified progress calculation

        // For now, let's just do current/target ratio if target > current, etc.
        if (goal.targetValue > current) {
            return Math.min(Math.round((current / goal.targetValue) * 100), 100);
        } else if (goal.targetValue < current) {
            // For fat loss/waist reduction
            return Math.min(Math.round((goal.targetValue / current) * 100), 100);
        }
        return 100;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAddGoal({
            userId: 'default-user',
            ...newGoal
        });
        setIsAdding(false);
    };

    return (
        <div className="goals-view animate-fade">
            <header className="view-header glass">
                <div className="header-info">
                    <h2>Centro de Objetivos</h2>
                    <p className="subtitle">Configura tus metas y monitorea el progreso en tiempo real</p>
                </div>
                <button className="btn-primary" onClick={() => setIsAdding(!isAdding)}>
                    <Plus size={18} /> {isAdding ? 'Cancelar' : 'Nueva Meta'}
                </button>
            </header>

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
                    <button type="submit" className="btn-primary">Guardar Objetivo</button>
                </form>
            )}

            <div className="goals-grid">
                {goals.length === 0 ? (
                    <div className="empty-state glass">
                        <Target size={48} />
                        <p>No tienes metas activas. ¡Define una para empezar!</p>
                    </div>
                ) : (
                    goals.map(goal => {
                        const progress = calculateProgress(goal);
                        const current = getLatestValue(goal.measurementType);

                        return (
                            <div key={goal.id} className="goal-card glass">
                                <div className="goal-card-header">
                                    <div className="icon-wrap">
                                        <TrendingUp size={18} />
                                    </div>
                                    <div className="goal-title">
                                        <h3>{measurementLabels[goal.measurementType] || goal.measurementType}</h3>
                                        <span className="deadline">Meta: {goal.targetDate}</span>
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
                                    <div className="progress-header">
                                        <span>Progreso</span>
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

                .goals-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
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
            `}</style>
        </div>
    );
};
