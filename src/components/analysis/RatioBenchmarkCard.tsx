import React from 'react';
import { Sparkles, Info, CheckCircle2 } from 'lucide-react';
import type { RatioBenchmark } from '../../utils/benchmarkAnalysis';

interface Props {
    benchmark: RatioBenchmark;
}

export const RatioBenchmarkCard: React.FC<Props> = ({ benchmark }) => {
    const {
        name,
        label,
        scaleDescription,
        statusText,
        statusColor,
        statusBg,
        explanation,
        referenceTiers
    } = benchmark;

    return (
        <div className="bm-card ratio-benchmark-card" style={{ cursor: 'default', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
            <div>
                {/* Header: Ratio Name & Status Badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.85rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Sparkles size={16} style={{ color: '#fbbf24', flexShrink: 0 }} />
                            <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-head)', letterSpacing: '-0.01em', lineHeight: 1.3 }}>
                                {name}
                            </h4>
                        </div>
                        <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginTop: '0.3rem' }}>
                            {scaleDescription}
                        </div>
                    </div>

                    <div
                        style={{
                            color: statusColor,
                            backgroundColor: statusBg,
                            borderColor: `${statusColor}60`,
                            border: '1px solid',
                            borderRadius: '8px',
                            padding: '0.35rem 0.65rem',
                            fontSize: '0.72rem',
                            fontFamily: 'var(--font-mono)',
                            fontWeight: 800,
                            letterSpacing: '0.02em',
                            boxShadow: `0 0 14px ${statusColor}15`,
                            whiteSpace: 'nowrap',
                            alignSelf: 'flex-start'
                        }}
                    >
                        {statusText}
                    </div>
                </div>

                {/* Big Metric Display */}
                <div style={{ margin: '0.85rem 0 0.65rem 0', display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                    <span style={{ fontSize: '2.1rem', fontWeight: 900, color: '#fbbf24', fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                        {label}
                    </span>
                </div>

                {/* Explanation */}
                <p style={{ fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.5, margin: '0.5rem 0 1.25rem 0' }}>
                    {explanation}
                </p>
            </div>

            {/* Reference Tiers Scale */}
            <div style={{ background: 'rgba(8, 10, 16, 0.75)', padding: '0.85rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.06)', fontFamily: 'var(--font-mono)' }}>
                <div style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 800, marginBottom: '0.65rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Info size={12} style={{ color: '#fbbf24' }} />
                    <span>Escala de Niveles y Referencia:</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${referenceTiers.length}, minmax(0, 1fr))`, gap: '6px' }}>
                    {referenceTiers.map((tier, idx) => (
                        <div
                            key={idx}
                            style={{
                                padding: '8px 4px',
                                borderRadius: '8px',
                                textAlign: 'center',
                                border: tier.isCurrent ? '1.5px solid #fbbf24' : '1px solid rgba(255, 255, 255, 0.05)',
                                background: tier.isCurrent ? 'rgba(245, 158, 11, 0.18)' : 'rgba(255, 255, 255, 0.02)',
                                color: tier.isCurrent ? '#fbbf24' : '#94a3b8',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                minHeight: '62px'
                            }}
                        >
                            <div style={{ fontSize: '0.68rem', fontWeight: tier.isCurrent ? 700 : 500, lineHeight: 1.2, color: tier.isCurrent ? '#ffffff' : '#94a3b8', wordBreak: 'break-word' }}>
                                {tier.label}
                            </div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: tier.isCurrent ? '#fbbf24' : '#cbd5e1', marginTop: '4px' }}>
                                {tier.range}
                            </div>
                            {tier.isCurrent && (
                                <div style={{ fontSize: '0.58rem', color: '#fbbf24', fontWeight: 900, marginTop: '3px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                                    <CheckCircle2 size={9} />
                                    <span>TU VALOR</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
