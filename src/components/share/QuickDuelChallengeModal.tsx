import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Swords, X, Flame } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { MeasurementRecord } from '../../types/measurements';
import { compareAthletes, type ComparisonProfile } from '../../utils/athleteComparison';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    targetRecord: MeasurementRecord;
    targetName: string;
    targetSex?: 'male' | 'female';
}

export const QuickDuelChallengeModal: React.FC<Props> = ({
    isOpen,
    onClose,
    targetRecord,
    targetName,
    targetSex = 'male'
}) => {
    const navigate = useNavigate();

    // 4 quick inputs
    const [height, setHeight] = useState<number>(178);
    const [weight, setWeight] = useState<number>(75);
    const [arm, setArm] = useState<number>(38.5);
    const [waist, setWaist] = useState<number>(82);
    const [challengerName, setChallengerName] = useState<string>('Tú (Retador)');
    const [calculated, setCalculated] = useState(false);

    const targetProfile: ComparisonProfile = useMemo(() => {
        const tm = targetRecord.measurements;
        return {
            id: 'target_athlete',
            name: targetName,
            title: targetName,
            category: 'community',
            sex: targetSex,
            height: tm.height || 180,
            weight: tm.weight || 80,
            bodyFat: tm.bodyFat || 15,
            measurements: tm
        };
    }, [targetRecord, targetName, targetSex]);

    const challengerProfile: ComparisonProfile = useMemo(() => {
        return {
            id: 'challenger_quick',
            name: challengerName || 'Tú (Retador)',
            title: 'Retador Directo',
            category: 'golden',
            sex: 'male',
            height: Number(height) || 178,
            weight: Number(weight) || 75,
            bodyFat: 15,
            measurements: {
                height: Number(height) || 178,
                weight: Number(weight) || 75,
                arm: { left: Number(arm) || 38, right: Number(arm) || 38 },
                waist: Number(waist) || 82,
                pecho: (Number(waist) || 82) * 1.35, // Estimation
                back: (Number(waist) || 82) * 1.35,
                thigh: { left: (Number(height) || 178) * 0.33, right: (Number(height) || 178) * 0.33 },
                calf: { left: (Number(arm) || 38) * 0.95, right: (Number(arm) || 38) * 0.95 }
            }
        };
    }, [height, weight, arm, waist, challengerName]);

    const verdict = useMemo(() => {
        if (!calculated) return null;
        return compareAthletes(challengerProfile, targetProfile);
    }, [calculated, challengerProfile, targetProfile]);

    if (!isOpen) return null;

    return createPortal(
        <div
            onClick={onClose}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                backgroundColor: 'rgba(3, 7, 18, 0.88)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 99999,
                padding: '1rem',
                boxSizing: 'border-box',
                overflowY: 'auto'
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: '#0c101d',
                    border: '1.5px solid rgba(245, 158, 11, 0.35)',
                    borderRadius: '20px',
                    padding: '1.5rem',
                    maxWidth: '500px',
                    width: '100%',
                    maxHeight: '94vh',
                    overflowY: 'auto',
                    margin: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.2rem',
                    boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)'
                }}
            >
                {/* Modal Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                            <Swords size={18} style={{ color: '#fbbf24' }} />
                            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 900, color: '#fff', fontFamily: 'var(--font-head)' }}>
                                Reto Inverso Directo (1 vs 1)
                            </h3>
                        </div>
                        <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                            ¿Crees que puedes vencer a <strong style={{ color: '#fbbf24' }}>{targetName}</strong>? Ingresa 4 medidas.
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {!calculated ? (
                    /* Step 1: 4 Quick Inputs */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '4px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                                Tu Nombre o Apodo
                            </label>
                            <input
                                type="text"
                                value={challengerName}
                                onChange={(e) => setChallengerName(e.target.value)}
                                className="settings-input"
                                placeholder="Ej: Leo / IronTitan"
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '4px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                                    Estatura (cm)
                                </label>
                                <input
                                    type="number"
                                    value={height}
                                    onChange={(e) => setHeight(Number(e.target.value))}
                                    className="settings-input"
                                    min="120"
                                    max="240"
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '4px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                                    Peso (kg)
                                </label>
                                <input
                                    type="number"
                                    value={weight}
                                    onChange={(e) => setWeight(Number(e.target.value))}
                                    className="settings-input"
                                    step="0.5"
                                    min="35"
                                    max="200"
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '4px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                                    Brazo Flexionado (cm)
                                </label>
                                <input
                                    type="number"
                                    value={arm}
                                    onChange={(e) => setArm(Number(e.target.value))}
                                    className="settings-input"
                                    step="0.5"
                                    min="20"
                                    max="65"
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1', marginBottom: '4px', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                                    Cintura (cm)
                                </label>
                                <input
                                    type="number"
                                    value={waist}
                                    onChange={(e) => setWaist(Number(e.target.value))}
                                    className="settings-input"
                                    step="0.5"
                                    min="50"
                                    max="160"
                                />
                            </div>
                        </div>

                        <button
                            onClick={() => setCalculated(true)}
                            className="btn-primary"
                            style={{ padding: '0.85rem', fontSize: '0.9rem', fontWeight: 900, marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                        >
                            <Swords size={18} />
                            <span>¡Lanzar Duelo Head-to-Head! &rarr;</span>
                        </button>
                    </div>
                ) : (
                    /* Step 2: Instant Battle Result */
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} className="animate-fade">
                        {/* Score Banner */}
                        <div style={{
                            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(34, 211, 238, 0.15) 100%)',
                            border: '1px solid rgba(245, 158, 11, 0.4)',
                            borderRadius: '16px',
                            padding: '1rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-around',
                            textAlign: 'center'
                        }}>
                            <div>
                                <span style={{ fontSize: '0.75rem', color: '#22d3ee', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>
                                    {challengerName}
                                </span>
                                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#22d3ee', fontFamily: 'var(--font-mono)' }}>
                                    {verdict?.verdict.scoreA || 80}
                                </div>
                                <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>PUNTOS HUD</span>
                            </div>

                            <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#fbbf24' }}>
                                VS
                            </div>

                            <div>
                                <span style={{ fontSize: '0.75rem', color: '#fbbf24', fontWeight: 700, textTransform: 'uppercase', display: 'block' }}>
                                    {targetName}
                                </span>
                                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fbbf24', fontFamily: 'var(--font-mono)' }}>
                                    {verdict?.verdict.scoreB || 90}
                                </div>
                                <span style={{ fontSize: '0.65rem', color: '#94a3b8' }}>PUNTOS HUD</span>
                            </div>
                        </div>

                        {/* Tactical Verdict Summary */}
                        <div style={{
                            background: 'rgba(0, 0, 0, 0.35)',
                            border: '1px solid rgba(255, 255, 255, 0.08)',
                            borderRadius: '12px',
                            padding: '0.85rem',
                            fontSize: '0.78rem',
                            color: '#cbd5e1',
                            lineHeight: 1.4
                        }}>
                            <strong style={{ color: '#fff', display: 'block', marginBottom: '4px' }}>
                                🏆 Dictamen de Combate:
                            </strong>
                            <p style={{ margin: 0 }}>
                                {verdict?.verdict.summary || 'Duelo equilibrado con ventajas repartidas en volumen perimétrico y proporciones áureas.'}
                            </p>
                        </div>

                        {/* Action CTAs */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <button
                                onClick={() => navigate('/')}
                                className="btn-primary"
                                style={{ padding: '0.85rem', fontSize: '0.88rem', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                            >
                                <Flame size={16} />
                                <span>Guardar mi Ficha & Crear Cuenta Gratis &rarr;</span>
                            </button>

                            <button
                                onClick={() => setCalculated(false)}
                                className="btn-secondary"
                                style={{ padding: '0.65rem', fontSize: '0.8rem' }}
                            >
                                ↺ Recalcular con otras medidas
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};
