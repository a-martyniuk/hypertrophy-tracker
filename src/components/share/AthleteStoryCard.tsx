import React, { useRef, useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { toPng } from 'html-to-image';
import { Download, Sparkles, Check, X, Copy, Link, Trophy, Zap } from 'lucide-react';
import type { MeasurementRecord } from '../../types/measurements';
import { computeComprehensiveAnalysis } from '../../utils/benchmarkAnalysis';
import { calculateFFMI } from '../../utils/skeletal';
import { calculateBilateralSymmetry } from '../../utils/symmetryAudit';
import { createCompactSelfContainedLink } from '../../services/shortLinkService';

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
    records: _records = [],
    userName = 'Atleta',
    sex = 'male',
    isOpen = false,
    onClose
}) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [generating, setGenerating] = useState(false);
    const [downloaded, setDownloaded] = useState(false);
    const [linkCopied, setLinkCopied] = useState(false);

    const m = record?.measurements;
    const analysis = useMemo(() => computeComprehensiveAnalysis(m, sex), [m, sex]);
    const symmetry = useMemo(() => calculateBilateralSymmetry(m), [m]);
    const ffmi = useMemo(() => {
        if (!m?.weight || !m?.height) return null;
        return calculateFFMI(m.weight, m.height, m.bodyFat || (sex === 'female' ? 22 : 15), sex);
    }, [m?.weight, m?.height, m?.bodyFat, sex]);

    const initials = (userName || 'AM')
        .split(' ')
        .map((w) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    const shareUrl = useMemo(() => {
        if (!record) return '';
        return createCompactSelfContainedLink(userName, record, sex);
    }, [record, userName, sex]);

    // Top Strengths sorted by % of Casey Butt limit
    const topStrengths = useMemo(() => {
        if (!analysis?.muscleBenchmarks || analysis.muscleBenchmarks.length === 0) return [];
        return [...analysis.muscleBenchmarks]
            .sort((a, b) => b.percentOfMax - a.percentOfMax)
            .slice(0, 3);
    }, [analysis]);

    // Athlete Tier Assessment
    const athleteTier = useMemo(() => {
        const ffmiVal = ffmi?.normalizedFFMI || 20;
        const maxPercent = analysis?.overallScore || 80;
        if (ffmiVal >= (sex === 'female' ? 21 : 24) || maxPercent >= 94) {
            return {
                label: 'ÉLITE NATURAL',
                sublabel: 'Top 1% Genético',
                color: '#fbbf24',
                bg: 'rgba(245, 158, 11, 0.18)',
                border: 'rgba(245, 158, 11, 0.45)'
            };
        }
        if (ffmiVal >= (sex === 'female' ? 19 : 22) || maxPercent >= 86) {
            return {
                label: 'AVANZADO PRO',
                sublabel: 'Desarrollo Superior',
                color: '#38bdf8',
                bg: 'rgba(56, 189, 248, 0.18)',
                border: 'rgba(56, 189, 248, 0.45)'
            };
        }
        return {
            label: 'ATLETA AUDITADO',
            sublabel: 'En Progreso Constante',
            color: '#34d399',
            bg: 'rgba(52, 211, 153, 0.18)',
            border: 'rgba(52, 211, 153, 0.45)'
        };
    }, [ffmi, analysis, sex]);

    // Escape key listener for fast dismissal
    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && onClose) onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen || !record) return null;

    const handleCopyLink = () => {
        if (!shareUrl) return;
        navigator.clipboard.writeText(shareUrl);
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 2500);
    };

    const handleDownload = async () => {
        if (!cardRef.current) return;
        setGenerating(true);
        try {
            const dataUrl = await toPng(cardRef.current, {
                pixelRatio: 3, // Exports exact 1080x1920 UHD resolution for 360x640 canvas
                cacheBust: true,
                skipFonts: true,
                backgroundColor: '#070a13'
            });

            // Native Web Share API file share on mobile devices
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
                backgroundColor: 'rgba(3, 7, 18, 0.92)',
                backdropFilter: 'blur(12px)',
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
                    background: 'linear-gradient(135deg, #0e1322 0%, #080b15 100%)',
                    border: '1.5px solid rgba(245, 158, 11, 0.35)',
                    borderRadius: '24px',
                    padding: '1.25rem',
                    maxWidth: '440px',
                    width: '100%',
                    maxHeight: '96vh',
                    overflowY: 'auto',
                    margin: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '1rem',
                    boxShadow: '0 30px 80px rgba(0, 0, 0, 0.9), 0 0 40px rgba(245, 158, 11, 0.1)'
                }}
            >
                {/* Modal Top Header */}
                <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fbbf24' }}>
                            <Sparkles size={16} />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-head)' }}>
                                Story Card 9:16 (Instagram & WhatsApp)
                            </h3>
                            <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Formato vertical optimizado para stickers interactivos</span>
                        </div>
                    </div>
                    {onClose && (
                        <button
                            onClick={onClose}
                            style={{ background: 'rgba(255, 255, 255, 0.05)', border: 'none', borderRadius: '8px', color: '#94a3b8', cursor: 'pointer', padding: '6px', display: 'flex' }}
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>

                {/* THE 9:16 RENDERABLE CANVAS CONTAINER (Exact 360 x 640 -> 1080 x 1920 at 3x) */}
                <div
                    ref={cardRef}
                    style={{
                        width: '360px',
                        height: '640px',
                        background: 'linear-gradient(180deg, #0a0f1d 0%, #060914 45%, #03050a 100%)',
                        border: '2px solid rgba(245, 158, 11, 0.45)',
                        borderRadius: '28px',
                        padding: '1.25rem 1.15rem',
                        boxSizing: 'border-box',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        position: 'relative',
                        overflow: 'hidden',
                        boxShadow: '0 0 50px rgba(0, 0, 0, 0.95), 0 0 30px rgba(245, 158, 11, 0.15)'
                    }}
                >
                    {/* Glowing Cyberpunk Background Accents */}
                    <div style={{
                        position: 'absolute',
                        top: '-50px',
                        right: '-50px',
                        width: '220px',
                        height: '220px',
                        background: 'radial-gradient(circle, rgba(245, 158, 11, 0.25) 0%, transparent 70%)',
                        pointerEvents: 'none'
                    }} />
                    <div style={{
                        position: 'absolute',
                        bottom: '80px',
                        left: '-60px',
                        width: '220px',
                        height: '220px',
                        background: 'radial-gradient(circle, rgba(34, 211, 238, 0.2) 0%, transparent 70%)',
                        pointerEvents: 'none'
                    }} />

                    {/* 1. Header Strip */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 2 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000' }}>
                                <Zap size={13} strokeWidth={3} />
                            </div>
                            <span style={{ fontSize: '0.72rem', fontWeight: 900, color: '#fbbf24', letterSpacing: '1.5px', fontFamily: 'var(--font-mono)' }}>
                                HYPERTROPHY TRACKER
                            </span>
                        </div>
                        <span style={{
                            fontSize: '0.62rem',
                            fontWeight: 900,
                            padding: '3px 9px',
                            borderRadius: '12px',
                            background: athleteTier.bg,
                            color: athleteTier.color,
                            border: `1px solid ${athleteTier.border}`,
                            fontFamily: 'var(--font-mono)',
                            letterSpacing: '0.5px'
                        }}>
                            {athleteTier.label}
                        </span>
                    </div>

                    {/* 2. Hero Athlete Identity Card */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '18px',
                        padding: '0.65rem 0.85rem',
                        backdropFilter: 'blur(8px)',
                        zIndex: 2
                    }}>
                        <div style={{
                            width: '54px',
                            height: '54px',
                            borderRadius: '16px',
                            background: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 900,
                            fontSize: '1.35rem',
                            color: '#000000',
                            fontFamily: 'var(--font-head)',
                            boxShadow: '0 0 20px rgba(245, 158, 11, 0.4)',
                            flexShrink: 0
                        }}>
                            {initials}
                        </div>
                        <div style={{ flex: 1, overflow: 'hidden' }}>
                            <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#ffffff', fontFamily: 'var(--font-head)', lineHeight: 1.15, textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
                                {userName}
                            </h2>
                            <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                                {m?.height || (sex === 'female' ? 165 : 180)} cm · {m?.weight || (sex === 'female' ? 60 : 75)} kg · {m?.bodyFat ? `${m.bodyFat}% Grasa` : (sex === 'female' ? '22% Grasa' : '15% Grasa')}
                            </div>
                        </div>
                    </div>

                    {/* 3. Top Strengths & Superpowers Spotlight */}
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(0, 0, 0, 0.4))',
                        border: '1px solid rgba(245, 158, 11, 0.25)',
                        borderRadius: '16px',
                        padding: '0.6rem 0.85rem',
                        zIndex: 2,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.6rem', fontWeight: 900, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'var(--font-mono)' }}>
                                <Trophy size={11} /> Puntos Fuertes Auditados
                            </span>
                            <span style={{ fontSize: '0.55rem', color: '#10b981', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                                Potencial Casey Butt
                            </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {topStrengths.map((bm) => (
                                <div key={bm.key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                                    <span style={{ color: '#e2e8f0', fontWeight: 700, textTransform: 'capitalize' }}>
                                        {bm.label}
                                    </span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <strong style={{ color: '#ffffff', fontFamily: 'var(--font-mono)' }}>
                                            {bm.current} cm
                                        </strong>
                                        <span style={{
                                            fontSize: '0.62rem',
                                            fontWeight: 900,
                                            padding: '1px 5px',
                                            borderRadius: '6px',
                                            background: bm.percentOfMax >= 95 ? 'rgba(245, 158, 11, 0.25)' : 'rgba(56, 189, 248, 0.2)',
                                            color: bm.percentOfMax >= 95 ? '#fbbf24' : '#38bdf8',
                                            fontFamily: 'var(--font-mono)'
                                        }}>
                                            {bm.percentOfMax}%
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* 4. Four Core Biometric Badges Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', zIndex: 2 }}>
                        <div style={{ background: 'rgba(0, 0, 0, 0.5)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '14px', padding: '0.5rem 0.65rem' }}>
                            <span style={{ fontSize: '0.58rem', color: '#94a3b8', display: 'block', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                                Potencial Genético
                            </span>
                            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#fbbf24', fontFamily: 'var(--font-mono)' }}>
                                {analysis?.overallScore || 90}%
                            </div>
                            <span style={{ fontSize: '0.55rem', color: '#10b981' }}>Tope de Casey Butt</span>
                        </div>

                        <div style={{ background: 'rgba(0, 0, 0, 0.5)', border: '1px solid rgba(34, 211, 238, 0.3)', borderRadius: '14px', padding: '0.5rem 0.65rem' }}>
                            <span style={{ fontSize: '0.58rem', color: '#94a3b8', display: 'block', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                                FFMI Normalizado
                            </span>
                            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#22d3ee', fontFamily: 'var(--font-mono)' }}>
                                {ffmi?.normalizedFFMI || 22.0}
                            </div>
                            <span style={{ fontSize: '0.55rem', color: '#38bdf8' }}>Densidad Magra</span>
                        </div>

                        <div style={{ background: 'rgba(0, 0, 0, 0.5)', border: '1px solid rgba(168, 85, 247, 0.3)', borderRadius: '14px', padding: '0.5rem 0.65rem' }}>
                            <span style={{ fontSize: '0.58rem', color: '#94a3b8', display: 'block', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                                {sex === 'female' ? 'Ratio Reloj de Arena' : 'Ratio V-Taper'}
                            </span>
                            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#c084fc', fontFamily: 'var(--font-mono)' }}>
                                {analysis?.ratioBenchmarks?.[0]?.currentValue?.toFixed(2) || '1.55'}x
                            </div>
                            <span style={{ fontSize: '0.55rem', color: '#a855f7' }}>Áureo: {sex === 'female' ? '1.38x' : '1.62x'}</span>
                        </div>

                        <div style={{ background: 'rgba(0, 0, 0, 0.5)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '14px', padding: '0.5rem 0.65rem' }}>
                            <span style={{ fontSize: '0.58rem', color: '#94a3b8', display: 'block', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                                Simetría Bilateral
                            </span>
                            <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#10b981', fontFamily: 'var(--font-mono)' }}>
                                {symmetry?.overallScore || 98}%
                            </div>
                            <span style={{ fontSize: '0.55rem', color: '#34d399' }}>Equilibrio Izq / Der</span>
                        </div>
                    </div>

                    {/* 5. Telemetry Perimeters Strip */}
                    <div style={{
                        background: 'rgba(0, 0, 0, 0.5)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '14px',
                        padding: '0.45rem 0.75rem',
                        zIndex: 2
                    }}>
                        <span style={{ fontSize: '0.55rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '3px', letterSpacing: '1px' }}>
                            Perímetros Antropométricos (cm)
                        </span>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '3px', textAlign: 'center' }}>
                            <div>
                                <span style={{ fontSize: '0.55rem', color: '#94a3b8', display: 'block' }}>BRAZO</span>
                                <strong style={{ fontSize: '0.75rem', color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>{getAvg(m?.arm)}</strong>
                            </div>
                            <div>
                                <span style={{ fontSize: '0.55rem', color: '#94a3b8', display: 'block' }}>PECHO</span>
                                <strong style={{ fontSize: '0.75rem', color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>{m?.pecho ? `${m.pecho} cm` : '—'}</strong>
                            </div>
                            <div>
                                <span style={{ fontSize: '0.55rem', color: '#94a3b8', display: 'block' }}>CINTURA</span>
                                <strong style={{ fontSize: '0.75rem', color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>{m?.waist ? `${m.waist} cm` : '—'}</strong>
                            </div>
                            <div>
                                <span style={{ fontSize: '0.55rem', color: '#94a3b8', display: 'block' }}>ESPALDA</span>
                                <strong style={{ fontSize: '0.75rem', color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>{m?.back ? `${m.back} cm` : '—'}</strong>
                            </div>
                            <div>
                                <span style={{ fontSize: '0.55rem', color: '#94a3b8', display: 'block' }}>MUSLO</span>
                                <strong style={{ fontSize: '0.75rem', color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>{getAvg(m?.thigh)}</strong>
                            </div>
                            <div>
                                <span style={{ fontSize: '0.55rem', color: '#94a3b8', display: 'block' }}>GEMELO</span>
                                <strong style={{ fontSize: '0.75rem', color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>{getAvg(m?.calf)}</strong>
                            </div>
                        </div>
                    </div>

                    {/* 6. INSTAGRAM / WHATSAPP STICKER ZONE (High-Converting Interactive Placeholder) */}
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(56, 189, 248, 0.12))',
                        border: '2px dashed rgba(245, 158, 11, 0.65)',
                        borderRadius: '16px',
                        padding: '0.65rem 0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px',
                        zIndex: 2,
                        boxShadow: '0 0 20px rgba(245, 158, 11, 0.15)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000000', flexShrink: 0, boxShadow: '0 0 12px rgba(251, 191, 36, 0.6)' }}>
                                <Link size={17} strokeWidth={2.5} />
                            </div>
                            <div>
                                <span style={{ fontSize: '0.68rem', fontWeight: 900, color: '#ffffff', display: 'block', letterSpacing: '0.3px' }}>
                                    TOCA EL ENLACE DE LA HISTORIA
                                </span>
                                <span style={{ fontSize: '0.58rem', color: '#94a3b8', display: 'block', lineHeight: 1.2 }}>
                                    Para retarme en duelo y ver mi auditoría 360°
                                </span>
                            </div>
                        </div>
                        <div style={{
                            padding: '3px 8px',
                            borderRadius: '8px',
                            background: 'rgba(255, 255, 255, 0.1)',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            fontSize: '0.58rem',
                            fontWeight: 800,
                            color: '#fbbf24',
                            fontFamily: 'var(--font-mono)'
                        }}>
                            STICKER ➔
                        </div>
                    </div>
                </div>

                {/* Modal Action Buttons (Copy Link for Sticker + Download) */}
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                        <button
                            onClick={handleDownload}
                            disabled={generating}
                            className="btn-primary"
                            style={{ flex: 1, padding: '0.75rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontWeight: 800 }}
                        >
                            {downloaded ? <Check size={16} /> : <Download size={16} />}
                            <span>{generating ? 'Generando PNG...' : downloaded ? '¡Descargado!' : 'Descargar Story 9:16'}</span>
                        </button>

                        <button
                            onClick={handleCopyLink}
                            style={{
                                padding: '0.75rem 1rem',
                                borderRadius: '12px',
                                background: linkCopied ? 'rgba(16, 185, 129, 0.25)' : 'rgba(56, 189, 248, 0.2)',
                                border: linkCopied ? '1px solid #10b981' : '1px solid rgba(56, 189, 248, 0.4)',
                                color: linkCopied ? '#34d399' : '#38bdf8',
                                fontSize: '0.82rem',
                                fontWeight: 800,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                transition: 'all 0.2s ease'
                            }}
                            title="Copiar enlace directo para pegar como Sticker en Instagram"
                        >
                            {linkCopied ? <Check size={16} /> : <Copy size={16} />}
                            <span>{linkCopied ? '¡Copiado!' : 'Copiar Link Sticker'}</span>
                        </button>
                    </div>

                    {onClose && (
                        <button
                            onClick={onClose}
                            className="btn-secondary"
                            style={{ width: '100%', padding: '0.55rem', fontSize: '0.8rem' }}
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
