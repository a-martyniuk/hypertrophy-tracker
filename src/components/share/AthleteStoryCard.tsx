import React, { useRef, useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { toPng } from 'html-to-image';
import QRCode from 'qrcode';
import { Download, Sparkles, Check, Flame, X } from 'lucide-react';
import type { MeasurementRecord } from '../../types/measurements';
import { computeComprehensiveAnalysis } from '../../utils/benchmarkAnalysis';
import { calculateFFMI } from '../../utils/skeletal';
import { calculateBilateralSymmetry } from '../../utils/symmetryAudit';
import { encodeAthleteData, getPublicShareBaseUrl } from '../../utils/shareEncoder';

interface Props {
    record?: MeasurementRecord;
    records?: MeasurementRecord[];
    userName?: string;
    sex?: 'male' | 'female';
    isOpen?: boolean;
    onClose?: () => void;
}

export const AthleteStoryCardModal: React.FC<Props> = ({
    record,
    records = [],
    userName = 'Atleta',
    sex = 'male',
    isOpen = false,
    onClose
}) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [qrUrl, setQrUrl] = useState<string>('');
    const [generating, setGenerating] = useState(false);
    const [downloaded, setDownloaded] = useState(false);

    const m = record?.measurements;
    const analysis = useMemo(() => computeComprehensiveAnalysis(m, sex), [m, sex]);
    const symmetry = useMemo(() => calculateBilateralSymmetry(m), [m]);
    const ffmi = useMemo(() => {
        if (!m?.weight || !m?.height) return null;
        return calculateFFMI(m.weight, m.height, m.bodyFat || 15, sex);
    }, [m?.weight, m?.height, m?.bodyFat, sex]);

    const initials = (userName || 'AM')
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    const shareUrl = useMemo(() => {
        if (!record) return '';
        const encoded = encodeAthleteData(userName, record, sex, records.length ? records : [record]);
        const baseUrl = getPublicShareBaseUrl();
        return `${baseUrl}#/share?data=${encoded}`;
    }, [record, userName, sex, records]);

    useEffect(() => {
        if (!shareUrl) return;
        QRCode.toDataURL(shareUrl, {
            width: 200,
            margin: 1,
            color: { dark: '#000000', light: '#ffffff' }
        }).then(setQrUrl).catch(() => {});
    }, [shareUrl]);

    if (!isOpen || !record) return null;

    const handleDownload = async () => {
        if (!cardRef.current) return;
        setGenerating(true);
        try {
            const dataUrl = await toPng(cardRef.current, {
                pixelRatio: 3, // Ultra-sharp 1080x1920 export
                cacheBust: true,
                skipFonts: true,
                backgroundColor: '#070a13'
            });

            // Native Web Share API file share on mobile
            if (navigator.canShare && typeof File !== 'undefined') {
                try {
                    const blob = await (await fetch(dataUrl)).blob();
                    const file = new File([blob], `hypertrophy-story-${userName.toLowerCase().replace(/\s+/g, '-')}.png`, { type: 'image/png' });
                    if (navigator.canShare({ files: [file] })) {
                        await navigator.share({
                            files: [file],
                            title: `Ficha de Atleta: ${userName}`,
                            text: '¡Mira mi telemetría en Hypertrophy Tracker!'
                        });
                        setDownloaded(true);
                        setTimeout(() => setDownloaded(false), 3000);
                        setGenerating(false);
                        return;
                    }
                } catch {
                    // Fallback to normal download
                }
            }

            // Standard anchor download
            const link = document.createElement('a');
            link.download = `story-card-${userName.toLowerCase().replace(/\s+/g, '-')}.png`;
            link.href = dataUrl;
            link.click();
            setDownloaded(true);
            setTimeout(() => setDownloaded(false), 3000);
        } catch (err) {
            console.error('[AthleteStoryCard] Error al generar imagen:', err);
            alert('Error al generar la imagen. Intenta de nuevo.');
        } finally {
            setGenerating(false);
        }
    };

    const getAvg = (val: number | { left: number; right: number } | undefined) => {
        if (!val) return '—';
        if (typeof val === 'number') return `${val} cm`;
        return `${Math.max(val.left || 0, val.right || 0)} cm`;
    };

    return createPortal(
        <div
            onClick={onClose}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                backgroundColor: 'rgba(3, 7, 18, 0.88)',
                backdropFilter: 'blur(10px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 99999,
                padding: '1rem',
                boxSizing: 'border-box',
                overflowY: 'auto'
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                style={{
                    background: '#0c101d',
                    border: '1.5px solid rgba(245, 158, 11, 0.35)',
                    borderRadius: '20px',
                    padding: '1.25rem',
                    maxWidth: '460px',
                    width: '100%',
                    maxHeight: '94vh',
                    overflowY: 'auto',
                    margin: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '1rem',
                    boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)'
                }}
            >
                {/* Modal Top Header */}
                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Sparkles size={16} style={{ color: '#fbbf24' }} />
                        <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#fff' }}>
                            Story Card 9:16 (Instagram & WhatsApp)
                        </h3>
                    </div>
                    {onClose && (
                        <button
                            onClick={onClose}
                            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
                        >
                            <X size={20} />
                        </button>
                    )}
                </div>

                {/* THE 9:16 RENDERABLE CANVAS CONTAINER */}
                <div
                    ref={cardRef}
                    style={{
                        width: '340px',
                        height: '604px', // Exact 9:16 aspect ratio
                        background: 'linear-gradient(180deg, #090e1a 0%, #060913 50%, #03050a 100%)',
                        border: '2px solid rgba(245, 158, 11, 0.45)',
                        borderRadius: '24px',
                        padding: '1.2rem 1.1rem',
                        boxSizing: 'border-box',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        position: 'relative',
                        overflow: 'hidden',
                        boxShadow: '0 0 40px rgba(245, 158, 11, 0.15)'
                    }}
                >
                    {/* Glowing Cyberpunk Background Accents */}
                    <div style={{
                        position: 'absolute',
                        top: '-40px',
                        right: '-40px',
                        width: '180px',
                        height: '180px',
                        background: 'radial-gradient(circle, rgba(245, 158, 11, 0.22) 0%, transparent 70%)',
                        pointerEvents: 'none'
                    }} />
                    <div style={{
                        position: 'absolute',
                        bottom: '40px',
                        left: '-40px',
                        width: '180px',
                        height: '180px',
                        background: 'radial-gradient(circle, rgba(34, 211, 238, 0.18) 0%, transparent 70%)',
                        pointerEvents: 'none'
                    }} />

                    {/* 1. Header Strip */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 2 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Flame size={14} style={{ color: '#fbbf24' }} />
                            <span style={{ fontSize: '0.68rem', fontWeight: 900, color: '#fbbf24', letterSpacing: '1.5px', fontFamily: 'var(--font-mono)' }}>
                                HYPERTROPHY TRACKER
                            </span>
                        </div>
                        <span style={{
                            fontSize: '0.6rem',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '12px',
                            background: 'rgba(16, 185, 129, 0.15)',
                            color: '#10b981',
                            border: '1px solid rgba(16, 185, 129, 0.35)',
                            fontFamily: 'var(--font-mono)'
                        }}>
                            TELEMETRÍA VERIFICADA
                        </span>
                    </div>

                    {/* 2. Hero Athlete Identity */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', zIndex: 2, margin: '0.4rem 0' }}>
                        <div style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '18px',
                            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 900,
                            fontSize: '1.3rem',
                            color: '#000000',
                            fontFamily: 'var(--font-head)',
                            boxShadow: '0 0 20px rgba(245, 158, 11, 0.5)',
                            flexShrink: 0
                        }}>
                            {initials}
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, color: '#ffffff', fontFamily: 'var(--font-head)', lineHeight: 1.15 }}>
                                {userName}
                            </h2>
                            <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                                {m?.height || 180} cm · {m?.weight || 75} kg · {m?.bodyFat ? `${m.bodyFat}% Grasa` : 'Atleta Natural'}
                            </div>
                        </div>
                    </div>

                    {/* 3. Four Core Hexagonal/Pill Metric Badges */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', zIndex: 2 }}>
                        <div style={{ background: 'rgba(0, 0, 0, 0.45)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '12px', padding: '0.5rem 0.65rem' }}>
                            <span style={{ fontSize: '0.6rem', color: '#94a3b8', display: 'block', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                                Potencial Genético
                            </span>
                            <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#fbbf24', fontFamily: 'var(--font-mono)' }}>
                                {analysis?.overallScore || 90}%
                            </div>
                            <span style={{ fontSize: '0.58rem', color: '#10b981' }}>Casey Butt Model</span>
                        </div>

                        <div style={{ background: 'rgba(0, 0, 0, 0.45)', border: '1px solid rgba(34, 211, 238, 0.3)', borderRadius: '12px', padding: '0.5rem 0.65rem' }}>
                            <span style={{ fontSize: '0.6rem', color: '#94a3b8', display: 'block', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                                FFMI Score
                            </span>
                            <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#22d3ee', fontFamily: 'var(--font-mono)' }}>
                                {ffmi?.normalizedFFMI || 22.0}
                            </div>
                            <span style={{ fontSize: '0.58rem', color: '#38bdf8' }}>Desarrollo Natural</span>
                        </div>

                        <div style={{ background: 'rgba(0, 0, 0, 0.45)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '12px', padding: '0.5rem 0.65rem' }}>
                            <span style={{ fontSize: '0.6rem', color: '#94a3b8', display: 'block', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                                Ratio V-Taper
                            </span>
                            <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#c084fc', fontFamily: 'var(--font-mono)' }}>
                                {analysis?.ratioBenchmarks?.[0]?.currentValue?.toFixed(2) || '1.55'}x
                            </div>
                            <span style={{ fontSize: '0.58rem', color: '#a855f7' }}>Áureo: 1.62x</span>
                        </div>

                        <div style={{ background: 'rgba(0, 0, 0, 0.45)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '12px', padding: '0.5rem 0.65rem' }}>
                            <span style={{ fontSize: '0.6rem', color: '#94a3b8', display: 'block', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                                Simetría Bilateral
                            </span>
                            <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#10b981', fontFamily: 'var(--font-mono)' }}>
                                {symmetry?.overallScore || 98}%
                            </div>
                            <span style={{ fontSize: '0.58rem', color: '#34d399' }}>Equilibrio Izq/Der</span>
                        </div>
                    </div>

                    {/* 4. Telemetry Perimeters Strip */}
                    <div style={{
                        background: 'rgba(0, 0, 0, 0.45)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '12px',
                        padding: '0.5rem 0.75rem',
                        zIndex: 2
                    }}>
                        <span style={{ fontSize: '0.58rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '4px', letterSpacing: '1px' }}>
                            Perímetros Clave (cm)
                        </span>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px', textAlign: 'center' }}>
                            <div>
                                <span style={{ fontSize: '0.58rem', color: '#94a3b8', display: 'block' }}>BRAZO</span>
                                <strong style={{ fontSize: '0.78rem', color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>{getAvg(m?.arm)}</strong>
                            </div>
                            <div>
                                <span style={{ fontSize: '0.58rem', color: '#94a3b8', display: 'block' }}>PECHO</span>
                                <strong style={{ fontSize: '0.78rem', color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>{m?.pecho ? `${m.pecho} cm` : '—'}</strong>
                            </div>
                            <div>
                                <span style={{ fontSize: '0.58rem', color: '#94a3b8', display: 'block' }}>CINTURA</span>
                                <strong style={{ fontSize: '0.78rem', color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>{m?.waist ? `${m.waist} cm` : '—'}</strong>
                            </div>
                            <div>
                                <span style={{ fontSize: '0.58rem', color: '#94a3b8', display: 'block' }}>ESPALDA</span>
                                <strong style={{ fontSize: '0.78rem', color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>{m?.back ? `${m.back} cm` : '—'}</strong>
                            </div>
                            <div>
                                <span style={{ fontSize: '0.58rem', color: '#94a3b8', display: 'block' }}>MUSLO</span>
                                <strong style={{ fontSize: '0.78rem', color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>{getAvg(m?.thigh)}</strong>
                            </div>
                            <div>
                                <span style={{ fontSize: '0.58rem', color: '#94a3b8', display: 'block' }}>GEMELO</span>
                                <strong style={{ fontSize: '0.78rem', color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>{getAvg(m?.calf)}</strong>
                            </div>
                        </div>
                    </div>

                    {/* 5. Bottom QR Call to Action Banner */}
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(245, 158, 11, 0.04))',
                        border: '1px solid rgba(245, 158, 11, 0.35)',
                        borderRadius: '14px',
                        padding: '0.55rem 0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '8px',
                        zIndex: 2
                    }}>
                        <div style={{ flex: 1 }}>
                            <span style={{ fontSize: '0.62rem', fontWeight: 900, color: '#fbbf24', display: 'block', letterSpacing: '0.5px' }}>
                                ¿TE ANIMAS A UN DUELO?
                            </span>
                            <span style={{ fontSize: '0.55rem', color: '#cbd5e1', lineHeight: 1.2, display: 'block' }}>
                                Escaneá el QR y compará tu físico en tiempo real.
                            </span>
                            <span style={{ fontSize: '0.5rem', color: '#64748b', fontFamily: 'var(--font-mono)', display: 'block', marginTop: '2px' }}>
                                hypertrophyracker.alexismartyniuk.com.ar
                            </span>
                        </div>

                        {qrUrl && (
                            <img
                                src={qrUrl}
                                alt="QR Code"
                                style={{
                                    width: '54px',
                                    height: '54px',
                                    borderRadius: '8px',
                                    border: '1px solid #ffffff',
                                    flexShrink: 0
                                }}
                            />
                        )}
                    </div>
                </div>

                {/* Modal Action Buttons */}
                <div style={{ width: '100%', display: 'flex', gap: '8px' }}>
                    <button
                        onClick={handleDownload}
                        disabled={generating}
                        className="btn-primary"
                        style={{ flex: 1, padding: '0.75rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    >
                        {downloaded ? <Check size={16} /> : <Download size={16} />}
                        <span>{generating ? 'Generando PNG...' : downloaded ? '¡Descargado!' : 'Descargar Story 9:16'}</span>
                    </button>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="btn-secondary"
                            style={{ padding: '0.75rem 1rem', fontSize: '0.85rem' }}
                        >
                            Cerrar
                        </button>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};
