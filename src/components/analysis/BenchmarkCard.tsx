import React from 'react';
import { Target, TrendingUp, Award, HelpCircle } from 'lucide-react';
import { Tooltip as AppTooltip } from '../Tooltip';
import type { MuscleBenchmark } from '../../utils/benchmarkAnalysis';

interface Props {
    benchmark: MuscleBenchmark;
    onClick?: () => void;
}

export const BenchmarkCard: React.FC<Props> = ({ benchmark, onClick }) => {
    const {
        label,
        current,
        potentialMax,
        percentOfMax,
        levelLabel,
        levelColor,
        levelBg,
        referenceRanges,
        deltaToNextLevel,
        nextLevelLabel
    } = benchmark;

    return (
        <div onClick={onClick} className="bm-card">
            {/* Top Row: Muscle Name + Level Badge */}
            <div className="bm-card-header">
                <div>
                    <div className="bm-title">{label}</div>
                    <div className="bm-sub" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>Potencial Genético: <strong style={{ color: '#e2e8f0' }}>{potentialMax} cm</strong></span>
                        <AppTooltip content="Límite biológico natural calculado matemáticamente por el modelo de Casey Butt a partir de tu altura y estructura ósea." position="top" width="250px">
                            <HelpCircle size={12} style={{ opacity: 0.6, cursor: 'help', color: 'var(--primary-color)' }} />
                        </AppTooltip>
                    </div>
                </div>

                <AppTooltip content="Nivel respecto al límite natural: Base (<70%), Intermedio (70-85%), Avanzado (85-95%), Élite Natural (>95%)." position="top" width="240px">
                    <div
                        className="bm-badge"
                        style={{
                            color: levelColor,
                            backgroundColor: levelBg,
                            borderColor: `${levelColor}50`,
                            cursor: 'help'
                        }}
                    >
                        <Award size={13} />
                        <span>{levelLabel}</span>
                    </div>
                </AppTooltip>
            </div>

            {/* Middle: Big Value + Percent */}
            <div className="bm-main-val">
                <div>
                    <span className="bm-num">{current}</span>
                    <span className="bm-unit">cm</span>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <span className="bm-pct">{percentOfMax}%</span>
                    <span className="bm-pct-sub">del techo genético</span>
                </div>
            </div>

            {/* Segmented Multi-Tier Progress Bar */}
            <div className="tier-bar-wrapper">
                <div className="tier-bar-track">
                    {/* Tier 1: Base */}
                    <div
                        className="tier-segment"
                        style={{
                            width: '25%',
                            backgroundColor: percentOfMax >= 70 ? '#64748b' : 'rgba(255, 255, 255, 0.08)'
                        }}
                    />
                    {/* Tier 2: Intermedio */}
                    <div
                        className="tier-segment"
                        style={{
                            width: '25%',
                            backgroundColor: percentOfMax >= 80 ? '#60a5fa' : 'rgba(255, 255, 255, 0.08)'
                        }}
                    />
                    {/* Tier 3: Avanzado */}
                    <div
                        className="tier-segment"
                        style={{
                            width: '25%',
                            backgroundColor: percentOfMax >= 90 ? '#34d399' : 'rgba(255, 255, 255, 0.08)'
                        }}
                    />
                    {/* Tier 4: Élite Natural */}
                    <div
                        className="tier-segment"
                        style={{
                            width: '25%',
                            backgroundColor: percentOfMax >= 98 ? '#fbbf24' : 'rgba(255, 255, 255, 0.08)'
                        }}
                    />
                </div>

                {/* Range Labels underneath */}
                <div className="tier-labels">
                    <span>Base &lt;{referenceRanges.beginner[1]}</span>
                    <span>Inter. {referenceRanges.intermediate[0]}-{referenceRanges.intermediate[1]}</span>
                    <span>Avanz. {referenceRanges.advanced[0]}-{referenceRanges.advanced[1]}</span>
                    <span style={{ color: '#fbbf24', fontWeight: 700 }}>Élite &gt;{referenceRanges.elite[0]}cm</span>
                </div>
            </div>

            {/* Bottom Next Step Delta */}
            {deltaToNextLevel && nextLevelLabel ? (
                <div className="bm-card-footer">
                    <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <TrendingUp size={13} style={{ color: '#fbbf24' }} />
                        <span>Siguiente Nivel:</span>
                    </span>
                    <span style={{ color: '#fbbf24', fontWeight: 700 }}>
                        +{deltaToNextLevel} cm para {nextLevelLabel}
                    </span>
                </div>
            ) : (
                <div className="bm-card-footer" style={{ color: '#34d399' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Target size={13} />
                        <span>Nivel Máximo:</span>
                    </span>
                    <span style={{ fontWeight: 800 }}>¡Límite Genético Natural!</span>
                </div>
            )}
        </div>
    );
};
