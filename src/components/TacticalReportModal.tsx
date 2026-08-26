import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { toPng } from 'html-to-image';
import { X, Download, Sparkles, Activity, Award, CheckCircle2, AlertCircle } from 'lucide-react';
import type { MeasurementRecord } from '../types/measurements';
import { calculateFFMI } from '../utils/skeletal';
import { analyzeProportions } from '../utils/proportions';
import { generateTacticalDiagnosis } from '../utils/tacticalDiagnosis';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    latestRecord?: MeasurementRecord;
    previousRecord?: MeasurementRecord;
    userName: string;
}

const DEMO_RECORD: MeasurementRecord = {
    id: 'demo-sample-01',
    userId: 'demo',
    date: new Date().toISOString(),
    measurements: {
        weight: 80,
        height: 180,
        bodyFat: 14,
        neck: 39,
        back: 120,
        pecho: 110,
        waist: 82,
        hips: 95,
        arm: { left: 39, right: 39 },
        forearm: { left: 31, right: 31 },
        wrist: { left: 17.5, right: 17.5 },
        thigh: { left: 60, right: 60 },
        calf: { left: 39, right: 39 },
        ankle: { left: 22, right: 22 },
    },
    metadata: {
        condition: 'fasted',
        sleepHours: 8
    }
};

