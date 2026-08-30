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
import { Award } from 'lucide-react';
import type { BodyMeasurements } from '../../types/measurements';
import { analyzeProportions } from '../../utils/proportions';

interface Props {
    measurements?: BodyMeasurements;
    sex?: 'male' | 'female';
}

export const ProportionsRadar: React.FC<Props> = ({ measurements, sex = 'male' }) => {
    const analysis = analyzeProportions(measurements, sex);

    if (!analysis || !measurements) return null;

    const { radarData } = analysis;

    return (
        <div className="bm-card" style={{ cursor: 'default' }}>
            <div className="bm-card-header">
                <div>
                    <div className="bm-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Award size={16} style={{ color: '#fbbf24' }} />
                        <span>Radar de Armonía de Proporciones (Cánones Clásicos)</span>
                    </div>
                    <div className="bm-sub">Evaluación multidimensional de equilibrio corporal respecto al canon áureo</div>
                </div>
                <span className="bm-badge" style={{ color: '#fbbf24', background: 'rgba(245, 158, 11, 0.15)', borderColor: 'rgba(245, 158, 11, 0.4)' }}>
                    Meta = 100%
                </span>
            </div>

            <div style={{ width: '100%', height: '300px', marginTop: '0.75rem' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                        <PolarGrid stroke="rgba(255, 255, 255, 0.1)" strokeDasharray="3 3" />
                        <PolarAngleAxis
                            dataKey="aspect"
                            tick={{ fill: '#cbd5e1', fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 600 }}
                        />
                        <PolarRadiusAxis
                            angle={30}
                            domain={[0, 100]}
                            tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'var(--font-mono)' }}
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
    );
};
