import React, { useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Activity, Shield, ArrowLeft, Sparkles, Scale, Download, TrendingUp, Calendar, Compass, List, Award } from 'lucide-react';
import { decodeAthleteData } from '../../utils/shareEncoder';
import { generateTacticalDiagnosis } from '../../utils/tacticalDiagnosis';
import { computeComprehensiveAnalysis, type MuscleBenchmark } from '../../utils/benchmarkAnalysis';
import { generateAthletePDFReport } from '../../utils/pdfReportGenerator';
import { BenchmarkCard } from '../analysis/BenchmarkCard';
import { RatioBenchmarkCard } from '../analysis/RatioBenchmarkCard';
import { ProportionsRadar } from '../analysis/ProportionsRadar';
import { MuscleHistoryModal } from '../analysis/MuscleHistoryModal';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';
import type { MeasurementRecord } from '../../types/measurements';

type TrainerTab = 'audit' | 'trends' | 'symmetry' | 'history';

export const PublicReportView: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const encodedData = searchParams.get('data');

    const [activeTab, setActiveTab] = useState<TrainerTab>('audit');
    const [selectedMuscle, setSelectedMuscle] = useState<MuscleBenchmark | null>(null);

    const athleteData = useMemo(() => {
        if (!encodedData) return null;
        return decodeAthleteData(encodedData);
    }, [encodedData]);

    const records: MeasurementRecord[] = useMemo(() => {
        if (!athleteData) return [];
        if (athleteData.records && athleteData.records.length > 0) {
            return [...athleteData.records].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        }
        return [{
            id: 'shared-record-single',
            userId: 'shared',
            date: athleteData.date,
            measurements: athleteData.measurements,
            notes: athleteData.notes
        }];
    }, [athleteData]);

    const [selectedRecordId, setSelectedRecordId] = useState<string>('');

    // Default to latest record
    const activeRecord = useMemo(() => {
        if (!records.length) return null;
        if (!selectedRecordId) return records[records.length - 1];
        return records.find(r => r.id === selectedRecordId) || records[records.length - 1];
    }, [records, selectedRecordId]);

    const diagnosis = useMemo(() => {
        if (!activeRecord) return null;
        return generateTacticalDiagnosis(activeRecord);
    }, [activeRecord]);

    const analysis = useMemo(() => {
        if (!activeRecord || !athleteData) return null;
        return computeComprehensiveAnalysis(activeRecord.measurements, athleteData.sex);
    }, [activeRecord, athleteData]);

    // Trend chart datasets
    const weightFatTrendData = useMemo(() => {
        return records.map((r) => ({
            date: new Date(r.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
            fullDate: new Date(r.date).toLocaleDateString('es-ES'),
            peso: r.measurements.weight || null,
            grasa: r.measurements.bodyFat || null
        }));
    }, [records]);

    const upperBodyTrendData = useMemo(() => {
        return records.map((r) => {
            const m = r.measurements;
            return {
                date: new Date(r.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
                brazo: Math.max(m.arm?.left || 0, m.arm?.right || 0) || null,
                pecho: m.pecho || null,
                espalda: m.back || null,
                cuello: m.neck || null
            };
        });
    }, [records]);

    const lowerTorsoTrendData = useMemo(() => {
        return records.map((r) => {
            const m = r.measurements;
            return {
                date: new Date(r.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
                cintura: m.waist || null,
                cadera: m.hips || null,
                muslo: Math.max(m.thigh?.left || 0, m.thigh?.right || 0) || null,
                gemelo: Math.max(m.calf?.left || 0, m.calf?.right || 0) || null
            };
        });
    }, [records]);

    if (!athleteData || !activeRecord) {
        return (
            <div style={{
                maxWidth: '600px',
                margin: '4rem auto',
                padding: '2rem',
                textAlign: 'center',
                background: 'rgba(16, 20, 31, 0.9)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '20px',
                color: '#f8fafc'
            }}>
                <Shield size={48} style={{ color: '#ef4444', margin: '0 auto 1rem' }} />
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-head)' }}>
                    Ficha No Encontrada o Enlace Expirado
                </h2>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                    El enlace de auditoría no contiene datos válidos de telemetría. Solicita al atleta que genere un nuevo código QR o enlace compartido.
                </p>
                <button
                    onClick={() => navigate('/')}
                    className="btn-primary"
                >
                    Ir a la App Principal
                </button>
            </div>
        );
    }

    const { name, sex } = athleteData;
    const { measurements, date } = activeRecord;

    return (
        <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '2rem 1.5rem 5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.75rem'
        }} className="animate-fade">
            {/* Top Bar for Trainer / Coach */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                paddingBottom: '1.25rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fbbf24' }}>
                        <Activity size={24} />
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: '#fbbf24', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.5px' }}>
                                MODO VISOR DE ENTRENADOR
                            </span>
                            <span style={{ fontSize: '0.65rem', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '2px 6px', borderRadius: '4px', fontFamily: 'var(--font-mono)' }}>
                                {records.length} {records.length === 1 ? 'registro' : 'registros históricos'}
                            </span>
                        </div>
                        <h1 style={{ margin: '0.15rem 0 0 0', fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-head)' }}>
                            Ficha de Atleta: {name}
                        </h1>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                    {/* Record Selector if multi-record */}
                    {records.length > 1 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(0, 0, 0, 0.35)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '10px', padding: '0.4rem 0.75rem' }}>
                            <Calendar size={15} style={{ color: '#fbbf24' }} />
                            <select
                                value={activeRecord.id}
                                onChange={(e) => setSelectedRecordId(e.target.value)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#f8fafc',
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: '0.8rem',
                                    outline: 'none',
                                    cursor: 'pointer'
                                }}
                            >
                                {records.slice().reverse().map((r, i) => (
                                    <option key={r.id} value={r.id} style={{ background: '#0f172a', color: '#fff' }}>
                                        {new Date(r.date).toLocaleDateString('es-ES')} {i === 0 ? '(Última)' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <button
                        onClick={() => generateAthletePDFReport({ latestRecord: activeRecord, userName: name, sex })}
                        className="btn-primary"
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}
                    >
                        <Download size={15} />
                        <span>Exportar PDF</span>
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="btn-secondary"
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}
                    >
                        <ArrowLeft size={15} />
                        <span>Ingresar a la App</span>
                    </button>
                </div>
            </div>

            {/* Athlete Quick Stats Strip */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                gap: '0.75rem',
                fontFamily: 'var(--font-mono)'
            }}>
                <div className="card glass" style={{ padding: '0.85rem 1rem' }}>
                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase' }}>Auditoría Activa</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fbbf24', marginTop: '2px' }}>
                        {new Date(date).toLocaleDateString('es-ES')}
                    </div>
                </div>
                <div className="card glass" style={{ padding: '0.85rem 1rem' }}>
                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase' }}>Peso Corporal</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>
                        {measurements.weight || '--'} kg
                    </div>
                </div>
                <div className="card glass" style={{ padding: '0.85rem 1rem' }}>
                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase' }}>Altura</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>
                        {measurements.height || '--'} cm
                    </div>
                </div>
                <div className="card glass" style={{ padding: '0.85rem 1rem' }}>
                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase' }}>Grasa Estimada</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>
                        {measurements.bodyFat ? `${measurements.bodyFat}%` : '--'}
                    </div>
                </div>
                <div className="card glass" style={{ padding: '0.85rem 1rem' }}>
                    <div style={{ fontSize: '0.65rem', color: 'var(--primary-color)', textTransform: 'uppercase' }}>% Techo Casey Butt</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fbbf24', marginTop: '2px' }}>
                        {analysis?.overallScore ?? '--'}%
                    </div>
                </div>
            </div>

            {/* Trainer Navigation Tabs */}
            <div style={{
                display: 'flex',
                gap: '0.5rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                paddingBottom: '0.5rem',
                overflowX: 'auto'
            }}>
                <button
                    onClick={() => setActiveTab('audit')}
                    className={`tab-btn ${activeTab === 'audit' ? 'active' : ''}`}
                    style={{
                        padding: '0.6rem 1.1rem',
                        borderRadius: '10px',
                        background: activeTab === 'audit' ? 'var(--primary-color)' : 'rgba(255, 255, 255, 0.04)',
                        color: activeTab === 'audit' ? '#000000' : '#cbd5e1',
                        fontWeight: 800,
                        fontSize: '0.82rem',
                        border: '1px solid ' + (activeTab === 'audit' ? 'var(--primary-color)' : 'rgba(255, 255, 255, 0.08)'),
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer'
                    }}
                >
                    <Scale size={15} />
                    <span>Auditoría & Benchmarks</span>
                </button>

                <button
                    onClick={() => setActiveTab('trends')}
                    className={`tab-btn ${activeTab === 'trends' ? 'active' : ''}`}
                    style={{
                        padding: '0.6rem 1.1rem',
                        borderRadius: '10px',
                        background: activeTab === 'trends' ? 'var(--primary-color)' : 'rgba(255, 255, 255, 0.04)',
                        color: activeTab === 'trends' ? '#000000' : '#cbd5e1',
                        fontWeight: 800,
                        fontSize: '0.82rem',
                        border: '1px solid ' + (activeTab === 'trends' ? 'var(--primary-color)' : 'rgba(255, 255, 255, 0.08)'),
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer'
                    }}
                >
                    <TrendingUp size={15} />
                    <span>Tendencias & Curvas ({records.length})</span>
                </button>

                <button
                    onClick={() => setActiveTab('symmetry')}
                    className={`tab-btn ${activeTab === 'symmetry' ? 'active' : ''}`}
                    style={{
                        padding: '0.6rem 1.1rem',
                        borderRadius: '10px',
                        background: activeTab === 'symmetry' ? 'var(--primary-color)' : 'rgba(255, 255, 255, 0.04)',
                        color: activeTab === 'symmetry' ? '#000000' : '#cbd5e1',
                        fontWeight: 800,
                        fontSize: '0.82rem',
                        border: '1px solid ' + (activeTab === 'symmetry' ? 'var(--primary-color)' : 'rgba(255, 255, 255, 0.08)'),
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer'
                    }}
                >
                    <Compass size={15} />
                    <span>Simetría & Radar</span>
                </button>

                <button
                    onClick={() => setActiveTab('history')}
                    className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
                    style={{
                        padding: '0.6rem 1.1rem',
                        borderRadius: '10px',
                        background: activeTab === 'history' ? 'var(--primary-color)' : 'rgba(255, 255, 255, 0.04)',
                        color: activeTab === 'history' ? '#000000' : '#cbd5e1',
                        fontWeight: 800,
                        fontSize: '0.82rem',
                        border: '1px solid ' + (activeTab === 'history' ? 'var(--primary-color)' : 'rgba(255, 255, 255, 0.08)'),
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        cursor: 'pointer'
                    }}
                >
                    <List size={15} />
                    <span>Libro de Registros ({records.length})</span>
                </button>
            </div>

            {/* TAB 1: AUDIT & BENCHMARKS */}
            {activeTab === 'audit' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                    {/* Tactical Diagnosis Box */}
                    {diagnosis && (
                        <div className="card glass" style={{
                            padding: '1.5rem',
                            border: '1px solid rgba(245, 158, 11, 0.35)',
                            background: 'linear-gradient(135deg, rgba(16, 20, 31, 0.95), rgba(9, 12, 18, 0.98))'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <div style={{ fontSize: '0.75rem', color: '#fbbf24', fontFamily: 'var(--font-mono)', fontWeight: 800, textTransform: 'uppercase' }}>
                                    DIAGNÓSTICO TÁCTICO BIOMECÁNICO
                                </div>
                                <div style={{ padding: '3px 8px', borderRadius: '6px', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', fontSize: '0.7rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                                    {diagnosis.statusText}
                                </div>
                            </div>
                            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-head)' }}>
                                {diagnosis.headline}
                            </h3>
                            <p style={{ margin: '0 0 1rem 0', fontSize: '0.88rem', color: '#cbd5e1', lineHeight: 1.55, fontFamily: 'var(--font-main)' }}>
                                {diagnosis.summary}
                            </p>

                            <div style={{
                                padding: '0.85rem 1rem',
                                borderRadius: '12px',
                                background: 'rgba(245, 158, 11, 0.08)',
                                border: '1px solid rgba(245, 158, 11, 0.25)',
                                fontSize: '0.85rem',
                                color: '#fbbf24',
                                fontFamily: 'var(--font-main)'
                            }}>
                                <strong>DIRECTRIZ SUGERIDA PARA EL ENTRENADOR:</strong> {diagnosis.actionableAdvice}
                            </div>
                        </div>
                    )}

                    {/* Benchmarks Section */}
                    {analysis && (
                        <section style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Scale size={20} style={{ color: 'var(--primary-color)' }} />
                                    <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-head)' }}>
                                        Matriz de Benchmarks Antropométricos (Casey Butt)
                                    </h3>
                                </div>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                                    💡 Haz click en cualquier músculo para ver su curva evolutiva
                                </span>
                            </div>

                            <div className="benchmarks-grid">
                                {analysis.muscleBenchmarks.map((bm) => (
                                    <div
                                        key={bm.key}
                                        onClick={() => setSelectedMuscle(bm)}
                                        style={{ cursor: 'pointer' }}
                                        title={`Ver histórico temporal de ${bm.label}`}
                                    >
                                        <BenchmarkCard benchmark={bm} />
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* Ratios Section */}
                    {analysis && (
                        <section style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Sparkles size={20} style={{ color: 'var(--primary-color)' }} />
                                <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-head)' }}>
                                    Ratios Clásicos & Cánones de Simetría
                                </h3>
                            </div>

                            <div className="ratios-grid">
                                {analysis.ratioBenchmarks.map((ratio) => (
                                    <RatioBenchmarkCard key={ratio.id} benchmark={ratio} />
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            )}

            {/* TAB 2: TRENDS & CHARTS */}
            {activeTab === 'trends' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                    {/* Weight & Body Fat Trend */}
                    <div className="card glass" style={{ padding: '1.25rem' }}>
                        <h4 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-head)' }}>
                            Evolución de Composición Corporal (Peso & Grasa)
                        </h4>
                        <div style={{ width: '100%', height: 260 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={weightFatTrendData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.06)" />
                                    <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11, fontFamily: 'var(--font-mono)' }} />
                                    <YAxis yAxisId="left" stroke="#64748b" tick={{ fontSize: 11, fontFamily: 'var(--font-mono)' }} />
                                    <YAxis yAxisId="right" orientation="right" stroke="#f59e0b" tick={{ fontSize: 11, fontFamily: 'var(--font-mono)' }} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'rgba(12, 15, 24, 0.95)',
                                            borderColor: 'rgba(245, 158, 11, 0.4)',
                                            borderRadius: '10px',
                                            color: '#fff',
                                            fontFamily: 'var(--font-mono)'
                                        }}
                                    />
                                    <Legend wrapperStyle={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }} />
                                    <Line yAxisId="left" type="monotone" dataKey="peso" name="Peso (kg)" stroke="#38bdf8" strokeWidth={2.5} dot={{ r: 4 }} />
                                    <Line yAxisId="right" type="monotone" dataKey="grasa" name="Grasa (%)" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 4 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Upper Body Trend */}
                    <div className="card glass" style={{ padding: '1.25rem' }}>
                        <h4 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-head)' }}>
                            Perímetros Musculares Superiores (cm)
                        </h4>
                        <div style={{ width: '100%', height: 260 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={upperBodyTrendData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.06)" />
                                    <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11, fontFamily: 'var(--font-mono)' }} />
                                    <YAxis stroke="#64748b" tick={{ fontSize: 11, fontFamily: 'var(--font-mono)' }} domain={['auto', 'auto']} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'rgba(12, 15, 24, 0.95)',
                                            borderColor: 'rgba(245, 158, 11, 0.4)',
                                            borderRadius: '10px',
                                            color: '#fff',
                                            fontFamily: 'var(--font-mono)'
                                        }}
                                    />
                                    <Legend wrapperStyle={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }} />
                                    <Line type="monotone" dataKey="brazo" name="Bíceps (cm)" stroke="#fbbf24" strokeWidth={2.5} dot={{ r: 4 }} />
                                    <Line type="monotone" dataKey="pecho" name="Pecho (cm)" stroke="#34d399" strokeWidth={2.5} dot={{ r: 4 }} />
                                    <Line type="monotone" dataKey="espalda" name="Espalda (cm)" stroke="#818cf8" strokeWidth={2.5} dot={{ r: 4 }} />
                                    <Line type="monotone" dataKey="cuello" name="Cuello (cm)" stroke="#f43f5e" strokeWidth={2} dot={{ r: 3 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Lower Body & Torso Trend */}
                    <div className="card glass" style={{ padding: '1.25rem' }}>
                        <h4 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-head)' }}>
                            Perímetros Inferiores & Sección Media (cm)
                        </h4>
                        <div style={{ width: '100%', height: 260 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={lowerTorsoTrendData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.06)" />
                                    <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 11, fontFamily: 'var(--font-mono)' }} />
                                    <YAxis stroke="#64748b" tick={{ fontSize: 11, fontFamily: 'var(--font-mono)' }} domain={['auto', 'auto']} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: 'rgba(12, 15, 24, 0.95)',
                                            borderColor: 'rgba(245, 158, 11, 0.4)',
                                            borderRadius: '10px',
                                            color: '#fff',
                                            fontFamily: 'var(--font-mono)'
                                        }}
                                    />
                                    <Legend wrapperStyle={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }} />
                                    <Line type="monotone" dataKey="muslo" name="Muslo (cm)" stroke="#a78bfa" strokeWidth={2.5} dot={{ r: 4 }} />
                                    <Line type="monotone" dataKey="gemelo" name="Gemelo (cm)" stroke="#2dd4bf" strokeWidth={2.5} dot={{ r: 4 }} />
                                    <Line type="monotone" dataKey="cintura" name="Cintura (cm)" stroke="#f59e0b" strokeWidth={2.5} strokeDasharray="4 4" dot={{ r: 4 }} />
                                    <Line type="monotone" dataKey="cadera" name="Cadera (cm)" stroke="#e879f9" strokeWidth={2} dot={{ r: 3 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB 3: SYMMETRY & RADAR */}
            {activeTab === 'symmetry' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Award size={20} style={{ color: 'var(--primary-color)' }} />
                        <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-head)' }}>
                            Auditoría de Simetría & Radar Multidimensional
                        </h3>
                    </div>
                    <ProportionsRadar measurements={measurements} />
                </div>
            )}

            {/* TAB 4: HISTORY LOGS */}
            {activeTab === 'history' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h4 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-head)' }}>
                        Libro de Registros Históricos ({records.length} entradas)
                    </h4>
                    <div className="card glass" style={{ padding: '0.5rem', overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', color: '#94a3b8', textTransform: 'uppercase', fontSize: '0.7rem' }}>
                                    <th style={{ padding: '0.75rem' }}>Fecha</th>
                                    <th style={{ padding: '0.75rem' }}>Peso</th>
                                    <th style={{ padding: '0.75rem' }}>% Grasa</th>
                                    <th style={{ padding: '0.75rem' }}>Bíceps (I/D)</th>
                                    <th style={{ padding: '0.75rem' }}>Pecho</th>
                                    <th style={{ padding: '0.75rem' }}>Espalda</th>
                                    <th style={{ padding: '0.75rem' }}>Cintura</th>
                                    <th style={{ padding: '0.75rem' }}>Muslo (I/D)</th>
                                    <th style={{ padding: '0.75rem' }}>Gemelo (I/D)</th>
                                    <th style={{ padding: '0.75rem' }}>Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {records.slice().reverse().map((r) => {
                                    const m = r.measurements;
                                    const isSelected = r.id === activeRecord.id;
                                    return (
                                        <tr
                                            key={r.id}
                                            style={{
                                                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                                                background: isSelected ? 'rgba(245, 158, 11, 0.1)' : 'transparent',
                                                color: isSelected ? '#fbbf24' : '#f8fafc'
                                            }}
                                        >
                                            <td style={{ padding: '0.75rem', fontWeight: 800 }}>
                                                {new Date(r.date).toLocaleDateString('es-ES')}
                                            </td>
                                            <td style={{ padding: '0.75rem' }}>{m.weight} kg</td>
                                            <td style={{ padding: '0.75rem' }}>{m.bodyFat ? `${m.bodyFat}%` : '--'}</td>
                                            <td style={{ padding: '0.75rem' }}>{m.arm?.left ?? '--'} / {m.arm?.right ?? '--'} cm</td>
                                            <td style={{ padding: '0.75rem' }}>{m.pecho || '--'} cm</td>
                                            <td style={{ padding: '0.75rem' }}>{m.back || '--'} cm</td>
                                            <td style={{ padding: '0.75rem' }}>{m.waist || '--'} cm</td>
                                            <td style={{ padding: '0.75rem' }}>{m.thigh?.left ?? '--'} / {m.thigh?.right ?? '--'} cm</td>
                                            <td style={{ padding: '0.75rem' }}>{m.calf?.left ?? '--'} / {m.calf?.right ?? '--'} cm</td>
                                            <td style={{ padding: '0.75rem' }}>
                                                <button
                                                    onClick={() => {
                                                        setSelectedRecordId(r.id);
                                                        setActiveTab('audit');
                                                    }}
                                                    className="btn-secondary"
                                                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.7rem' }}
                                                >
                                                    Auditar
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Individual Muscle History Modal */}
            {selectedMuscle && (
                <MuscleHistoryModal
                    benchmark={selectedMuscle}
                    records={records}
                    onClose={() => setSelectedMuscle(null)}
                />
            )}
        </div>
    );
};