export const TacticalReportModal: React.FC<Props> = ({
    isOpen,
    onClose,
    latestRecord,
    previousRecord,
    userName
}) => {
    const reportRef = useRef<HTMLDivElement>(null);
    const [downloading, setDownloading] = useState(false);
    const [downloadSuccess, setDownloadSuccess] = useState(false);
    const [downloadError, setDownloadError] = useState<string | null>(null);

    if (!isOpen) return null;

    const isDemo = !latestRecord;
    const record = latestRecord || DEMO_RECORD;
    const m = record.measurements;
    const ffmi = calculateFFMI(m.weight || 0, m.height || 0, m.bodyFat || 15);
    const proportions = analyzeProportions(m);
    const diagnosis = generateTacticalDiagnosis(record, previousRecord);
    const reportDate = new Date(record.date).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const handleDownload = async () => {
        const node = reportRef.current;
        if (!node) return;

        setDownloading(true);
        setDownloadSuccess(false);
        setDownloadError(null);

        try {
            const width = 600;
            const height = node.scrollHeight || 860;

            const dataUrl = await toPng(node, {
                quality: 0.98,
                pixelRatio: 2,
                skipFonts: true,
                cacheBust: true,
                width: width,
                height: height,
                canvasWidth: width * 2,
                canvasHeight: height * 2,
                backgroundColor: '#030305',
                style: {
                    margin: '0',
                    transform: 'none',
                    width: `${width}px`,
                    height: `${height}px`,
                    position: 'relative',
                    left: '0',
                    top: '0'
                }
            });

            const link = document.createElement('a');
            const safeName = (userName || 'atleta').toLowerCase().replace(/[^a-z0-9]/g, '_');
            link.download = `ficha_tactica_${safeName}_${new Date().toISOString().slice(0, 10)}.png`;
            link.href = dataUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setDownloadSuccess(true);
            setTimeout(() => setDownloadSuccess(false), 3000);
        } catch (err: any) {
            console.error('Error generating report image:', err);
            setDownloadError('Error al renderizar imagen. Intenta nuevamente.');
        } finally {
            setDownloading(false);
        }
    };

    const modalContent = (
        <div
            className="modal-overlay animate-fade"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="modal-dialog">
                {/* Modal Toolbar */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', background: '#0f121d', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-color)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 800 }}>
                        <Activity size={18} />
                        <span>FICHA TÁCTICA DE INTELIGENCIA CORPORAL</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button
                            onClick={handleDownload}
                            disabled={downloading}
                            className="btn-primary"
                            style={{ padding: '0.45rem 0.85rem', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}
                        >
                            {downloadSuccess ? (
                                <>
                                    <CheckCircle2 size={14} style={{ color: '#86efac' }} />
                                    <span>¡DESCARGADO!</span>
                                </>
                            ) : downloading ? (
                                <span>RENDERIZANDO HD...</span>
                            ) : (
                                <>
                                    <Download size={14} />
                                    <span>DESCARGAR IMAGEN HD</span>
                                </>
                            )}
                        </button>
                        <button
                            onClick={onClose}
                            style={{ background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.1)', color: 'var(--text-secondary)', padding: '6px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Demo Notification */}
                {isDemo && (
                    <div style={{ background: 'rgba(245, 158, 11, 0.12)', borderBottom: '1px solid rgba(245, 158, 11, 0.25)', padding: '0.6rem 1rem', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <AlertCircle size={14} style={{ flexShrink: 0 }} />
                        <span>MODO DEMOSTRACIÓN: Registra tus medidas en "Nueva Medida" para personalizar esta ficha con tu telemetría real.</span>
                    </div>
                )}

                {downloadError && (
                    <div style={{ background: 'rgba(239, 68, 68, 0.15)', borderBottom: '1px solid rgba(239, 68, 68, 0.3)', padding: '0.6rem 1rem', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: '#fb7185', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <AlertCircle size={14} style={{ flexShrink: 0 }} />
                        <span>{downloadError}</span>
                    </div>
                )}

                {/* Printable Report Canvas Container */}
                <div style={{ padding: '1.25rem', overflowX: 'auto', maxHeight: '80vh', display: 'flex', justifyContent: 'center' }}>
                    <div
                        ref={reportRef}
                        id="tactical-report-card"
                        style={{
                            width: '600px',
                            minWidth: '600px',
                            boxSizing: 'border-box',
                            backgroundColor: '#030305',
                            padding: '24px',
                            borderRadius: '16px',
                            border: '1px solid rgba(245, 158, 11, 0.4)',
                            color: '#e2e8f0',
                            fontFamily: 'monospace, system-ui, -apple-system, sans-serif',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                    >
                        {/* Tactical Background Grid Effect */}
                        <div
                            style={{
                                position: 'absolute',
                                inset: 0,
                                opacity: 0.08,
                                pointerEvents: 'none',
                                backgroundImage: `radial-gradient(#f59e0b 1px, transparent 1px)`,
                                backgroundSize: '16px 16px'
                            }}
                        />

                        {/* Report Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: '14px', marginBottom: '14px', borderBottom: '1px solid rgba(245, 158, 11, 0.3)', position: 'relative' }}>
                            <div style={{ flex: 1, minWidth: 0, paddingRight: '12px' }}>
                                <div style={{ fontSize: '10px', color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.1em', lineHeight: '1.2', marginBottom: '4px' }}>
                                    HYPERTROPHY TRACKER // AUDIT REPORT
                                </div>
                                <div style={{ fontSize: '17px', fontWeight: 800, color: '#ffffff', lineHeight: '1.3', wordBreak: 'break-word', marginBottom: '6px' }}>
                                    EXPEDIENTE: <span style={{ color: '#fbbf24' }}>{userName.toUpperCase()}</span>
                                </div>
                                <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: '1.2' }}>
                                    FECHA AUDITORÍA: {reportDate} {isDemo && '(DEMO)'}
                                </div>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                <div style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.4)', fontWeight: 700, display: 'inline-block', whiteSpace: 'nowrap' }}>
                                    {diagnosis.statusText}
                                </div>
                                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px', whiteSpace: 'nowrap' }}>
                                    ESTADO: {record.metadata?.condition || 'Entrenamiento'}
                                </div>
                            </div>
                        </div>

                        {/* Core Physiology Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '14px', textAlign: 'center', boxSizing: 'border-box' }}>
                            <div style={{ padding: '10px 6px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                                <div style={{ fontSize: '10px', color: '#94a3b8', lineHeight: '1.2' }}>PESO</div>
                                <div style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', marginTop: '4px', lineHeight: '1.2' }}>{m.weight} kg</div>
                            </div>
                            <div style={{ padding: '10px 6px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                                <div style={{ fontSize: '10px', color: '#94a3b8', lineHeight: '1.2' }}>ESTATURA</div>
                                <div style={{ fontSize: '16px', fontWeight: 800, color: '#ffffff', marginTop: '4px', lineHeight: '1.2' }}>{m.height} cm</div>
                            </div>
                            <div style={{ padding: '10px 6px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                                <div style={{ fontSize: '10px', color: '#94a3b8', lineHeight: '1.2' }}>GRASA (%BF)</div>
                                <div style={{ fontSize: '16px', fontWeight: 800, color: '#fbbf24', marginTop: '4px', lineHeight: '1.2' }}>{m.bodyFat || '-'}%</div>
                            </div>
                            <div style={{ padding: '10px 6px', borderRadius: '8px', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                                <div style={{ fontSize: '10px', color: '#94a3b8', lineHeight: '1.2' }}>FFMI NORM.</div>
                                <div style={{ fontSize: '16px', fontWeight: 800, color: '#fbbf24', marginTop: '4px', lineHeight: '1.2' }}>{ffmi?.normalizedFFMI || '-'}</div>
                            </div>
                        </div>

                        {/* Anthropometric Measurements Matrix */}
                        <div style={{ marginBottom: '14px', background: 'rgba(255, 255, 255, 0.02)', padding: '12px 14px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.06)', fontSize: '11px', boxSizing: 'border-box' }}>
                            <div style={{ color: '#fbbf24', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Activity size={13} />
                                <span>Matriz Antropométrica (cm)</span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', columnGap: '16px', rowGap: '6px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '3px' }}>
                                    <span style={{ color: '#94a3b8' }}>Pecho:</span>
                                    <span style={{ fontWeight: 700, color: '#ffffff' }}>{m.pecho || '-'}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '3px' }}>
                                    <span style={{ color: '#94a3b8' }}>Espalda:</span>
                                    <span style={{ fontWeight: 700, color: '#ffffff' }}>{m.back || '-'}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '3px' }}>
                                    <span style={{ color: '#94a3b8' }}>Cintura:</span>
                                    <span style={{ fontWeight: 700, color: '#fbbf24' }}>{m.waist || '-'}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '3px' }}>
                                    <span style={{ color: '#94a3b8' }}>Cuello:</span>
                                    <span style={{ fontWeight: 700, color: '#ffffff' }}>{m.neck || '-'}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '3px' }}>
                                    <span style={{ color: '#94a3b8' }}>Cadera:</span>
                                    <span style={{ fontWeight: 700, color: '#ffffff' }}>{m.hips || '-'}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '3px' }}>
                                    <span style={{ color: '#94a3b8' }}>V-Taper:</span>
                                    <span style={{ fontWeight: 700, color: '#fbbf24' }}>
                                        {m.waist && m.pecho ? (m.pecho / m.waist).toFixed(2) : '-'}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#94a3b8' }}>Brazo (L/R):</span>
                                    <span style={{ fontWeight: 700, color: '#ffffff' }}>{m.arm?.left || '-'}/{m.arm?.right || '-'}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#94a3b8' }}>Muslo (L/R):</span>
                                    <span style={{ fontWeight: 700, color: '#ffffff' }}>{m.thigh?.left || '-'}/{m.thigh?.right || '-'}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#94a3b8' }}>Gemelo (L/R):</span>
                                    <span style={{ fontWeight: 700, color: '#ffffff' }}>{m.calf?.left || '-'}/{m.calf?.right || '-'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Classical Proportions & Symmetry */}
                        {proportions && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px', fontSize: '11px', boxSizing: 'border-box' }}>
                                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                                    <div style={{ color: '#fbbf24', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px' }}>
                                        <Award size={12} />
                                        <span>Tríada Steve Reeves (1:1:1)</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: '#94a3b8' }}>Brazo Promedio:</span>
                                            <span style={{ fontWeight: 700, color: '#ffffff' }}>{proportions.reevesTriad.armAvg} cm</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: '#94a3b8' }}>Cuello:</span>
                                            <span style={{ fontWeight: 700, color: '#ffffff' }}>{proportions.reevesTriad.neck} cm</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: '#94a3b8' }}>Gemelo:</span>
                                            <span style={{ fontWeight: 700, color: '#ffffff' }}>{proportions.reevesTriad.calfAvg} cm</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '5px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', color: '#fbbf24', fontWeight: 700 }}>
                                            <span>Simetría Tríada:</span>
                                            <span>{proportions.reevesTriad.symmetryScore}%</span>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ background: 'rgba(255, 255, 255, 0.02)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                                    <div style={{ color: '#fbbf24', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px' }}>
                                        <Sparkles size={12} />
                                        <span>Proporción Áurea Adonis</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: '#94a3b8' }}>Ratio Pecho/Cintura:</span>
                                            <span style={{ fontWeight: 700, color: '#fbbf24' }}>{proportions.adonisIndex.chestWaistRatio}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: '#94a3b8' }}>Objetivo Áureo:</span>
                                            <span style={{ color: '#94a3b8' }}>1.618 (Φ)</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ color: '#94a3b8' }}>Cintura Ideal:</span>
                                            <span style={{ color: '#ffffff' }}>{proportions.adonisIndex.idealWaistRange[0]}-{proportions.adonisIndex.idealWaistRange[1]} cm</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '5px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', color: '#fbbf24', fontWeight: 700 }}>
                                            <span>Puntaje Escultural:</span>
                                            <span>{proportions.overallGoldenScore}%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Executive Tactical Diagnosis Briefing */}
                        <div style={{ background: 'rgba(245, 158, 11, 0.06)', padding: '12px', borderRadius: '10px', border: '1px solid rgba(245, 158, 11, 0.25)', fontSize: '11px', marginBottom: '14px', boxSizing: 'border-box' }}>
                            <div style={{ color: '#fbbf24', fontWeight: 700, textTransform: 'uppercase', marginBottom: '5px', lineHeight: '1.3' }}>
                                {diagnosis.headline}
                            </div>
                            <p style={{ color: '#cbd5e1', lineHeight: '1.4', marginBottom: '8px', fontFamily: 'system-ui, sans-serif' }}>
                                {diagnosis.summary}
                            </p>
                            <div style={{ color: '#fbbf24', paddingTop: '6px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', lineHeight: '1.3' }}>
                                <strong>Directriz:</strong> {diagnosis.actionableAdvice}
                            </div>
                        </div>

                        {/* Footer Watermark */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', fontSize: '9px', color: '#64748b', boxSizing: 'border-box' }}>
                            <span>HYPERTROPHY TRACKER // MILITARY GRADE PHYSIOLOGY</span>
                            <span>VERIFICADO POR CASEY BUTT / REEVES / KOURI</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};
