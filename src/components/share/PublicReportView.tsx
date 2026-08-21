import React, { useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Activity, Shield, ArrowLeft, Sparkles, Scale, Download } from 'lucide-react';
import { decodeAthleteData } from '../../utils/shareEncoder';
import { generateTacticalDiagnosis } from '../../utils/tacticalDiagnosis';
import { computeComprehensiveAnalysis } from '../../utils/benchmarkAnalysis';
import { generateAthletePDFReport } from '../../utils/pdfReportGenerator';
import { BenchmarkCard } from '../analysis/BenchmarkCard';
import { RatioBenchmarkCard } from '../analysis/RatioBenchmarkCard';
import type { MeasurementRecord } from '../../types/measurements';

export const PublicReportView: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const encodedData = searchParams.get('data');

    const athleteData = useMemo(() => {
        if (!encodedData) return null;
        return decodeAthleteData(encodedData);
    }, [encodedData]);

    if (!athleteData) {
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

    const { name, sex, date, measurements } = athleteData;
    const dummyRecord: MeasurementRecord = {
        id: 'shared-record',
        userId: 'shared',
        date,
        measurements
    };

    const diagnosis = generateTacticalDiagnosis(dummyRecord);
    const analysis = computeComprehensiveAnalysis(measurements, sex);

    return (
        <div style={{
            maxWidth: '1100px',
            margin: '0 auto',
            padding: '2rem 1.5rem 4rem',
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
                gap: '0.75rem',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                paddingBottom: '1rem'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fbbf24' }}>
                        <Activity size={22} />
                    </div>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: '#fbbf24', textTransform: 'uppercase', fontWeight: 800 }}>
                                MODO VISOR DE ENTRENADOR
                            </span>
                        </div>
                        <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-head)' }}>
                            Ficha de Atleta: {name}
                        </h1>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <button
                        onClick={() => generateAthletePDFReport({ latestRecord: dummyRecord, userName: name, sex })}
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
                gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                gap: '0.75rem',
                fontFamily: 'var(--font-mono)'
            }}>
                <div className="card glass" style={{ padding: '0.85rem 1rem' }}>
                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase' }}>Fecha Registro</div>
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
                    <div style={{ fontSize: '0.65rem', color: 'var(--primary-color)', textTransform: 'uppercase' }}>% Límite Casey Butt</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fbbf24', marginTop: '2px' }}>
                        {analysis?.overallScore ?? '--'}%
                    </div>
                </div>
            </div>

            {/* Tactical Diagnosis Box */}
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
                    <strong>DIRECTRIZ SUGERIDA:</strong> {diagnosis.actionableAdvice}
                </div>
            </div>

            {/* Benchmarks Section */}
            {analysis && (
                <section style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Scale size={20} style={{ color: 'var(--primary-color)' }} />
                        <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-head)' }}>
                            Matriz de Benchmarks Antropométricos
                        </h3>
                    </div>

                    <div className="benchmarks-grid">
                        {analysis.muscleBenchmarks.map((bm) => (
                            <BenchmarkCard key={bm.key} benchmark={bm} />
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
                            Ratios Clásicos & Proporciones
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
    );
};
