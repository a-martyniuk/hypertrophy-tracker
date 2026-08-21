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
        <div className="bm-card" style={{ cursor: 'default' }}>
            <div>
                {/* Header: Ratio Name & Status Badge */}
                <div className="bm-card-header">
                    <div>
                        <div className="bm-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Sparkles size={14} style={{ color: '#fbbf24', flexShrink: 0 }} />
                            <span>{name}</span>
                        </div>
                        <div className="bm-sub">{scaleDescription}</div>
                    </div>

                    <div
                        className="bm-badge"
                        style={{
                            color: statusColor,
                            backgroundColor: statusBg,
                            borderColor: `${statusColor}50`,
                            flexShrink: 0
                        }}
                    >
                        <span>{statusText}</span>
                    </div>
                </div>

                {/* Big Metric Display */}
                <div style={{ margin: '0.75rem 0' }}>
                    <span style={{ fontSize: '1.8rem', fontWeight: 900, color: '#fbbf24', fontFamily: 'var(--font-mono)' }}>
                        {label}
                    </span>
                </div>

                {/* Explanation */}
                <p style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: 1.45, marginBottom: '1rem' }}>
                    {explanation}
                </p>
            </div>

            {/* Reference Tiers Scale */}
            <div style={{ background: 'rgba(8, 10, 16, 0.7)', padding: '0.75rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)', fontFamily: 'var(--font-mono)' }}>
                <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 800, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Info size={11} style={{ color: '#fbbf24' }} />
                    <span>Escala de Niveles y Referencia:</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(70px, 1fr))', gap: '6px' }}>
                    {referenceTiers.map((tier, idx) => (
                        <div
                            key={idx}
                            style={{
                                padding: '6px 4px',
                                borderRadius: '8px',
                                textAlign: 'center',
                                border: tier.isCurrent ? '1px solid #fbbf24' : '1px solid rgba(255, 255, 255, 0.05)',
                                background: tier.isCurrent ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                                color: tier.isCurrent ? '#fbbf24' : '#94a3b8'
                            }}
                        >
                            <div style={{ fontSize: '0.65rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{tier.label}</div>
                            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: tier.isCurrent ? '#ffffff' : '#cbd5e1', marginTop: '2px' }}>{tier.range}</div>
                            {tier.isCurrent && (
                                <div style={{ fontSize: '0.55rem', color: '#fbbf24', fontWeight: 900, marginTop: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                                    <CheckCircle2 size={8} />
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
