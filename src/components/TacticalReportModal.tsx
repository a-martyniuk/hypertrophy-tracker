import React, { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { X, Download, Sparkles, Activity, Award, CheckCircle2 } from 'lucide-react';
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

    if (!isOpen || !latestRecord) return null;

    const m = latestRecord.measurements;
    const ffmi = calculateFFMI(m.weight || 0, m.height || 0, m.bodyFat || 15);
    const proportions = analyzeProportions(m);
    const diagnosis = generateTacticalDiagnosis(latestRecord, previousRecord);
    const reportDate = new Date(latestRecord.date).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    const handleDownload = async () => {
        if (!reportRef.current) return;
        setDownloading(true);
        setDownloadSuccess(false);

        try {
            const dataUrl = await toPng(reportRef.current, {
                quality: 0.98,
                pixelRatio: 2, // High resolution export
                backgroundColor: '#030305'
            });

            const link = document.createElement('a');
            link.download = `ficha_tactica_${userName.toLowerCase().replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.png`;
            link.href = dataUrl;
            link.click();

            setDownloadSuccess(true);
            setTimeout(() => setDownloadSuccess(false), 3000);
        } catch (err) {
            console.error('Error generating report image:', err);
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
            <div className="relative w-full max-w-2xl my-8 bg-neutral-950 border border-amber-500/30 rounded-xl shadow-2xl overflow-hidden">
                {/* Modal Toolbar */}
                <div className="flex items-center justify-between p-4 bg-neutral-900/90 border-b border-neutral-800">
                    <div className="flex items-center gap-2 text-amber-400 font-mono text-sm font-bold">
                        <Activity size={18} />
                        <span>FICHA TÁCTICA DE INTELIGENCIA CORPORAL</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleDownload}
                            disabled={downloading}
                            className="btn-primary !py-1.5 !px-3 !text-xs flex items-center gap-1.5 font-mono"
                        >
                            {downloadSuccess ? (
                                <>
                                    <CheckCircle2 size={14} className="text-green-300" />
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
                            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Printable Report Canvas */}
                <div className="p-6 overflow-x-auto">
                    <div
                        ref={reportRef}
                        id="tactical-report-card"
                        className="w-[580px] mx-auto bg-[#030305] p-6 rounded-lg border border-amber-500/40 text-neutral-200 font-sans relative overflow-hidden"
                        style={{ minHeight: '750px' }}
                    >
                        {/* Tactical Background Grid Effect */}
                        <div
                            className="absolute inset-0 opacity-10 pointer-events-none"
                            style={{
                                backgroundImage: `radial-gradient(#f59e0b 1px, transparent 1px)`,
                                backgroundSize: '16px 16px'
                            }}
                        />

                        {/* Report Header */}
                        <div className="flex justify-between items-start pb-4 mb-4 border-b border-amber-500/30 relative">
                            <div>
                                <div className="text-[10px] font-mono text-amber-400 uppercase tracking-widest">
                                    HYPERTROPHY TRACKER PRO // AUDIT REPORT
                                </div>
                                <h2 className="text-xl font-bold text-white font-mono mt-0.5">
                                    EXPEDIENTE: <span className="text-amber-400">{userName.toUpperCase()}</span>
                                </h2>
                                <div className="text-xs text-neutral-400 font-mono mt-0.5">
                                    FECHA AUDITORÍA: {reportDate}
                                </div>
                            </div>
                            <div className="text-right font-mono">
                                <div className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold inline-block">
                                    {diagnosis.statusText}
                                </div>
                                <div className="text-[11px] text-neutral-400 mt-1">
                                    ESTADO: {latestRecord.metadata?.condition || 'Entrenamiento'}
                                </div>
                            </div>
                        </div>

                        {/* Core Physiology Grid */}
                        <div className="grid grid-cols-4 gap-2 mb-4 font-mono text-center">
                            <div className="p-2.5 rounded bg-neutral-900/80 border border-neutral-800">
                                <div className="text-[10px] text-neutral-400">PESO</div>
                                <div className="text-base font-bold text-white mt-0.5">{m.weight} kg</div>
                            </div>
                            <div className="p-2.5 rounded bg-neutral-900/80 border border-neutral-800">
                                <div className="text-[10px] text-neutral-400">ESTATURA</div>
                                <div className="text-base font-bold text-white mt-0.5">{m.height} cm</div>
                            </div>
                            <div className="p-2.5 rounded bg-neutral-900/80 border border-neutral-800">
                                <div className="text-[10px] text-neutral-400">GRASA (%BF)</div>
                                <div className="text-base font-bold text-amber-300 mt-0.5">{m.bodyFat || '-'}%</div>
                            </div>
                            <div className="p-2.5 rounded bg-neutral-900/80 border border-neutral-800">
                                <div className="text-[10px] text-neutral-400">FFMI NORM.</div>
                                <div className="text-base font-bold text-amber-400 mt-0.5">{ffmi?.normalizedFFMI || '-'}</div>
                            </div>
                        </div>

                        {/* Anthropometric Measurements Matrix */}
                        <div className="mb-4 bg-neutral-900/50 p-3 rounded border border-neutral-800 font-mono text-xs">
                            <div className="text-amber-400 font-bold text-[11px] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <Activity size={13} />
                                <span>Matriz Antropométrica (cm)</span>
                            </div>
                            <div className="grid grid-cols-3 gap-y-2 gap-x-4">
                                <div className="flex justify-between border-b border-neutral-800 pb-1">
                                    <span className="text-neutral-400">Pecho:</span>
                                    <span className="font-bold text-white">{m.pecho || '-'}</span>
                                </div>
                                <div className="flex justify-between border-b border-neutral-800 pb-1">
                                    <span className="text-neutral-400">Espalda:</span>
                                    <span className="font-bold text-white">{m.back || '-'}</span>
                                </div>
                                <div className="flex justify-between border-b border-neutral-800 pb-1">
                                    <span className="text-neutral-400">Cintura:</span>
                                    <span className="font-bold text-amber-300">{m.waist || '-'}</span>
                                </div>
                                <div className="flex justify-between border-b border-neutral-800 pb-1">
                                    <span className="text-neutral-400">Cuello:</span>
                                    <span className="font-bold text-white">{m.neck || '-'}</span>
                                </div>
                                <div className="flex justify-between border-b border-neutral-800 pb-1">
                                    <span className="text-neutral-400">Cadera:</span>
                                    <span className="font-bold text-white">{m.hips || '-'}</span>
                                </div>
                                <div className="flex justify-between border-b border-neutral-800 pb-1">
                                    <span className="text-neutral-400">V-Taper:</span>
                                    <span className="font-bold text-amber-400">
                                        {m.waist && m.pecho ? (m.pecho / m.waist).toFixed(2) : '-'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-neutral-400">Brazo (L/R):</span>
                                    <span className="font-bold text-white">{m.arm?.left || '-'}/{m.arm?.right || '-'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-neutral-400">Muslo (L/R):</span>
                                    <span className="font-bold text-white">{m.thigh?.left || '-'}/{m.thigh?.right || '-'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-neutral-400">Gemelo (L/R):</span>
                                    <span className="font-bold text-white">{m.calf?.left || '-'}/{m.calf?.right || '-'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Classical Proportions & Symmetry */}
                        {proportions && (
                            <div className="grid grid-cols-2 gap-3 mb-4 font-mono text-xs">
                                <div className="bg-neutral-900/60 p-3 rounded border border-neutral-800">
                                    <div className="text-amber-400 font-bold text-[10px] uppercase mb-1.5 flex items-center gap-1">
                                        <Award size={12} />
                                        <span>Tríada Steve Reeves (1:1:1)</span>
                                    </div>
                                    <div className="space-y-1 text-[11px]">
                                        <div className="flex justify-between">
                                            <span className="text-neutral-400">Brazo Promedio:</span>
                                            <span className="text-white font-bold">{proportions.reevesTriad.armAvg} cm</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-neutral-400">Cuello:</span>
                                            <span className="text-white font-bold">{proportions.reevesTriad.neck} cm</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-neutral-400">Gemelo:</span>
                                            <span className="text-white font-bold">{proportions.reevesTriad.calfAvg} cm</span>
                                        </div>
                                        <div className="flex justify-between pt-1 border-t border-neutral-800 text-amber-300 font-bold">
                                            <span>Simetría Tríada:</span>
                                            <span>{proportions.reevesTriad.symmetryScore}%</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-neutral-900/60 p-3 rounded border border-neutral-800">
                                    <div className="text-amber-400 font-bold text-[10px] uppercase mb-1.5 flex items-center gap-1">
                                        <Sparkles size={12} />
                                        <span>Proporción Áurea Adonis</span>
                                    </div>
                                    <div className="space-y-1 text-[11px]">
                                        <div className="flex justify-between">
                                            <span className="text-neutral-400">Ratio Pecho/Cintura:</span>
                                            <span className="text-amber-300 font-bold">{proportions.adonisIndex.chestWaistRatio}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-neutral-400">Objetivo Áureo:</span>
                                            <span className="text-neutral-400">1.618 (Φ)</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-neutral-400">Cintura Ideal:</span>
                                            <span className="text-neutral-300">{proportions.adonisIndex.idealWaistRange[0]}-{proportions.adonisIndex.idealWaistRange[1]} cm</span>
                                        </div>
                                        <div className="flex justify-between pt-1 border-t border-neutral-800 text-amber-300 font-bold">
                                            <span>Puntaje Escultural:</span>
                                            <span>{proportions.overallGoldenScore}%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Executive Tactical Diagnosis Briefing */}
                        <div className="bg-neutral-900/70 p-3 rounded border border-amber-500/30 font-mono text-xs mb-4">
                            <div className="text-amber-400 font-bold text-[11px] uppercase mb-1">
                                {diagnosis.headline}
                            </div>
                            <p className="text-neutral-300 text-[11px] leading-relaxed mb-2 font-sans">
                                {diagnosis.summary}
                            </p>
                            <div className="text-[11px] text-amber-300/90 pt-1.5 border-t border-neutral-800 font-mono">
                                <strong>Directriz:</strong> {diagnosis.actionableAdvice}
                            </div>
                        </div>

                        {/* Footer Watermark */}
                        <div className="flex justify-between items-center pt-2 border-t border-neutral-800 text-[9px] font-mono text-neutral-500">
                            <span>HYPERTROPHY TRACKER PRO // MILITARY GRADE PHYSIOLOGY</span>
                            <span>VERIFICADO POR ALGORITMOS CASEY BUTT / REEVES / KOURI</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
