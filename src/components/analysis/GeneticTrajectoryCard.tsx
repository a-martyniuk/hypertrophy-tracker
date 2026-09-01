import React, { useMemo } from 'react';
import { Clock, CheckCircle, Target, Flame } from 'lucide-react';
import { calculateGeneticTrajectory } from '../../utils/geneticTrajectory';
import type { BodyMeasurements } from '../../types/measurements';

interface Props {
    weight?: number;
    height?: number;
    bodyFat?: number;
    sex?: 'male' | 'female';
    age?: number;
    measurements?: Partial<BodyMeasurements>;
}

export const GeneticTrajectoryCard: React.FC<Props> = ({
    weight,
    height,
    bodyFat,
    sex = 'male',
    age = 28,
    measurements
}) => {
    const isFemale = sex === 'female';
    const effectiveWeight = weight && weight > 0 ? weight : (isFemale ? 60 : 75);
    const effectiveHeight = height && height > 0 ? height : (isFemale ? 165 : 178);
    const effectiveBf = bodyFat && bodyFat > 0 ? bodyFat : (isFemale ? 22 : 15);

    // Estimate training years based on age / baseline or default to intermediate
    const estimatedTrainingYears = age > 30 ? 4 : 2;

    const trajectory = useMemo(() => {
        return calculateGeneticTrajectory(
            effectiveWeight,
            effectiveHeight,
            effectiveBf,
            sex,
            estimatedTrainingYears,
            measurements as BodyMeasurements
        );
    }, [effectiveWeight, effectiveHeight, effectiveBf, sex, estimatedTrainingYears, measurements]);

    const {
        currentLeanMassKg,
        maxNaturalLeanMassKg,
        currentPotentialPercent,
        trainingExperienceLevel,
        monthlyGainRateKg,
        monthsToCeiling,
        milestones,
        trajectorySummary
    } = trajectory;

    const levelBadgeText = {
        beginner: 'Principiante (<1 año)',
        intermediate: 'Intermedio (1-3 años)',
        advanced: 'Avanzado (3-5 años)',
        elite: 'Cúspide Natural (>5 años)'
    }[trainingExperienceLevel];

    return (
        <div className="card glass animate-fade" style={{ padding: '1.25rem' }}>
            <div className="card-header" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(245, 158, 11, 0.05))',
                        padding: '0.45rem',
                        borderRadius: '10px',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        color: '#fbbf24'
                    }}>
                        <Clock size={20} />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#ffffff' }}>
                            Trayectoria al Techo Genético
                        </h3>
                        <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                            Modelo Casey Butt + Ritmo de Hipertrofia Helms & McDonald
                        </span>
                    </div>
                </div>
                <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)', fontSize: '0.7rem' }}>
                    {levelBadgeText}
                </span>
            </div>

            {/* Current status stats strip */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '0.75rem',
                marginBottom: '1.25rem'
            }}>
                <div style={{ background: 'rgba(0, 0, 0, 0.35)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '0.65rem 0.85rem' }}>
                    <span style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'block', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                        Potencial Actual
                    </span>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#fbbf24', fontFamily: 'var(--font-mono)' }}>
                        {currentPotentialPercent}%
                    </div>
                    <span style={{ fontSize: '0.68rem', color: '#64748b' }}>
                        {currentLeanMassKg} kg masa magra
                    </span>
                </div>

                <div style={{ background: 'rgba(0, 0, 0, 0.35)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '0.65rem 0.85rem' }}>
                    <span style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'block', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                        Límite Casey Butt
                    </span>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#22d3ee', fontFamily: 'var(--font-mono)' }}>
                        {maxNaturalLeanMassKg} kg
                    </div>
                    <span style={{ fontSize: '0.68rem', color: '#64748b' }}>
                        Techo magro al 5% BF
                    </span>
                </div>

                <div style={{ background: 'rgba(0, 0, 0, 0.35)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '0.65rem 0.85rem' }}>
                    <span style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'block', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                        Tasa de Ganancia
                    </span>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#10b981', fontFamily: 'var(--font-mono)' }}>
                        +{monthlyGainRateKg} <span style={{ fontSize: '0.75rem' }}>kg/mes</span>
                    </div>
                    <span style={{ fontSize: '0.68rem', color: '#64748b' }}>
                        Modelo Helms realista
                    </span>
                </div>

                <div style={{ background: 'rgba(0, 0, 0, 0.35)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '0.65rem 0.85rem' }}>
                    <span style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'block', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                        Tiempo al 100%
                    </span>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#c084fc', fontFamily: 'var(--font-mono)' }}>
                        {monthsToCeiling > 0 ? `~${monthsToCeiling} m` : 'Alcanzado'}
                    </div>
                    <span style={{ fontSize: '0.68rem', color: '#64748b' }}>
                        {monthsToCeiling > 0 ? `~${(monthsToCeiling / 12).toFixed(1)} años` : 'Cúspide natural'}
                    </span>
                </div>
            </div>

            {/* Milestones Progress Timeline */}
            <div style={{ marginBottom: '1.25rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1', display: 'block', marginBottom: '0.6rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>
                    Hitos de Desarrollo Muscular Proyectados
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.6rem' }}>
                    {milestones.map((m) => {
                        const isDone = m.isAchieved;
                        return (
                            <div
                                key={m.percent}
                                style={{
                                    background: isDone ? 'rgba(16, 185, 129, 0.08)' : 'rgba(0, 0, 0, 0.3)',
                                    border: `1px solid ${isDone ? 'rgba(16, 185, 129, 0.35)' : 'rgba(255, 255, 255, 0.08)'}`,
                                    borderRadius: '10px',
                                    padding: '0.65rem',
                                    position: 'relative'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                                    <span style={{ fontWeight: 800, fontSize: '0.85rem', color: isDone ? '#10b981' : '#f8fafc', fontFamily: 'var(--font-mono)' }}>
                                        {m.percent}% Potencial
                                    </span>
                                    {isDone ? (
                                        <CheckCircle size={14} style={{ color: '#10b981' }} />
                                    ) : (
                                        <Target size={14} style={{ color: '#fbbf24' }} />
                                    )}
                                </div>

                                <div style={{ fontSize: '0.75rem', color: '#cbd5e1', fontFamily: 'var(--font-mono)', marginBottom: '0.2rem' }}>
                                    <strong>{m.targetLeanMassKg} kg</strong> magros
                                </div>

                                <div style={{ fontSize: '0.68rem', color: isDone ? '#10b981' : '#94a3b8' }}>
                                    {isDone ? (
                                        '✓ Superado'
                                    ) : (
                                        <span>Faltan +{m.additionalLeanMassKg} kg (~{m.estimatedMonths} meses · {m.projectedDate})</span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Diagnostic Trajectory Advice Box */}
            <div style={{
                background: 'rgba(245, 158, 11, 0.06)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
                borderRadius: '10px',
                padding: '0.75rem 0.95rem',
                fontSize: '0.75rem',
                color: '#e2e8f0',
                lineHeight: 1.45,
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.6rem'
            }}>
                <Flame size={16} style={{ color: '#fbbf24', flexShrink: 0, marginTop: '2px' }} />
                <div>
                    <strong style={{ color: '#fbbf24', display: 'block', marginBottom: '2px' }}>
                        Diagnóstico de Trayectoria Biomecánica:
                    </strong>
                    <span>{trajectorySummary}</span>
                </div>
            </div>
        </div>
    );
};
