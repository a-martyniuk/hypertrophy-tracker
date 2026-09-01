import React, { useState, useEffect } from 'react';
import { Award, Lock, CheckCircle2, X, Sparkles } from 'lucide-react';
import { evaluateAthleteBadges, type AthleteBadge } from '../../utils/athleteBadges';
import type { MeasurementRecord } from '../../types/measurements';

interface Props {
    records: MeasurementRecord[];
    sex?: 'male' | 'female';
}

export const AthleteBadgesGrid: React.FC<Props> = ({ records, sex = 'male' }) => {
    const badges = evaluateAthleteBadges(records, sex);
    const [selectedBadge, setSelectedBadge] = useState<AthleteBadge | null>(null);

    useEffect(() => {
        if (!selectedBadge) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setSelectedBadge(null);
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedBadge]);

    const unlockedCount = badges.filter(b => b.isUnlocked).length;
    const totalCount = badges.length;

    return (
        <div className="card glass" style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}>
            {/* Section Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fbbf24' }}>
                        <Award size={18} />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-head)' }}>
                            Insignias & Logros Tácticos
                        </h3>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-main)' }}>
                            Hitos de desarrollo muscular, proporciones áureas y constancia.
                        </p>
                    </div>
                </div>

                <div style={{
                    padding: '0.3rem 0.75rem',
                    borderRadius: '8px',
                    background: 'rgba(245, 158, 11, 0.12)',
                    border: '1px solid rgba(245, 158, 11, 0.35)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    color: '#fbbf24',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                }}>
                    <Sparkles size={13} />
                    <span>{unlockedCount} / {totalCount} DESBLOQUEADOS</span>
                </div>
            </div>

            {/* Badges Horizontal Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                gap: '0.85rem'
            }}>
                {badges.map((badge) => {
                    const isUnlocked = badge.isUnlocked;
                    return (
                        <div
                            key={badge.id}
                            onClick={() => setSelectedBadge(badge)}
                            style={{
                                background: isUnlocked
                                    ? 'linear-gradient(135deg, rgba(26, 32, 50, 0.9), rgba(16, 20, 31, 0.95))'
                                    : 'rgba(12, 15, 24, 0.65)',
                                border: isUnlocked
                                    ? `1px solid ${badge.rarityColor}60`
                                    : '1px solid rgba(255, 255, 255, 0.06)',
                                borderRadius: '14px',
                                padding: '0.9rem',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                textAlign: 'center',
                                gap: '0.4rem',
                                cursor: 'pointer',
                                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                                boxShadow: isUnlocked ? `0 8px 20px -5px ${badge.rarityColor}25` : 'none',
                                position: 'relative',
                                opacity: isUnlocked ? 1 : 0.65
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.opacity = '1';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'none';
                                e.currentTarget.style.opacity = isUnlocked ? '1' : '0.65';
                            }}
                        >
                            {/* Icon */}
                            <div style={{
                                fontSize: '1.75rem',
                                filter: isUnlocked ? 'none' : 'grayscale(1) opacity(0.5)',
                                marginBottom: '0.15rem'
                            }}>
                                {badge.icon}
                            </div>

                            {/* Title */}
                            <div style={{
                                fontSize: '0.82rem',
                                fontWeight: 800,
                                color: isUnlocked ? '#ffffff' : '#94a3b8',
                                fontFamily: 'var(--font-head)',
                                lineHeight: 1.2
                            }}>
                                {badge.title}
                            </div>

                            {/* Progress bar or Unlocked tag */}
                            {isUnlocked ? (
                                <div style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '3px',
                                    fontSize: '0.65rem',
                                    fontWeight: 800,
                                    fontFamily: 'var(--font-mono)',
                                    color: badge.rarityColor,
                                    textTransform: 'uppercase',
                                    marginTop: '0.2rem'
                                }}>
                                    <CheckCircle2 size={11} />
                                    <span>{badge.rarity}</span>
                                </div>
                            ) : (
                                <div style={{ width: '100%', marginTop: '0.2rem' }}>
                                    <div style={{
                                        width: '100%',
                                        height: '4px',
                                        background: 'rgba(255, 255, 255, 0.08)',
                                        borderRadius: '999px',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            width: `${badge.progressPercent}%`,
                                            height: '100%',
                                            background: 'var(--primary-color)'
                                        }} />
                                    </div>
                                    <div style={{ fontSize: '0.65rem', color: '#64748b', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                                        {badge.progressPercent}%
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Badge Detail Modal */}
            {selectedBadge && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.75)',
                    backdropFilter: 'blur(8px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                    padding: 'clamp(0.5rem, 2vw, 1rem)'
                }}>
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(16, 20, 31, 0.98), rgba(9, 12, 18, 0.99))',
                        border: `1px solid ${selectedBadge.isUnlocked ? selectedBadge.rarityColor : 'rgba(255, 255, 255, 0.15)'}`,
                        borderRadius: '20px',
                        maxWidth: '440px',
                        width: '100%',
                        padding: 'clamp(1rem, 3.5vw, 1.75rem)',
                        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        gap: '1rem',
                        position: 'relative'
                    }}>
                        <button
                            onClick={() => setSelectedBadge(null)}
                            style={{
                                position: 'absolute',
                                top: '1rem',
                                right: '1rem',
                                background: 'rgba(255, 255, 255, 0.05)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '8px',
                                width: '32px',
                                height: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--text-secondary)',
                                cursor: 'pointer'
                            }}
                        >
                            <X size={16} />
                        </button>

                        <div style={{ fontSize: '3.5rem', marginTop: '0.5rem' }}>
                            {selectedBadge.icon}
                        </div>

                        <div>
                            <div style={{
                                display: 'inline-block',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                fontSize: '0.7rem',
                                fontWeight: 800,
                                fontFamily: 'var(--font-mono)',
                                color: selectedBadge.rarityColor,
                                backgroundColor: `${selectedBadge.rarityColor}20`,
                                border: `1px solid ${selectedBadge.rarityColor}40`,
                                marginBottom: '0.4rem',
                                textTransform: 'uppercase'
                            }}>
                                {selectedBadge.rarity} • {selectedBadge.category}
                            </div>
                            <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-head)' }}>
                                {selectedBadge.title}
                            </h3>
                        </div>

                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.5, fontFamily: 'var(--font-main)' }}>
                            {selectedBadge.description}
                        </p>

                        {/* Status Card */}
                        <div style={{
                            width: '100%',
                            background: 'rgba(0, 0, 0, 0.4)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '12px',
                            padding: '1rem',
                            display: 'flex',
                            justifyContent: 'space-around',
                            fontFamily: 'var(--font-mono)'
                        }}>
                            <div>
                                <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase' }}>Valor Actual</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>
                                    {selectedBadge.currentValueText}
                                </div>
                            </div>
                            <div style={{ borderLeft: '1px solid rgba(255, 255, 255, 0.08)' }} />
                            <div>
                                <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase' }}>Objetivo Requerido</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: selectedBadge.rarityColor, marginTop: '2px' }}>
                                    {selectedBadge.targetValueText}
                                </div>
                            </div>
                        </div>

                        {selectedBadge.isUnlocked ? (
                            <div style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: '12px',
                                background: 'rgba(52, 211, 153, 0.15)',
                                border: '1px solid rgba(52, 211, 153, 0.35)',
                                color: '#34d399',
                                fontWeight: 800,
                                fontSize: '0.85rem',
                                fontFamily: 'var(--font-mono)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px'
                            }}>
                                <CheckCircle2 size={16} />
                                ¡LOGRO DESBLOQUEADO!
                            </div>
                        ) : (
                            <div style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: '12px',
                                background: 'rgba(255, 255, 255, 0.04)',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                color: '#94a3b8',
                                fontWeight: 700,
                                fontSize: '0.8rem',
                                fontFamily: 'var(--font-mono)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px'
                            }}>
                                <Lock size={14} />
                                Progreso hacia el desbloqueo: {selectedBadge.progressPercent}%
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={() => setSelectedBadge(null)}
                            className="btn-primary"
                            style={{ width: '100%' }}
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
