import React, { useMemo } from 'react';
import { Compass, Flame, ArrowUpRight, ArrowDownRight, RefreshCw, CheckCircle2, ShieldCheck } from 'lucide-react';
import { calculatePhaseRecommendation } from '../../utils/phaseAdvisor';

interface Props {
    weight?: number;
    height?: number;
    bodyFat?: number;
    sex?: 'male' | 'female';
    age?: number;
    ffmi?: number;
}

export const PhaseAdvisorCard: React.FC<Props> = ({
    weight,
    height,
    bodyFat,
    sex = 'male',
    age = 28,
    ffmi
}) => {
    const isFemale = sex === 'female';
    const effectiveWeight = weight && weight > 0 ? weight : (isFemale ? 60 : 75);
    const effectiveHeight = height && height > 0 ? height : (isFemale ? 165 : 178);
    const effectiveBf = bodyFat && bodyFat > 0 ? bodyFat : (isFemale ? 22 : 15);

    const recommendation = useMemo(() => {
        return calculatePhaseRecommendation(effectiveWeight, effectiveHeight, effectiveBf, sex, age, ffmi);
    }, [effectiveWeight, effectiveHeight, effectiveBf, sex, age, ffmi]);

    const {
        phaseTitle,
        phaseSubtitle,
        badgeColor,
        recommendedCaloricDelta,
        targetCalories,
        tdee,
        targetBodyFatRange,
        estimatedDurationWeeks,
        proteinGramsPerKg,
        proteinGramsTotal,
        carbsGramsTotal,
        fatsGramsTotal,
        rationale,
        keyDirectives
    } = recommendation;

    const badgeStyle = {
        red: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)', border: 'rgba(239, 68, 68, 0.35)', icon: ArrowDownRight },
        green: { color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)', border: 'rgba(16, 185, 129, 0.35)', icon: ArrowUpRight },
        blue: { color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.15)', border: 'rgba(56, 189, 248, 0.35)', icon: RefreshCw },
        amber: { color: '#fbbf24', bg: 'rgba(245, 158, 11, 0.15)', border: 'rgba(245, 158, 11, 0.35)', icon: Flame }
    }[badgeColor];

    const Icon = badgeStyle.icon;

    return (
        <div className="card glass animate-fade" style={{ padding: '1.25rem' }}>
            <div className="card-header" style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(245, 158, 11, 0.05))',
                        padding: '0.45rem',
                        borderRadius: '10px',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        color: '#fbbf24'
                    }}>
                        <Compass size={20} />
                    </div>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#ffffff' }}>
                            Brújula Metabólica Táctica
                        </h3>
                        <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: 'var(--font-mono)' }}>
                            Asesor algorítmico: ¿Volumen, Definición o Recomposición?
                        </span>
                    </div>
                </div>

                <span className="badge" style={{
                    background: badgeStyle.bg,
                    color: badgeStyle.color,
                    border: `1px solid ${badgeStyle.border}`,
                    fontSize: '0.75rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '0.35rem 0.65rem'
                }}>
                    <Icon size={14} />
                    <strong>{phaseTitle}</strong>
                </span>
            </div>

            <p style={{ fontSize: '0.8rem', color: '#cbd5e1', marginBottom: '1rem', lineHeight: 1.4 }}>
                {phaseSubtitle}
            </p>

            {/* Calories and Macro Targets Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))',
                gap: '0.75rem',
                marginBottom: '1.25rem'
            }}>
                <div style={{ background: 'rgba(0, 0, 0, 0.35)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '0.65rem 0.85rem' }}>
                    <span style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'block', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                        Calorías Meta
                    </span>
                    <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#fbbf24', fontFamily: 'var(--font-mono)' }}>
                        {targetCalories} <span style={{ fontSize: '0.75rem' }}>kcal</span>
                    </div>
                    <span style={{ fontSize: '0.68rem', color: badgeStyle.color, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                        {recommendedCaloricDelta >= 0 ? `+${recommendedCaloricDelta}` : recommendedCaloricDelta} kcal vs TDEE ({tdee})
                    </span>
                </div>

                <div style={{ background: 'rgba(0, 0, 0, 0.35)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '0.65rem 0.85rem' }}>
                    <span style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'block', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                        Proteína Diaria
                    </span>
                    <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                        {proteinGramsTotal} <span style={{ fontSize: '0.75rem' }}>g</span>
                    </div>
                    <span style={{ fontSize: '0.68rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                        {proteinGramsPerKg} g/kg peso corporal
                    </span>
                </div>

                <div style={{ background: 'rgba(0, 0, 0, 0.35)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '0.65rem 0.85rem' }}>
                    <span style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'block', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                        Carbos & Grasas
                    </span>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>
                        {carbsGramsTotal}g <span style={{ fontSize: '0.75rem', color: '#64748b' }}>C</span> · {fatsGramsTotal}g <span style={{ fontSize: '0.75rem', color: '#64748b' }}>G</span>
                    </div>
                    <span style={{ fontSize: '0.68rem', color: '#64748b' }}>
                        Distribución óptima
                    </span>
                </div>

                <div style={{ background: 'rgba(0, 0, 0, 0.35)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '10px', padding: '0.65rem 0.85rem' }}>
                    <span style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'block', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                        Meta de Grasa
                    </span>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#10b981', fontFamily: 'var(--font-mono)' }}>
                        {targetBodyFatRange}
                    </div>
                    <span style={{ fontSize: '0.68rem', color: '#64748b' }}>
                        Duración: ~{estimatedDurationWeeks} semanas
                    </span>
                </div>
            </div>

            {/* Directives Checklist */}
            <div style={{
                background: 'rgba(0, 0, 0, 0.25)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                borderRadius: '10px',
                padding: '0.85rem',
                marginBottom: '1rem'
            }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#cbd5e1', display: 'block', marginBottom: '0.5rem', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>
                    Directivas Tácticas de la Fase
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                    {keyDirectives.map((d, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '0.75rem', color: '#e2e8f0', lineHeight: 1.35 }}>
                            <CheckCircle2 size={13} style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
                            <span>{d}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Rationale explanation */}
            <div style={{
                background: badgeStyle.bg,
                border: `1px solid ${badgeStyle.border}`,
                borderRadius: '10px',
                padding: '0.75rem 0.95rem',
                fontSize: '0.75rem',
                color: '#e2e8f0',
                lineHeight: 1.45,
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.6rem'
            }}>
                <ShieldCheck size={16} style={{ color: badgeStyle.color, flexShrink: 0, marginTop: '2px' }} />
                <div>
                    <strong style={{ color: badgeStyle.color, display: 'block', marginBottom: '2px' }}>
                        Fundamento Fisiológico:
                    </strong>
                    <span>{rationale}</span>
                </div>
            </div>
        </div>
    );
};
