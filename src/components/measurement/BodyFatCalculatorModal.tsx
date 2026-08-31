import React, { useState, useEffect } from 'react';
import { X, Calculator, Check, AlertCircle, ShieldCheck } from 'lucide-react';
import { calculateUSNavyBodyFat, type BodyFatCalculationInput } from '../../utils/bodyFatEstimator';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onApply: (bodyFat: number) => void;
    sex?: 'male' | 'female';
    initialHeight?: number;
    initialNeck?: number;
    initialWaist?: number;
    initialHips?: number;
    initialWeight?: number;
}

export const BodyFatCalculatorModal: React.FC<Props> = ({
    isOpen,
    onClose,
    onApply,
    sex = 'male',
    initialHeight,
    initialNeck,
    initialWaist,
    initialHips,
    initialWeight
}) => {
    const defaultHeight = initialHeight || (sex === 'female' ? 165 : 178);
    const defaultNeck = initialNeck || (sex === 'female' ? 33 : 39);
    const defaultWaist = initialWaist || (sex === 'female' ? 72 : 84);
    const defaultHips = initialHips || 95;
    const defaultWeight = initialWeight || (sex === 'female' ? 60 : 78);

    const [height, setHeight] = useState<number>(defaultHeight);
    const [neck, setNeck] = useState<number>(defaultNeck);
    const [waist, setWaist] = useState<number>(defaultWaist);
    const [hips, setHips] = useState<number>(defaultHips);
    const [weight, setWeight] = useState<number>(defaultWeight);

    useEffect(() => {
        setHeight(initialHeight || (sex === 'female' ? 165 : 178));
        setNeck(initialNeck || (sex === 'female' ? 33 : 39));
        setWaist(initialWaist || (sex === 'female' ? 72 : 84));
        setHips(initialHips || 95);
        setWeight(initialWeight || (sex === 'female' ? 60 : 78));
    }, [initialHeight, initialNeck, initialWaist, initialHips, initialWeight, sex, isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const inputData: BodyFatCalculationInput = {
        sex,
        heightCm: height,
        neckCm: neck,
        waistCm: waist,
        hipsCm: sex === 'female' ? hips : undefined
    };

    const result = calculateUSNavyBodyFat(inputData, weight);

    const handleApply = () => {
        if (result.isValid) {
            onApply(result.bodyFatPercent);
            onClose();
        }
    };

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem'
        }}>
            <div style={{
                background: 'linear-gradient(135deg, rgba(16, 20, 31, 0.98), rgba(9, 12, 18, 0.99))',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '20px',
                maxWidth: '520px',
                width: '100%',
                padding: '1.75rem',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(245, 158, 11, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem'
            }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--primary-color)' }}>
                        <Calculator size={22} />
                        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-head)' }}>
                            Estimador de Grasa Corporal
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
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
                </div>

                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45, fontFamily: 'var(--font-main)' }}>
                    Cálculo basado en la ecuación oficial del <strong>Departamento de Defensa de EE.UU. (U.S. Navy Method)</strong> utilizando perímetros de contorno óseo y adiposo.
                </p>

                {/* Live Inputs Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                    <div style={{ background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '0.6rem 0.8rem' }}>
                        <label style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '0.2rem' }}>
                            Altura (cm)
                        </label>
                        <input
                            type="number"
                            value={height || ''}
                            onChange={(e) => setHeight(parseFloat(e.target.value) || 0)}
                            style={{ width: '100%', background: 'transparent', border: 'none', color: '#ffffff', fontSize: '1.1rem', fontWeight: 800, outline: 'none' }}
                        />
                    </div>

                    <div style={{ background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '0.6rem 0.8rem' }}>
                        <label style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '0.2rem' }}>
                            Peso (kg)
                        </label>
                        <input
                            type="number"
                            value={weight || ''}
                            onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
                            style={{ width: '100%', background: 'transparent', border: 'none', color: '#ffffff', fontSize: '1.1rem', fontWeight: 800, outline: 'none' }}
                        />
                    </div>

                    <div style={{ background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '10px', padding: '0.6rem 0.8rem' }}>
                        <label style={{ fontSize: '0.65rem', color: 'var(--primary-color)', textTransform: 'uppercase', display: 'block', marginBottom: '0.2rem' }}>
                            Cuello (cm)
                        </label>
                        <input
                            type="number"
                            step="0.5"
                            value={neck || ''}
                            onChange={(e) => setNeck(parseFloat(e.target.value) || 0)}
                            style={{ width: '100%', background: 'transparent', border: 'none', color: '#fbbf24', fontSize: '1.1rem', fontWeight: 800, outline: 'none' }}
                        />
                    </div>

                    <div style={{ background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '10px', padding: '0.6rem 0.8rem' }}>
                        <label style={{ fontSize: '0.65rem', color: 'var(--primary-color)', textTransform: 'uppercase', display: 'block', marginBottom: '0.2rem' }}>
                            Cintura (cm)
                        </label>
                        <input
                            type="number"
                            step="0.5"
                            value={waist || ''}
                            onChange={(e) => setWaist(parseFloat(e.target.value) || 0)}
                            style={{ width: '100%', background: 'transparent', border: 'none', color: '#fbbf24', fontSize: '1.1rem', fontWeight: 800, outline: 'none' }}
                        />
                    </div>

                    {sex === 'female' && (
                        <div style={{ gridColumn: 'span 2', background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '10px', padding: '0.6rem 0.8rem' }}>
                            <label style={{ fontSize: '0.65rem', color: 'var(--primary-color)', textTransform: 'uppercase', display: 'block', marginBottom: '0.2rem' }}>
                                Cadera (cm) - Requerido para mujeres
                            </label>
                            <input
                                type="number"
                                step="0.5"
                                value={hips || ''}
                                onChange={(e) => setHips(parseFloat(e.target.value) || 0)}
                                style={{ width: '100%', background: 'transparent', border: 'none', color: '#fbbf24', fontSize: '1.1rem', fontWeight: 800, outline: 'none' }}
                            />
                        </div>
                    )}
                </div>

                {/* Calculation Result Card */}
                {result.isValid ? (
                    <div style={{
                        background: 'rgba(0, 0, 0, 0.45)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '14px',
                        padding: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}>
                        <div>
                            <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                                % Grasa Corporal Estimada
                            </div>
                            <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#fbbf24', fontFamily: 'var(--font-mono)', lineHeight: 1.1 }}>
                                {result.bodyFatPercent}%
                            </div>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '4px', padding: '2px 8px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 700, fontFamily: 'var(--font-mono)', backgroundColor: `${result.categoryColor}20`, color: result.categoryColor, border: `1px solid ${result.categoryColor}40` }}>
                                <ShieldCheck size={12} />
                                <span>{result.category}</span>
                            </div>
                        </div>

                        {result.leanMassKg !== undefined && (
                            <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                                <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase' }}>Masa Magra</div>
                                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>{result.leanMassKg} kg</div>
                                <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '2px' }}>Grasa: {result.fatMassKg} kg</div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        borderRadius: '12px',
                        padding: '0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.6rem',
                        color: '#fca5a5',
                        fontSize: '0.8rem'
                    }}>
                        <AlertCircle size={18} />
                        <span>Faltan campos para calcular: <strong>{result.missingFields.join(', ')}</strong></span>
                    </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
                    <button
                        type="button"
                        onClick={onClose}
                        className="btn-secondary"
                        style={{ flex: 1 }}
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={handleApply}
                        disabled={!result.isValid}
                        className="btn-primary"
                        style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', opacity: result.isValid ? 1 : 0.5 }}
                    >
                        <Check size={18} />
                        Aplicar {result.isValid ? `${result.bodyFatPercent}%` : ''} al Formulario
                    </button>
                </div>
            </div>
        </div>
    );
};
