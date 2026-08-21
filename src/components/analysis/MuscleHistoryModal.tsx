import React from 'react';
import { X, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine } from 'recharts';
import type { MuscleBenchmark } from '../../utils/benchmarkAnalysis';
import type { MeasurementRecord } from '../../types/measurements';

interface Props {
    benchmark: MuscleBenchmark | null;
    records: MeasurementRecord[];
    onClose: () => void;
}

export const MuscleHistoryModal: React.FC<Props> = ({ benchmark, records, onClose }) => {
    if (!benchmark) return null;

    const { label, current, potentialMax, percentOfMax, referenceRanges, key } = benchmark;
    const unit = 'cm';

    // Build historical trend data in chronological order
    const sortedRecords = [...records].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const chartData = sortedRecords.map((r) => {
        const m = r.measurements as any;
        let val = 0;
        if (key === 'arm' || key === 'brazo') {
            val = Math.max(m?.arm?.left || 0, m?.arm?.right || 0);
        } else if (key === 'forearm' || key === 'antebrazo') {
            val = Math.max(m?.forearm?.left || 0, m?.forearm?.right || 0);
        } else if (key === 'thigh' || key === 'muslo') {
            val = Math.max(m?.thigh?.left || 0, m?.thigh?.right || 0);
        } else if (key === 'calf' || key === 'gemelo') {
            val = Math.max(m?.calf?.left || 0, m?.calf?.right || 0);
        } else if (key === 'neck' || key === 'cuello') {
            val = m?.neck || 0;
        } else if (key === 'pecho' || key === 'chest') {
            val = m?.pecho || 0;
        } else if (key === 'back' || key === 'espalda') {
            val = m?.back || 0;
        } else if (key === 'waist' || key === 'cintura') {
            val = m?.waist || 0;
        }

        return {
            date: new Date(r.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
            fullDate: new Date(r.date).toLocaleDateString('es-ES'),
            value: val > 0 ? val : current
        };
    });

    const firstVal = chartData[0]?.value || current;
    const latestVal = chartData[chartData.length - 1]?.value || current;
    const peakVal = Math.max(...chartData.map(d => d.value), current);
    const netChange = parseFloat((latestVal - firstVal).toFixed(1));

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
                maxWidth: '650px',
                width: '100%',
                padding: '1.75rem',
                boxShadow: '0 20px 50px rgba(0, 0, 0, 0.7), 0 0 30px rgba(245, 158, 11, 0.1)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem'
            }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0.75rem' }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary-color)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase' }}>
                            <TrendingUp size={15} />
                            <span>Histórico de Telemetría Muscular</span>
                        </div>
                        <h3 style={{ margin: '0.25rem 0 0 0', fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-head)' }}>
                            {label}
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

                {/* Key Metrics Strip */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '0.75rem',
                    fontFamily: 'var(--font-mono)'
                }}>
                    <div style={{ background: 'rgba(0, 0, 0, 0.35)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '12px', padding: '0.75rem' }}>
                        <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase' }}>Actual</div>
                        <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#ffffff', marginTop: '2px' }}>
                            {current} <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{unit}</span>
                        </div>
                    </div>

                    <div style={{ background: 'rgba(0, 0, 0, 0.35)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '12px', padding: '0.75rem' }}>
                        <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase' }}>Pico Histórico</div>
                        <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#38bdf8', marginTop: '2px' }}>
                            {peakVal} <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{unit}</span>
                        </div>
                    </div>

                    <div style={{ background: 'rgba(0, 0, 0, 0.35)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '12px', padding: '0.75rem' }}>
                        <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase' }}>Ganancia Neta</div>
                        <div style={{ fontSize: '1.35rem', fontWeight: 900, color: netChange >= 0 ? '#34d399' : '#f43f5e', marginTop: '2px' }}>
                            {netChange > 0 ? `+${netChange}` : netChange} <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{unit}</span>
                        </div>
                    </div>

                    <div style={{ background: 'rgba(0, 0, 0, 0.35)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '12px', padding: '0.75rem' }}>
                        <div style={{ fontSize: '0.65rem', color: 'var(--primary-color)', textTransform: 'uppercase' }}>% Límite Genético</div>
                        <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#fbbf24', marginTop: '2px' }}>
                            {percentOfMax}%
                        </div>
                    </div>
                </div>

                {/* Evolution Chart */}
                <div style={{ background: 'rgba(0, 0, 0, 0.4)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '14px', padding: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>
                            Curva de Progresión Temporal
                        </span>
                        <span style={{ fontSize: '0.7rem', color: '#fbbf24', fontFamily: 'var(--font-mono)' }}>
                            Techo Genético: {potentialMax} {unit}
                        </span>
                    </div>

                    <div style={{ width: '100%', height: 200 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11, fontFamily: 'var(--font-mono)' }} />
                                <YAxis domain={['dataMin - 1', 'dataMax + 1']} stroke="#64748b" tick={{ fontSize: 11, fontFamily: 'var(--font-mono)' }} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'rgba(12, 15, 24, 0.95)',
                                        borderColor: 'rgba(245, 158, 11, 0.4)',
                                        borderRadius: '10px',
                                        color: '#fff',
                                        fontFamily: 'var(--font-mono)',
                                        fontSize: '0.8rem'
                                    }}
                                    formatter={(value: any) => [`${value} ${unit}`, label]}
                                />
                                <ReferenceLine y={potentialMax} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: 'Techo', fill: '#f59e0b', fontSize: 10, position: 'right' }} />
                                <Line
                                    type="monotone"
                                    dataKey="value"
                                    stroke="#fbbf24"
                                    strokeWidth={3}
                                    dot={{ r: 5, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }}
                                    activeDot={{ r: 7, fill: '#fbbf24' }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Reference Scales */}
                <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '12px', padding: '0.75rem 1rem' }}>
                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                        Escalas de Referencia Antropométrica
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                        <div style={{ color: '#94a3b8' }}>Base: <strong>{referenceRanges.beginner[0]}-{referenceRanges.beginner[1]} {unit}</strong></div>
                        <div style={{ color: '#38bdf8' }}>Intermedio: <strong>{referenceRanges.intermediate[0]}-{referenceRanges.intermediate[1]} {unit}</strong></div>
                        <div style={{ color: '#34d399' }}>Avanzado: <strong>{referenceRanges.advanced[0]}-{referenceRanges.advanced[1]} {unit}</strong></div>
                        <div style={{ color: '#fbbf24' }}>Élite Natural: <strong>{referenceRanges.elite[0]}-{referenceRanges.elite[1]} {unit}</strong></div>
                    </div>
                </div>

                {/* Footer Button */}
                <button
                    type="button"
                    onClick={onClose}
                    className="btn-primary"
                    style={{ width: '100%' }}
                >
                    Cerrar Auditoría
                </button>
            </div>
        </div>
    );
};
