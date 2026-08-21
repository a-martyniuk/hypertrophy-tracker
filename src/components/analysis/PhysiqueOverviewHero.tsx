import React from 'react';
import { Activity, CheckCircle, AlertTriangle, Compass } from 'lucide-react';
import type { ComprehensiveAnalysis } from '../../utils/benchmarkAnalysis';

interface Props {
    analysis: ComprehensiveAnalysis;
}

export const PhysiqueOverviewHero: React.FC<Props> = ({ analysis }) => {
    const {
        overallLevelLabel,
        overallScore,
        ffmiScore,
        strongPoints,
        laggingPoints,
        recommendation
    } = analysis;

    return (
        <div className="physique-hero-card">
            {/* Top Row: Overall Score & FFMI */}
            <div className="physique-hero-top">
                <div className="physique-hero-title">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary-color)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        <Activity size={16} />
                        <span>Auditoría de Desarrollo Antropométrico</span>
                    </div>
                    <h2>
                        Nivel de Desarrollo: <span style={{ color: 'var(--primary-color)', fontFamily: 'var(--font-mono)' }}>{overallLevelLabel}</span>
                    </h2>
                    <p>
                        Evaluación integral comparada con los modelos antropométricos de <strong>Casey Butt</strong> (límite muscular natural por estructura ósea) y los cánones de <strong>Steve Reeves</strong>.
                    </p>
                </div>

                {/* Score Dial & FFMI */}
                <div className="physique-hero-metrics">
                    <div className="metric-block bordered">
                        <div className="metric-lbl">FFMI Normalizado</div>
                        <div className="metric-num" style={{ color: 'var(--primary-color)' }}>{ffmiScore.value}</div>
                        <div className="metric-sub" style={{ color: '#86efac' }}>{ffmiScore.statusText}</div>
                    </div>

                    <div className="metric-block">
                        <div className="metric-lbl">% Techo Genético</div>
                        <div className="metric-num">{overallScore}%</div>
                        <div className="metric-sub" style={{ color: '#94a3b8' }}>Promedio Corporal</div>
                    </div>
                </div>
            </div>

            {/* Middle Row: Strong Points vs Lagging Points */}
            <div className="physique-split-grid">
                {/* Puntos Fuertes */}
                <div className="physique-split-box strong">
                    <div className="split-box-header" style={{ color: '#86efac' }}>
                        <CheckCircle size={14} />
                        <span>Grupos Musculares Dominantes</span>
                    </div>
                    {strongPoints.length > 0 ? (
                        <div className="split-chips">
                            {strongPoints.map((sp) => (
                                <span key={sp.key} className="split-chip strong">
                                    <span>{sp.label}</span>
                                    <strong style={{ color: '#ffffff' }}>({sp.current} cm - {sp.percentOfMax}%)</strong>
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>
                            Desarrollo armónico y uniforme en todos los grupos evaluados.
                        </p>
                    )}
                </div>

                {/* Puntos Rezagados */}
                <div className="physique-split-box lagging">
                    <div className="split-box-header" style={{ color: '#fde047' }}>
                        <AlertTriangle size={14} />
                        <span>Grupos con Mayor Potencial de Crecimiento</span>
                    </div>
                    {laggingPoints.length > 0 ? (
                        <div className="split-chips">
                            {laggingPoints.map((lp) => (
                                <span key={lp.key} className="split-chip lagging">
                                    <span>{lp.label}</span>
                                    <strong style={{ color: '#ffffff' }}>({lp.current} cm - {lp.percentOfMax}%)</strong>
                                </span>
                            ))}
                        </div>
                    ) : (
                        <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>
                            Sin grupos rezagados significativos respecto al promedio general.
                        </p>
                    )}
                </div>
            </div>

            {/* Bottom Directive */}
            <div className="physique-directive">
                <Compass size={18} style={{ color: 'var(--primary-color)', flexShrink: 0, marginTop: '2px' }} />
                <div>
                    <strong style={{ color: 'var(--primary-color)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', marginRight: '6px' }}>
                        Directriz de Foco Táctico:
                    </strong>
                    <span>{recommendation}</span>
                </div>
            </div>
        </div>
    );
};
