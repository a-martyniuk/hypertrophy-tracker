import React, { useMemo } from 'react';
import { Scale, AlertTriangle, ShieldAlert, Sparkles } from 'lucide-react';
import { calculateBilateralSymmetry } from '../../utils/symmetryAudit';
import type { BodyMeasurements } from '../../types/measurements';

interface Props {
    measurements?: Partial<BodyMeasurements>;
}

export const BilateralSymmetryCard: React.FC<Props> = ({ measurements }) => {
    const symmetry = useMemo(() => {
        return calculateBilateralSymmetry(measurements);
    }, [measurements]);

    const { overallScore, overallStatus, criticalAsymmetryCount, limbs, summary } = symmetry;

    const statusBadge = {
        excellent: { label: 'Simetría de Élite', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
        good: { label: 'Balance Saludable', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)' },
        imbalanced: { label: 'Asimetrías Detectadas', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' }
    }[overallStatus];

    return (
        <div className="card glass animate-fade" style={{ padding: '1.25rem' }}>
            <div className="card-header" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(56, 189, 248, 0.05))',
                        padding: '0.45rem',
                        borderRadius: '10px',
                        border: '1px solid rgba(56, 189, 248, 0.3)',
                        color: '#38bdf8'
                    }}>
                        <Scale size={20} />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#ffffff' }}>
                            Índice de Simetría Bilateral
                        </h3>
                        <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                            Balance articular y prevención de compensaciones biomecánicas
                        </span>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    {criticalAsymmetryCount > 0 && (
                        <span className="badge" style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.4)', fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '3px' }}>
                            <AlertTriangle size={12} /> {criticalAsymmetryCount} {criticalAsymmetryCount === 1 ? 'Alerta' : 'Alertas'}
                        </span>
                    )}
                    <span className="badge" style={{ background: statusBadge.bg, color: statusBadge.color, border: `1px solid ${statusBadge.color}50`, fontSize: '0.7rem' }}>
                        {statusBadge.label} ({overallScore}%)
                    </span>
                </div>
            </div>

            {/* Limbs Symmetry Breakdown Grid */}
            {limbs.length === 0 ? (
                <div style={{
                    padding: '1.25rem',
                    textAlign: 'center',
                    background: 'rgba(0, 0, 0, 0.25)',
                    borderRadius: '10px',
                    border: '1px dashed rgba(255, 255, 255, 0.1)',
                    marginBottom: '1.25rem',
                    color: '#94a3b8',
                    fontSize: '0.8rem'
                }}>
                    <Sparkles size={20} style={{ color: '#fbbf24', margin: '0 auto 0.5rem', opacity: 0.8 }} />
                    <p style={{ margin: 0 }}>
                        Registra ambos lados (Izquierdo y Derecho) en brazos, antebrazos, muslos o gemelos para desbloquear el desglose de simetría bilateral.
                    </p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    {limbs.map((limb) => {
                    const isCritical = limb.status === 'critical_asymmetry';
                    const isMild = limb.status === 'mild_imbalance';
                    const maxVal = Math.max(limb.leftCm, limb.rightCm, 1);
                    const leftPct = (limb.leftCm / maxVal) * 100;
                    const rightPct = (limb.rightCm / maxVal) * 100;

                    return (
                        <div
                            key={limb.key}
                            style={{
                                background: isCritical ? 'rgba(239, 68, 68, 0.06)' : 'rgba(0, 0, 0, 0.3)',
                                border: `1px solid ${isCritical ? 'rgba(239, 68, 68, 0.35)' : isMild ? 'rgba(245, 158, 11, 0.25)' : 'rgba(255, 255, 255, 0.08)'}`,
                                borderRadius: '10px',
                                padding: '0.75rem'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                                <span style={{ fontWeight: 700, fontSize: '0.82rem', color: '#f8fafc' }}>
                                    {limb.name}
                                </span>
                                <span style={{
                                    fontSize: '0.7rem',
                                    fontFamily: 'var(--font-mono)',
                                    color: isCritical ? '#ef4444' : isMild ? '#fbbf24' : '#10b981',
                                    fontWeight: 700
                                }}>
                                    {limb.diffCm > 0 ? `Δ ${limb.diffCm} cm (${limb.asymmetryPercent}%)` : '✓ 100% Simétrico'}
                                </span>
                            </div>

                            {/* Left vs Right Horizontal Comparison Bar */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '0.5rem' }}>
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#94a3b8', fontFamily: 'var(--font-mono)', marginBottom: '2px' }}>
                                        <span>IZQ</span>
                                        <strong style={{ color: limb.dominantSide === 'left' ? '#38bdf8' : '#cbd5e1' }}>{limb.leftCm} cm</strong>
                                    </div>
                                    <div style={{ width: '100%', height: '5px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div style={{ width: `${leftPct}%`, height: '100%', background: limb.dominantSide === 'left' ? '#38bdf8' : '#64748b', borderRadius: '3px' }} />
                                    </div>
                                </div>

                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#94a3b8', fontFamily: 'var(--font-mono)', marginBottom: '2px' }}>
                                        <span>DER</span>
                                        <strong style={{ color: limb.dominantSide === 'right' ? '#fbbf24' : '#cbd5e1' }}>{limb.rightCm} cm</strong>
                                    </div>
                                    <div style={{ width: '100%', height: '5px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div style={{ width: `${rightPct}%`, height: '100%', background: limb.dominantSide === 'right' ? '#fbbf24' : '#64748b', borderRadius: '3px' }} />
                                    </div>
                                </div>
                            </div>

                            <p style={{ margin: 0, fontSize: '0.68rem', color: isCritical ? '#fca5a5' : '#94a3b8', lineHeight: 1.35 }}>
                                {limb.recommendation}
                            </p>
                        </div>
                    );
                })}
            </div>
            )}

            {/* Global Biomechanical Summary */}
            <div style={{
                background: criticalAsymmetryCount > 0 ? 'rgba(239, 68, 68, 0.08)' : 'rgba(56, 189, 248, 0.06)',
                border: `1px solid ${criticalAsymmetryCount > 0 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(56, 189, 248, 0.25)'}`,
                borderRadius: '10px',
                padding: '0.75rem 0.95rem',
                fontSize: '0.75rem',
                color: '#e2e8f0',
                lineHeight: 1.45,
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.6rem'
            }}>
                {criticalAsymmetryCount > 0 ? (
                    <ShieldAlert size={16} style={{ color: '#ef4444', flexShrink: 0, marginTop: '2px' }} />
                ) : (
                    <Sparkles size={16} style={{ color: '#38bdf8', flexShrink: 0, marginTop: '2px' }} />
                )}
                <div>
                    <strong style={{ color: criticalAsymmetryCount > 0 ? '#ef4444' : '#38bdf8', display: 'block', marginBottom: '2px' }}>
                        Auditoría de Salud Estructural:
                    </strong>
                    <span>{summary}</span>
                </div>
            </div>
        </div>
    );
};
