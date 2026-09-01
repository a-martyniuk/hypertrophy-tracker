import React, { useRef, useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { toPng } from 'html-to-image';
import { Download, Sparkles, Check, X, Copy, Link, Zap, Dna, Activity, Scale } from 'lucide-react';
import type { MeasurementRecord } from '../../types/measurements';
import { computeComprehensiveAnalysis } from '../../utils/benchmarkAnalysis';
import { calculateFFMI, calculateSkeletalPotential, calculateBerkhanLimit, calculateIEO } from '../../utils/skeletal';
import { calculateBilateralSymmetry } from '../../utils/symmetryAudit';
import { analyzeProportions } from '../../utils/proportions';
import { createCompactSelfContainedLink } from '../../services/shortLinkService';
import maleSilhouette from '../../assets/clean_red_silhouette.png';
import femaleSilhouette from '../../assets/silhouette_female.png';

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
    const [silhouetteDataUrl, setSilhouetteDataUrl] = useState<string>('');

    useEffect(() => {
        const src = sex === 'female' ? femaleSilhouette : maleSilhouette;
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = img.naturalWidth || img.width || 300;
                canvas.height = img.naturalHeight || img.height || 600;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(img, 0, 0);
                    setSilhouetteDataUrl(canvas.toDataURL('image/png'));
                }
            } catch {
                setSilhouetteDataUrl(src);
            }
        };
        img.onerror = () => setSilhouetteDataUrl(src);
        img.src = src;
    }, [sex]);

    const m = record?.measurements;
    const analysis = useMemo(() => computeComprehensiveAnalysis(m, sex), [m, sex]);
    const symmetry = useMemo(() => calculateBilateralSymmetry(m), [m]);
    const proportions = useMemo(() => analyzeProportions(m, sex), [m, sex]);
    const ffmi = useMemo(() => {
        if (!m?.weight || !m?.height) return null;
        return calculateFFMI(m.weight, m.height, m.bodyFat || (sex === 'female' ? 22 : 15), sex);
    }, [m?.weight, m?.height, m?.bodyFat, sex]);

    const berkhan = useMemo(() => {
        const height = m?.height || (sex === 'female' ? 165 : 180);
        const bf = m?.bodyFat || (sex === 'female' ? 22 : 15);
        return calculateBerkhanLimit(height, sex, bf);
    }, [m?.height, m?.bodyFat, sex]);

    const getAvgNum = (val: number | { left?: number; right?: number } | undefined): number => {
        if (!val) return 0;
        if (typeof val === 'number') return val;
        const l = val.left || 0;
        const r = val.right || 0;
        if (l > 0 && r > 0) return parseFloat(((l + r) / 2).toFixed(1));
        return l || r || 0;
    };

    const ieo = useMemo(() => {
        const wrist = getAvgNum(m?.wrist) || (sex === 'female' ? 15.5 : 17.5);
        const ankle = getAvgNum(m?.ankle) || (sex === 'female' ? 20.5 : 22.5);
        return calculateIEO(wrist, ankle, sex);
    }, [m?.wrist, m?.ankle, sex]);

    const leanMass = ffmi?.leanMassKg || 0;
    const fatMass = ffmi?.fatMassKg || 0;
    const maxLean = berkhan.maxLeanWeightKg;
    const leanDevelopedPct = maxLean > 0 ? Math.min(100, Math.round((leanMass / maxLean) * 100)) : 0;
    const leanRemainingKg = Math.max(0, parseFloat((maxLean - leanMass).toFixed(1)));

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


    // Full 6 Muscle Groups Projection from Casey Butt Model
    const caseyProjections = useMemo(() => {
        const height = m?.height || (sex === 'female' ? 165 : 178);
        const wristAvg = getAvgNum(m?.wrist);
        const ankleAvg = getAvgNum(m?.ankle);
        const wrist = wristAvg > 0 ? wristAvg : (sex === 'female' ? 15.5 : 17.5);
        const ankle = ankleAvg > 0 ? ankleAvg : (sex === 'female' ? 20.5 : 22.5);
        const potentials = calculateSkeletalPotential(wrist, ankle, height, sex);

        const list = [
            {
                key: 'arm',
                label: 'Brazo',
                current: getAvgNum(m?.arm),
                max: potentials.biceps
            },
            {
                key: 'pecho',
                label: 'Pecho',
                current: m?.pecho || 0,
                max: potentials.chest
            },
            {
                key: 'forearm',
                label: 'Antebrazo',
                current: getAvgNum(m?.forearm),
                max: potentials.forearms
            },
            {
                key: 'thigh',
                label: 'Muslo',
                current: getAvgNum(m?.thigh),
                max: potentials.thighs
            },
            {
                key: 'calf',
                label: 'Gemelo',
                current: getAvgNum(m?.calf),
                max: potentials.calves
            },
            {
                key: 'neck',
                label: 'Cuello',
                current: m?.neck || 0,
                max: potentials.neck
            }
        ];

        return list.map(item => {
            const pct = item.max > 0 && item.current > 0
                ? Math.min(105, Math.round((item.current / item.max) * 100))
                : 0;
            return {
                ...item,
                pct
            };
        });
    }, [m, sex]);

    // Overall Developed Score from all measured groups
    const overallDevelopedPct = useMemo(() => {
        const measured = caseyProjections.filter(p => p.current > 0);
        if (measured.length === 0) return analysis?.overallScore || 85;
        const total = measured.reduce((acc, curr) => acc + curr.pct, 0);
        return Math.round(total / measured.length);
    }, [caseyProjections, analysis]);

    // Athlete Tier Assessment
    const athleteTier = useMemo(() => {
        const ffmiVal = ffmi?.normalizedFFMI || 20;
        const maxPercent = overallDevelopedPct;
        if (ffmiVal >= (sex === 'female' ? 21 : 24) || maxPercent >= 94) {
            return {
                label: 'ÉLITE NATURAL',
                color: '#fbbf24',
                bg: 'rgba(245, 158, 11, 0.18)',
                border: 'rgba(245, 158, 11, 0.45)'
            };
        }
        if (ffmiVal >= (sex === 'female' ? 19 : 22) || maxPercent >= 86) {
            return {
                label: 'AVANZADO PRO',
                color: '#38bdf8',
                bg: 'rgba(56, 189, 248, 0.18)',
                border: 'rgba(56, 189, 248, 0.45)'
            };
        }
        return {
            label: 'ATLETA AUDITADO',
            color: '#34d399',
            bg: 'rgba(52, 211, 153, 0.18)',
            border: 'rgba(52, 211, 153, 0.45)'
        };
    }, [ffmi, overallDevelopedPct, sex]);

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
                pixelRatio: 3, // Exports exact 1170x2532 UHD resolution (390x844 iPhone native canvas)
                cacheBust: false,
                skipFonts: true,
                backgroundColor: '#070a14',
                width: 390,
                height: 844
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

    const vRatio = (m?.pecho && m?.waist && m.waist > 0) ? (m.pecho / m.waist).toFixed(2) : '1.55';

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
                    maxWidth: '420px',
                    width: '100%',
                    maxHeight: '96vh',
                    overflowY: 'auto',
                    margin: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.85rem',
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
                                Story iPhone 19.5:9 (1170 × 2532 UHD)
                            </h3>
                            <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Ajuste nativo a pantalla completa de iPhone · Instagram & WhatsApp Stories</span>
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

                {/* SCROLLABLE / SCALED PREVIEW WRAPPER TO PREVENT HORIZONTAL SQUEEZING ON MOBILE */}
                <div style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    overflowX: 'auto',
                    padding: '4px 0'
                }}>
                    {/* THE 19.5:9 RENDERABLE CANVAS CONTAINER (Exact 390 x 844 -> 1170 x 2532 at 3x) */}
                    <div
                        ref={cardRef}
                        style={{
                            width: '390px',
                            minWidth: '390px',
                            height: '844px',
                            minHeight: '844px',
                            flexShrink: 0,
                            background: '#070a14',
                            backgroundImage: 'radial-gradient(circle at 50% 8%, rgba(245, 158, 11, 0.16) 0%, transparent 55%), radial-gradient(circle at 50% 92%, rgba(34, 211, 238, 0.12) 0%, transparent 55%)',
                            border: 'none',
                            borderRadius: '0px',
                            padding: '54px 18px 72px 18px', // Native iPhone safe zones for Instagram top tools and bottom bar
                            boxSizing: 'border-box',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                    >
                        {/* 1. Top Brand & Tier Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 2 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000' }}>
                                    <Zap size={13} strokeWidth={3} />
                                </div>
                                <span style={{ fontSize: '0.72rem', fontWeight: 900, color: '#fbbf24', letterSpacing: '1.4px', fontFamily: 'var(--font-mono)' }}>
                                    HYPERTROPHY TRACKER
                                </span>
                            </div>
                            <span style={{
                                fontSize: '0.62rem',
                                fontWeight: 900,
                                padding: '3px 9px',
                                borderRadius: '8px',
                                background: athleteTier.bg,
                                color: athleteTier.color,
                                border: `1px solid ${athleteTier.border}`,
                                fontFamily: 'var(--font-mono)',
                                letterSpacing: '0.6px'
                            }}>
                                {athleteTier.label}
                            </span>
                        </div>

                        {/* 2. Hero Athlete Identity Card with Full Name & Clear Descriptors */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            background: 'rgba(255, 255, 255, 0.035)',
                            border: '1px solid rgba(255, 255, 255, 0.09)',
                            borderRadius: '14px',
                            padding: '0.45rem 0.7rem',
                            zIndex: 2
                        }}>
                            <div style={{
                                width: '42px',
                                height: '42px',
                                borderRadius: '12px',
                                background: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
                                border: '1.5px solid rgba(251, 191, 36, 0.7)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 900,
                                fontSize: '1.15rem',
                                color: '#000000',
                                fontFamily: 'var(--font-head)',
                                flexShrink: 0
                            }}>
                                {initials}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <h2 style={{
                                    margin: 0,
                                    fontSize: '1.1rem',
                                    fontWeight: 900,
                                    color: '#ffffff',
                                    fontFamily: 'var(--font-head)',
                                    lineHeight: 1.15,
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }}>
                                    {userName}
                                </h2>
                                <div style={{ fontSize: '0.64rem', color: '#94a3b8', fontFamily: 'var(--font-mono)', marginTop: '2px' }}>
                                    {m?.height || (sex === 'female' ? 165 : 180)} cm · {m?.weight || (sex === 'female' ? 60 : 75)} kg {m?.bodyFat ? `· ${m.bodyFat}% Grasa` : ''}
                                </div>
                                <div style={{ display: 'flex', gap: '5px', marginTop: '3px', flexWrap: 'wrap' }}>
                                    <div style={{
                                        background: 'rgba(34, 211, 238, 0.12)',
                                        border: '1px solid rgba(34, 211, 238, 0.35)',
                                        borderRadius: '6px',
                                        padding: '1px 6px',
                                        fontSize: '0.54rem',
                                        fontFamily: 'var(--font-mono)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '3px',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        <span style={{ color: '#22d3ee', fontWeight: 900 }}>FFMI {ffmi?.normalizedFFMI || 22.0}</span>
                                        <span style={{ color: '#94a3b8', fontWeight: 600 }}>· {analysis?.ffmiScore?.statusText || 'Excelente Nivel'}</span>
                                    </div>

                                    <div style={{
                                        background: 'rgba(168, 85, 247, 0.12)',
                                        border: '1px solid rgba(168, 85, 247, 0.35)',
                                        borderRadius: '6px',
                                        padding: '1px 6px',
                                        fontSize: '0.54rem',
                                        fontFamily: 'var(--font-mono)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '3px',
                                        whiteSpace: 'nowrap'
                                    }}>
                                        <span style={{ color: '#c084fc', fontWeight: 900 }}>{sex === 'female' ? 'Reloj Arena' : 'V-Taper'} {vRatio}x</span>
                                        <span style={{ color: '#94a3b8', fontWeight: 600 }}>· Silueta V</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 3. COMPOSICIÓN CORPORAL & POTENCIAL MAGRO (MODELO MARTIN BERKHAN) */}
                        <div style={{
                            background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.07), rgba(15, 23, 42, 0.65))',
                            border: '1px solid rgba(34, 211, 238, 0.25)',
                            borderRadius: '14px',
                            padding: '0.45rem 0.65rem',
                            zIndex: 2,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.56rem', fontWeight: 900, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                                    <Scale size={11} /> Composición & Potencial Magro
                                </span>
                                <span style={{ fontSize: '0.54rem', color: '#34d399', fontFamily: 'var(--font-mono)', fontWeight: 800, whiteSpace: 'nowrap' }}>
                                    {leanDevelopedPct}% Límite Magro
                                </span>
                            </div>

                            {/* 3 Metric Grid: Lean Mass | Fat Mass | Max Natural Berkhan Limit */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px' }}>
                                <div style={{ background: 'rgba(34, 211, 238, 0.08)', border: '1px solid rgba(34, 211, 238, 0.25)', borderRadius: '7px', padding: '3px 4px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.44rem', fontWeight: 800, color: '#94a3b8', whiteSpace: 'nowrap' }}>MASA MAGRA</div>
                                    <div style={{ fontSize: '0.74rem', fontWeight: 900, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                                        {leanMass > 0 ? `${leanMass} kg` : '—'}
                                    </div>
                                    <div style={{ fontSize: '0.40rem', color: '#cbd5e1', fontWeight: 600 }}>Músculo Activo</div>
                                </div>

                                <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.07)', borderRadius: '7px', padding: '3px 4px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.44rem', fontWeight: 800, color: '#94a3b8', whiteSpace: 'nowrap' }}>MASA GRASA</div>
                                    <div style={{ fontSize: '0.74rem', fontWeight: 900, color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>
                                        {fatMass > 0 ? `${fatMass} kg` : '—'}
                                    </div>
                                    <div style={{ fontSize: '0.40rem', color: '#cbd5e1', fontWeight: 600 }}>{m?.bodyFat ? `${m.bodyFat}% BF` : 'Reserva'}</div>
                                </div>

                                <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '7px', padding: '3px 4px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '0.44rem', fontWeight: 800, color: '#94a3b8', whiteSpace: 'nowrap' }}>MÁX MAGRO</div>
                                    <div style={{ fontSize: '0.74rem', fontWeight: 900, color: '#fbbf24', fontFamily: 'var(--font-mono)' }}>
                                        {maxLean} kg
                                    </div>
                                    <div style={{ fontSize: '0.40rem', color: '#34d399', fontWeight: 700 }}>+{leanRemainingKg} kg Potencial</div>
                                </div>
                            </div>

                            {/* Structural Frame Capacity (IEO) Info Line */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.48rem', color: '#cbd5e1', fontFamily: 'var(--font-mono)', padding: '0 2px' }}>
                                <span>Estructura Ósea (IEO {ieo.value}): <strong style={{ color: '#f8fafc' }}>{ieo.label === 'large' || ieo.label === 'very_large' ? 'Robusta (Alta Capacidad)' : 'Equilibrada'}</strong></span>
                                <span style={{ color: '#94a3b8' }}>Muñeca {getAvgNum(m?.wrist) || 17.5} · Tobillo {getAvgNum(m?.ankle) || 22.5} cm</span>
                            </div>
                        </div>

                        {/* 4. CENTRAL ANATOMICAL SILHOUETTE & AESTHETIC HARMONY ARCHITECTURE */}
                        <div style={{
                            background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.6), rgba(15, 23, 42, 0.5))',
                            border: '1px solid rgba(255, 255, 255, 0.09)',
                            borderRadius: '14px',
                            padding: '0.55rem 0.7rem',
                            zIndex: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '10px'
                        }}>
                            {/* Anatomical Silhouette Graphic */}
                            <div style={{ position: 'relative', width: '85px', height: '145px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <img
                                    src={silhouetteDataUrl || (sex === 'female' ? femaleSilhouette : maleSilhouette)}
                                    alt="Silueta Anatómica"
                                    style={{
                                        maxHeight: '140px',
                                        maxWidth: '80px',
                                        width: 'auto',
                                        height: 'auto',
                                        objectFit: 'contain'
                                    }}
                                />
                            </div>

                            {/* Distinct Core Architecture & Symmetry Panels (Non-redundant) */}
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3.5px', minWidth: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1px' }}>
                                    <span style={{ fontSize: '0.56rem', fontWeight: 900, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '3px', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                                        <Activity size={11} /> Estructura & Simetría
                                    </span>
                                    <span style={{ fontSize: '0.52rem', color: '#10b981', fontFamily: 'var(--font-mono)', fontWeight: 800, whiteSpace: 'nowrap' }}>
                                        {proportions?.overallGoldenScore || 92}% Armónico
                                    </span>
                                </div>

                                {/* Torso & Core Dimensions (Espalda & Cintura) */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
                                    <div style={{ background: 'rgba(255, 255, 255, 0.035)', border: '1px solid rgba(255, 255, 255, 0.07)', borderRadius: '7px', padding: '3px 5px' }}>
                                        <div style={{ fontSize: '0.46rem', fontWeight: 800, color: '#94a3b8', whiteSpace: 'nowrap' }}>ESPALDA / DORSAL</div>
                                        <div style={{ fontSize: '0.74rem', fontWeight: 900, color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>
                                            {m?.back ? `${m.back} cm` : '—'}
                                        </div>
                                    </div>

                                    <div style={{ background: 'rgba(255, 255, 255, 0.035)', border: '1px solid rgba(255, 255, 255, 0.07)', borderRadius: '7px', padding: '3px 5px' }}>
                                        <div style={{ fontSize: '0.46rem', fontWeight: 800, color: '#94a3b8', whiteSpace: 'nowrap' }}>CINTURA / CORE</div>
                                        <div style={{ fontSize: '0.74rem', fontWeight: 900, color: '#c084fc', fontFamily: 'var(--font-mono)' }}>
                                            {m?.waist ? `${m.waist} cm` : '—'}
                                        </div>
                                    </div>
                                </div>

                                {/* Steve Reeves Triad (Brazo ≈ Cuello ≈ Gemelo) */}
                                <div style={{ background: 'rgba(245, 158, 11, 0.07)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '7px', padding: '3px 6px', display: 'flex', flexDirection: 'column', gap: '1px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.48rem', fontWeight: 900, color: '#fbbf24', whiteSpace: 'nowrap' }}>TRÍADA REEVES (1:1:1)</span>
                                        <span style={{ fontSize: '0.52rem', fontWeight: 900, color: '#34d399', fontFamily: 'var(--font-mono)' }}>
                                            {proportions?.reevesTriad.symmetryScore || 96}%
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '0.52rem', color: '#cbd5e1', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        Brazo {proportions?.reevesTriad.armAvg || getAvgNum(m?.arm)} · Cuello {m?.neck || '—'} · Gemelo {proportions?.reevesTriad.calfAvg || getAvgNum(m?.calf)} cm
                                    </div>
                                </div>

                                {/* Bilateral Balance (L vs R) */}
                                <div style={{ background: 'rgba(56, 189, 248, 0.07)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: '7px', padding: '3px 6px', display: 'flex', flexDirection: 'column', gap: '1px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '0.48rem', fontWeight: 900, color: '#38bdf8', whiteSpace: 'nowrap' }}>BALANCE BILATERAL (L/R)</span>
                                        <span style={{ fontSize: '0.52rem', fontWeight: 900, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>
                                            Simetría {symmetry?.overallScore || 98}%
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '0.50rem', color: '#94a3b8', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {(() => {
                                            const maxLimb = symmetry?.limbs?.reduce((max, curr) => (curr.diffCm > (max?.diffCm || 0) ? curr : max), symmetry.limbs[0]);
                                            if (maxLimb && maxLimb.diffCm > 0.5) {
                                                return `Mayor desvío: ${maxLimb.diffCm} cm en ${maxLimb.name}`;
                                            }
                                            return 'Desvío ≤ 0.5 cm en extremidades';
                                        })()}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 5. PROYECCIÓN COMPLETA DE LÍMITES GENÉTICOS NATURALES (CASEY BUTT MODEL) */}
                        <div style={{
                            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.07), rgba(0, 0, 0, 0.6))',
                            border: '1px solid rgba(245, 158, 11, 0.28)',
                            borderRadius: '14px',
                            padding: '0.55rem 0.7rem',
                            zIndex: 2,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '3px'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                                <span style={{ fontSize: '0.58rem', fontWeight: 900, color: '#fbbf24', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                                    <Dna size={11} /> Límite Genético Natural (Casey Butt)
                                </span>
                                <span style={{ fontSize: '0.54rem', fontWeight: 800, color: '#10b981', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                                    {overallDevelopedPct}% Desarrollado
                                </span>
                            </div>

                            {/* All 6 Muscle Groups with Progress Bars */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5px' }}>
                                {caseyProjections.map((item) => {
                                    const currentText = item.current > 0 ? `${item.current} cm` : '—';
                                    const pct = item.pct;
                                    const barColor = pct >= 95 ? '#fbbf24' : pct >= 88 ? '#38bdf8' : pct > 0 ? '#34d399' : '#64748b';

                                    return (
                                        <div key={item.key} style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.56rem', lineHeight: 1.2 }}>
                                                <span style={{ color: '#e2e8f0', fontWeight: 700, whiteSpace: 'nowrap' }}>
                                                    {item.label}
                                                </span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                                                    <span style={{ color: item.current > 0 ? '#ffffff' : '#64748b', fontWeight: 800 }}>
                                                        {currentText}
                                                    </span>
                                                    <span style={{ color: '#64748b', fontSize: '0.50rem' }}>
                                                        / Max {item.max} cm
                                                    </span>
                                                    <span style={{
                                                        fontSize: '0.54rem',
                                                        fontWeight: 900,
                                                        color: barColor,
                                                        minWidth: '24px',
                                                        textAlign: 'right'
                                                    }}>
                                                        {pct > 0 ? `${pct}%` : '—'}
                                                    </span>
                                                </div>
                                            </div>
                                            {/* Progress Bar */}
                                            <div style={{ width: '100%', height: '3.5px', background: 'rgba(255, 255, 255, 0.09)', borderRadius: '2px', overflow: 'hidden' }}>
                                                <div style={{
                                                    width: `${Math.min(100, Math.max(pct, 0))}%`,
                                                    height: '100%',
                                                    background: `linear-gradient(90deg, ${barColor}88, ${barColor})`,
                                                    borderRadius: '2px'
                                                }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 6. ESPACIO LIMPIO PARA STICKER DE ENLACE */}
                        <div style={{
                            height: '38px',
                            border: '1.5px dashed rgba(245, 158, 11, 0.4)',
                            borderRadius: '12px',
                            background: 'rgba(245, 158, 11, 0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            color: 'rgba(251, 191, 36, 0.75)',
                            fontSize: '0.60rem',
                            fontFamily: 'var(--font-mono)',
                            letterSpacing: '0.5px',
                            zIndex: 2
                        }}>
                            <Link size={12} strokeWidth={2} />
                            <span>Espacio para Sticker de Enlace</span>
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
                            <span>{generating ? 'Generando PNG...' : downloaded ? '¡Descargado!' : 'Descargar Story iPhone'}</span>
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
