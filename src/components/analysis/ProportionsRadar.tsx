import React from 'react';
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    Tooltip as RechartsTooltip
} from 'recharts';
import { Award, AlertCircle } from 'lucide-react';
import type { BodyMeasurements } from '../../types/measurements';
import { analyzeProportions } from '../../utils/proportions';

interface Props {
    measurements?: BodyMeasurements;
}

export const ProportionsRadar: React.FC<Props> = ({ measurements }) => {
    const analysis = analyzeProportions(measurements);

    if (!analysis || !measurements) return null;

    const { asymmetries, radarData } = analysis;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Grid with Radar Chart & Bilateral Asymmetry Audit */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
                {/* Radar Chart Card */}
                <div className="bm-card" style={{ cursor: 'default' }}>
                    <div className="bm-card-header">
                        <div>
                            <div className="bm-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Award size={16} style={{ color: '#fbbf24' }} />
                                <span>Radar de Armonía de Proporciones</span>
                            </div>
                            <div className="bm-sub">Evaluación multidimensional de equilibrio corporal</div>
                        </div>
                        <span className="bm-badge" style={{ color: '#fbbf24', background: 'rgba(245, 158, 11, 0.15)', borderColor: 'rgba(245, 158, 11, 0.4)' }}>
                            Meta = 100%
                        </span>
                    </div>

                    <div style={{ width: '100%', height: '260px', marginTop: '0.5rem' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                <PolarGrid stroke="rgba(255, 255, 255, 0.1)" strokeDasharray="3 3" />
                                <PolarAngleAxis
                                    dataKey="aspect"
                                    tick={{ fill: '#cbd5e1', fontSize: 10, fontFamily: 'monospace', fontWeight: 600 }}
                                />
                                <PolarRadiusAxis
                                    angle={30}
                                    domain={[0, 100]}
                                    tick={{ fill: '#64748b', fontSize: 8 }}
                                />
                                <Radar
                                    name="Armonía"
                                    dataKey="score"
                                    stroke="#f59e0b"
                                    strokeWidth={2}
                                    fill="#f59e0b"
                                    fillOpacity={0.35}
                                />
                                <RechartsTooltip
                                    content={({ payload }) => {
                                        if (payload && payload.length) {
                                            const data = payload[0].payload;
                                            return (
                                                <div style={{ background: '#090a0f', border: '1px solid rgba(245, 158, 11, 0.4)', padding: '0.75rem', borderRadius: '10px', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#ffffff' }}>
                                                    <div style={{ color: '#fbbf24', fontWeight: 800 }}>{data.aspect}</div>
                                                    <div style={{ color: '#e2e8f0', marginTop: '4px' }}>Actual: <strong>{data.actual}</strong></div>
                                                    <div style={{ color: '#94a3b8' }}>Ideal Clásico: <strong>{data.ideal}</strong></div>
                                                    <div style={{ color: '#34d399', fontWeight: 700, marginTop: '2px' }}>Puntaje: {data.score}%</div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Bilateral Asymmetry Audit Card */}
                <div className="bm-card" style={{ cursor: 'default' }}>
                    <div className="bm-card-header">
                        <div>
                            <div className="bm-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <AlertCircle size={16} style={{ color: '#fbbf24' }} />
                                <span>Simetría Bilateral (Izquierda vs Derecha)</span>
                            </div>
                            <div className="bm-sub">Diferencia entre lados para prevenir desbalances</div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', marginTop: '0.5rem' }}>
                        {asymmetries.map((asym) => {
                            const isNotable = asym.severity === 'notable';
                            const isMild = asym.severity === 'mild';
                            const statusLabel = isNotable ? 'Desbalance' : isMild ? 'Leve' : 'Simétrico';
                            const statusColor = isNotable ? '#f43f5e' : isMild ? '#fbbf24' : '#34d399';
                            const statusBg = isNotable ? 'rgba(244, 63, 94, 0.12)' : isMild ? 'rgba(251, 191, 36, 0.12)' : 'rgba(52, 211, 153, 0.12)';

                            return (
                                <div
                                    key={asym.group}
                                    style={{
                                        background: 'rgba(8, 10, 16, 0.65)',
                                        border: `1px solid ${statusColor}40`,
                                        borderRadius: '12px',
                                        padding: '0.75rem',
                                        fontFamily: 'var(--font-mono)'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                                        <span style={{ fontWeight: 800, color: '#ffffff', fontSize: '0.8rem' }}>{asym.label}</span>
                                        <span
                                            style={{
                                                fontSize: '0.65rem',
                                                fontWeight: 800,
                                                padding: '2px 6px',
                                                borderRadius: '6px',
                                                color: statusColor,
                                                background: statusBg,
                                                border: `1px solid ${statusColor}40`
                                            }}
                                        >
                                            {statusLabel}
                                        </span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                                        <span>L: <strong style={{ color: '#ffffff' }}>{asym.left || '-'} cm</strong></span>
                                        <span>R: <strong style={{ color: '#ffffff' }}>{asym.right || '-'} cm</strong></span>
                                    </div>
                                    <div style={{ fontSize: '0.7rem', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '0.35rem', color: '#cbd5e1' }}>
                                        Delta: <strong style={{ color: '#fbbf24' }}>{asym.diff} cm</strong>{' '}
                                        {asym.largerSide !== 'equal' && `(${asym.largerSide === 'left' ? 'Izq' : 'Der'} >)`}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};
