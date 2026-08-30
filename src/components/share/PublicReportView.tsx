import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    Shield,
    Sparkles,
    Scale,
    Download,
    Calendar,
    Map as MapIcon,
    User,
    Share2,
    Swords,
    Check,
    Flame,
    Award,
    Activity
} from 'lucide-react';
import { decodeAthleteData } from '../../utils/shareEncoder';
import { shortenUrl } from '../../utils/urlShortener';
import { fetchShortReportPayload } from '../../services/shortLinkService';
import { generateTacticalDiagnosis } from '../../utils/tacticalDiagnosis';
import { computeComprehensiveAnalysis, type MuscleBenchmark } from '../../utils/benchmarkAnalysis';
import { generateAthletePDFReport } from '../../utils/pdfReportGenerator';
import { BenchmarkCard } from '../analysis/BenchmarkCard';
import { RatioBenchmarkCard } from '../analysis/RatioBenchmarkCard';
import { AthleteComparisonCard } from '../analysis/AthleteComparisonCard';
import { MuscleHistoryModal } from '../analysis/MuscleHistoryModal';
import { DynamicSilhouette } from '../DynamicSilhouette';
import { MapModal } from '../measurement/MapModal';
import { AthleteStoryCardModal } from './AthleteStoryCard';
import { QuickDuelChallengeModal } from './QuickDuelChallengeModal';
import { useMeasurementLines } from '../../hooks/useMeasurementLines';
import type { MeasurementRecord, BodyMeasurements } from '../../types/measurements';

import '../AnalysisView.css';
import '../MeasurementForm.css';
import './PublicReportView.css';

type TrainerTab = 'bodymap' | 'versus';

interface ReadOnlyHudCardProps {
    id: string;
    label: string;
    value: number | { left: number; right: number };
    previousValue?: number | { left: number; right: number };
    unit?: string;
}

const ReadOnlyHudCard: React.FC<ReadOnlyHudCardProps> = ({
    id,
    label,
    value,
    previousValue,
    unit = 'cm'
}) => {
    const isDouble = typeof value === 'object' && value !== null;

    const renderTrend = (cur: number, prev?: number) => {
        if (!prev || cur === 0) return null;
        const diff = cur - prev;
        if (Math.abs(diff) < 0.1) return <span className="trend-eq">=</span>;
        return diff > 0 ? (
            <span className="trend-up">↑ {diff.toFixed(1)}</span>
        ) : (
            <span className="trend-down">↓ {Math.abs(diff).toFixed(1)}</span>
        );
    };

    if (isDouble) {
        const val = value as { left: number; right: number };
        const prev = previousValue as { left: number; right: number } | undefined;
        return (
            <div className="hud-input-group-double" id={id} style={{ cursor: 'default' }}>
                <div className="hud-label-row">
                    <label>{label}</label>
                    <div className="trends" style={{ display: 'flex', gap: '8px' }}>
                        {renderTrend(val.left || 0, prev?.left)}
                        {renderTrend(val.right || 0, prev?.right)}
                    </div>
                </div>
                <div className="hud-double-inputs" style={{ display: 'flex', gap: '0.75rem' }}>
                    <div style={{ flex: 1, borderBottom: '2px solid rgba(245, 158, 11, 0.4)', padding: '2px 0', fontSize: '1.25rem', fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#ffffff' }}>
                        {val.left || '--'}
                    </div>
                    <div style={{ flex: 1, borderBottom: '2px solid rgba(245, 158, 11, 0.4)', padding: '2px 0', fontSize: '1.25rem', fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#ffffff' }}>
                        {val.right || '--'}
                    </div>
                </div>
            </div>
        );
    }

    const numVal = value as number;
    const prevNum = previousValue as number | undefined;

    return (
        <div className="hud-input-group" id={id} style={{ cursor: 'default' }}>
            <div className="hud-label-row">
                <label>{label}</label>
                {renderTrend(numVal || 0, prevNum)}
            </div>
            <div style={{ borderBottom: '2px solid rgba(245, 158, 11, 0.4)', padding: '2px 0', fontSize: '1.25rem', fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#ffffff' }}>
                {numVal || '--'} <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>{unit}</span>
            </div>
        </div>
    );
};

export const PublicReportView: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // Multi-source extraction for maximum compatibility with all browsers and share links
    const encodedData = useMemo(() => {
        const fromSearch = searchParams.get('s') || searchParams.get('data') || searchParams.get('c');
        if (fromSearch) return fromSearch;

        if (typeof window !== 'undefined') {
            const urlQuery = new URLSearchParams(window.location.search);
            const urlData = urlQuery.get('s') || urlQuery.get('data') || urlQuery.get('c');
            if (urlData) return urlData;

            if (window.location.hash.includes('?')) {
                const hashQuery = new URLSearchParams(window.location.hash.split('?')[1]);
                const hashData = hashQuery.get('s') || hashQuery.get('data') || hashQuery.get('c');
                if (hashData) return hashData;
            }
        }
        return null;
    }, [searchParams]);

    // Extract short slug if shared via /s/:slug or ?id=:slug
    const shortSlug = useMemo(() => {
        const fromSearch = searchParams.get('id');
        if (fromSearch) return fromSearch;

        if (typeof window !== 'undefined') {
            const urlQuery = new URLSearchParams(window.location.search).get('id');
            if (urlQuery) return urlQuery;

            // Check if hash matches /s/slug
            const hash = window.location.hash;
            const match = hash.match(/#\/s\/([a-zA-Z0-9_-]+)/);
            if (match && match[1]) return match[1];

            if (window.location.hash.includes('?')) {
                const hashQuery = new URLSearchParams(window.location.hash.split('?')[1]).get('id');
                if (hashQuery) return hashQuery;
            }
        }
        return null;
    }, [searchParams]);

    const [resolvedData, setResolvedData] = useState<string | null>(null);
    const [isLoadingShort, setIsLoadingShort] = useState<boolean>(Boolean(shortSlug && !encodedData));

    useEffect(() => {
        if (shortSlug && !encodedData) {
            setIsLoadingShort(true);
            fetchShortReportPayload(shortSlug)
                .then(data => {
                    if (data) setResolvedData(data);
                })
                .catch(err => console.error('Error fetching short report:', err))
                .finally(() => setIsLoadingShort(false));
        }
    }, [shortSlug, encodedData]);

    const paramTab = useMemo(() => {
        let tab = searchParams.get('tab') as TrainerTab | null;
        if (!tab && typeof window !== 'undefined') {
            const urlTab = new URLSearchParams(window.location.search).get('tab') as TrainerTab | null;
            if (urlTab) tab = urlTab;
            else if (window.location.hash.includes('?')) {
                tab = new URLSearchParams(window.location.hash.split('?')[1]).get('tab') as TrainerTab | null;
            }
        }
        return tab;
    }, [searchParams]);

    const paramRival = useMemo(() => {
        let rival = searchParams.get('rival');
        if (!rival && typeof window !== 'undefined') {
            const urlRival = new URLSearchParams(window.location.search).get('rival');
            if (urlRival) rival = urlRival;
            else if (window.location.hash.includes('?')) {
                rival = new URLSearchParams(window.location.hash.split('?')[1]).get('rival');
            }
        }
        return rival || undefined;
    }, [searchParams]);

    const validTabs: TrainerTab[] = ['bodymap', 'versus'];
    const normalizedParamTab: TrainerTab | null = (paramTab as string) === 'audit' ? 'bodymap' : (validTabs.includes(paramTab as TrainerTab) ? (paramTab as TrainerTab) : null);
    const initialTab: TrainerTab = normalizedParamTab || 'bodymap';
    const [activeTab, setActiveTab] = useState<TrainerTab>(initialTab);
    const [selectedMuscle, setSelectedMuscle] = useState<MuscleBenchmark | null>(null);
    const [isMapModalOpen, setIsMapModalOpen] = useState(false);
    const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);
    const [isQuickDuelOpen, setIsQuickDuelOpen] = useState(false);
    const [copiedLink, setCopiedLink] = useState(false);

    useEffect(() => {
        if (normalizedParamTab) {
            setActiveTab(normalizedParamTab);
        }
    }, [normalizedParamTab]);

    const bodyMapContainerRef = useRef<HTMLDivElement>(null);

    const activePayload = encodedData || resolvedData;

    const athleteData = useMemo(() => {
        if (!activePayload) return null;
        return decodeAthleteData(activePayload);
    }, [activePayload]);

    const records: MeasurementRecord[] = useMemo(() => {
        if (!athleteData) return [];
        let list: MeasurementRecord[] = [];
        if (athleteData.records && athleteData.records.length > 0) {
            list = [...athleteData.records];
        } else if (athleteData.measurements) {
            list = [{
                id: 'shared-record-1',
                userId: 'shared-user',
                date: athleteData.date || new Date().toISOString(),
                measurements: athleteData.measurements,
                notes: athleteData.notes || '',
                metadata: { condition: 'fasted' }
            }];
        }
        return list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [athleteData]);

    const [selectedRecordId, setSelectedRecordId] = useState<string>('');

    // Active record
    const activeRecordIndex = useMemo(() => {
        if (!records.length) return -1;
        if (!selectedRecordId) return records.length - 1;
        const idx = records.findIndex(r => r.id === selectedRecordId);
        return idx >= 0 ? idx : records.length - 1;
    }, [records, selectedRecordId]);

    const activeRecord = useMemo(() => {
        if (activeRecordIndex < 0) return null;
        return records[activeRecordIndex];
    }, [records, activeRecordIndex]);

    const previousRecord = useMemo(() => {
        if (activeRecordIndex > 0) {
            return records[activeRecordIndex - 1];
        }
        return undefined;
    }, [records, activeRecordIndex]);

    // Connector leader lines for Body Map
    const lines = useMeasurementLines(
        bodyMapContainerRef as React.RefObject<HTMLElement>,
        (activeRecord?.measurements || {}) as unknown as BodyMeasurements,
        athleteData?.sex || 'male'
    );

    const diagnosis = useMemo(() => {
        if (!activeRecord) return null;
        return generateTacticalDiagnosis(activeRecord, previousRecord);
    }, [activeRecord, previousRecord]);

    const analysis = useMemo(() => {
        if (!activeRecord || !athleteData) return null;
        return computeComprehensiveAnalysis(activeRecord.measurements, athleteData.sex);
    }, [activeRecord, athleteData]);

    // Calculate FFMI
    const ffmi = useMemo(() => {
        if (!activeRecord?.measurements?.weight || !activeRecord?.measurements?.height) return null;
        const weight = activeRecord.measurements.weight;
        const heightM = activeRecord.measurements.height / 100;
        const bf = activeRecord.measurements.bodyFat || 15;
        const leanMass = weight * (1 - bf / 100);
        const rawFfmi = leanMass / (heightM * heightM);
        const normalizedFfmi = rawFfmi + 6.1 * (1.8 - heightM);
        return parseFloat(normalizedFfmi.toFixed(1));
    }, [activeRecord]);

    // V-Taper ratio
    const vTaperRatio = useMemo(() => {
        const chest = activeRecord?.measurements?.pecho || 0;
        const waist = activeRecord?.measurements?.waist || 0;
        if (chest > 0 && waist > 0) {
            return parseFloat((chest / waist).toFixed(2));
        }
        return null;
    }, [activeRecord]);

    // Best Arm
    const bestArm = useMemo(() => {
        const arm = activeRecord?.measurements?.arm;
        if (!arm) return null;
        if (typeof arm === 'object') {
            return Math.max(arm.left || 0, arm.right || 0);
        }
        return arm;
    }, [activeRecord]);

    const handleShareOrCopy = async () => {
        let shareUrl = window.location.href;
        try {
            const short = await shortenUrl(shareUrl);
            if (short && short.length < shareUrl.length) {
                shareUrl = short;
            }
        } catch {}

        if (typeof navigator !== 'undefined' && navigator.share) {
            try {
                await navigator.share({
                    title: `Ficha Antropométrica de ${athleteData?.name || 'Atleta'}`,
                    text: `📊 Mira la evolución física y ratios áureos en Hypertrophy Tracker:`,
                    url: shareUrl
                });
                return;
            } catch (err) {
                // user cancelled or dismissed
            }
        }
        navigator.clipboard.writeText(shareUrl);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2200);
    };

    if (isLoadingShort) {
        return (
            <div className="loading-screen" style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                <Activity size={40} className="animate-spin" style={{ color: '#fbbf24' }} />
                <div style={{ color: '#94a3b8', fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>
                    Cargando Ficha Antropométrica...
                </div>
            </div>
        );
    }

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
                    Ficha No Encontrada o Enlace Incompleto
                </h2>
                <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.5rem' }}>
                    El enlace no contiene datos válidos de telemetría. Solicita al atleta que genere un nuevo enlace o código QR.
                </p>
                <button
                    onClick={() => navigate('/')}
                    className="btn-primary"
                >
                    Ir a Hypertrophy Tracker
                </button>
            </div>
        );
    }

    const { name, sex } = athleteData;
    const { measurements, date } = activeRecord;
    const prevM = previousRecord?.measurements;

    // Avatar initials
    const initials = name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() || 'AT';

    return (
        <div className="public-dossier-container animate-fade">
            {/* HERO ATHLETE DOSSIER CARD */}
            <div className="hero-dossier-card">
                <div className="hero-dossier-header">
                    <div className="hero-athlete-identity">
                        <div className="hero-athlete-avatar">
                            {initials}
                        </div>
                        <div>
                            <div className="hero-badge-strip">
                                <span className="hero-pill-badge hero-pill-amber">
                                    <Sparkles size={11} /> Telemetría Verificada
                                </span>
                                {analysis?.overallScore && (
                                    <span className="hero-pill-badge hero-pill-blue">
                                        <Award size={11} /> {analysis.overallScore}% Potencial Genético
                                    </span>
                                )}
                                {ffmi && (
                                    <span className="hero-pill-badge hero-pill-green">
                                        <Flame size={11} /> FFMI {ffmi}
                                    </span>
                                )}
                            </div>
                            <h1 className="hero-athlete-name">{name}</h1>
                        </div>
                    </div>

                    <div className="hero-action-buttons">
                        {/* Selector if multiple historical records */}
                        {records.length > 1 && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(0, 0, 0, 0.4)', border: '1px solid rgba(255, 255, 255, 0.1)', borderRadius: '12px', padding: '0.35rem 0.75rem' }}>
                                <Calendar size={14} style={{ color: '#fbbf24' }} />
                                <select
                                    value={activeRecord.id}
                                    onChange={(e) => setSelectedRecordId(e.target.value)}
                                    style={{
                                        background: 'transparent',
                                        border: 'none',
                                        color: '#f8fafc',
                                        fontFamily: 'var(--font-mono)',
                                        fontSize: '0.78rem',
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
                            onClick={() => setIsQuickDuelOpen(true)}
                            className="hero-btn hero-btn-primary"
                            title="Retar al atleta al instante con 4 medidas"
                        >
                            <Swords size={16} />
                            <span>Retar en 10s</span>
                        </button>

                        <button
                            onClick={() => setIsStoryModalOpen(true)}
                            className="hero-btn hero-btn-secondary"
                            title="Generar Story Card vertical 9:16 para Instagram"
                        >
                            <Sparkles size={16} style={{ color: '#fbbf24' }} />
                            <span>Story 9:16</span>
                        </button>

                        <button
                            onClick={handleShareOrCopy}
                            className="hero-btn hero-btn-secondary"
                            title="Compartir enlace en Instagram o WhatsApp"
                        >
                            {copiedLink ? <Check size={16} style={{ color: '#10b981' }} /> : <Share2 size={16} />}
                            <span>{copiedLink ? '¡Link Copiado!' : 'Compartir'}</span>
                        </button>

                        <button
                            onClick={() => generateAthletePDFReport({
                                latestRecord: activeRecord,
                                previousRecord,
                                records,
                                userName: name,
                                sex
                            })}
                            className="hero-btn hero-btn-secondary"
                            title="Descargar dossier médico-deportivo en PDF"
                        >
                            <Download size={16} />
                            <span>PDF</span>
                        </button>
                    </div>
                </div>

                {/* STATS TILES GRID */}
                <div className="hero-stats-grid">
                    <div className="hero-stat-tile">
                        <span className="hero-stat-lbl">Fecha</span>
                        <span className="hero-stat-val" style={{ fontSize: '1.05rem', color: '#fbbf24' }}>
                            {new Date(date).toLocaleDateString('es-ES')}
                        </span>
                        <span className="hero-stat-sub">Auditoría</span>
                    </div>

                    <div className="hero-stat-tile">
                        <span className="hero-stat-lbl">Peso</span>
                        <span className="hero-stat-val">{measurements.weight || '--'}<span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#94a3b8' }}> kg</span></span>
                        <span className="hero-stat-sub">Balanza</span>
                    </div>

                    <div className="hero-stat-tile">
                        <span className="hero-stat-lbl">Estatura</span>
                        <span className="hero-stat-val">{measurements.height || '--'}<span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#94a3b8' }}> cm</span></span>
                        <span className="hero-stat-sub">Chasis Óseo</span>
                    </div>

                    <div className="hero-stat-tile">
                        <span className="hero-stat-lbl">% Grasa</span>
                        <span className="hero-stat-val" style={{ color: '#38bdf8' }}>{measurements.bodyFat ? `${measurements.bodyFat}%` : '--'}</span>
                        <span className="hero-stat-sub">Fórmula Navy</span>
                    </div>

                    <div className="hero-stat-tile">
                        <span className="hero-stat-lbl">Brazo Flexionado</span>
                        <span className="hero-stat-val" style={{ color: '#fbbf24' }}>{bestArm ? `${bestArm} cm` : '--'}</span>
                        <span className="hero-stat-sub">Pico Bíceps</span>
                    </div>

                    <div className="hero-stat-tile">
                        <span className="hero-stat-lbl">Ratio V-Taper</span>
                        <span className="hero-stat-val" style={{ color: '#10b981' }}>{vTaperRatio ? `${vTaperRatio}x` : '--'}</span>
                        <span className="hero-stat-sub">Áureo: 1.62x</span>
                    </div>
                </div>
            </div>

            {/* TAB NAVIGATION */}
            <div className="public-tabs-nav">
                <button
                    onClick={() => setActiveTab('bodymap')}
                    className={`public-tab-btn ${activeTab === 'bodymap' ? 'active' : ''}`}
                >
                    <User size={15} />
                    <span>Silueta, Ficha 360° & Límites Genéticos</span>
                </button>

                <button
                    onClick={() => setActiveTab('versus')}
                    className={`public-tab-btn ${activeTab === 'versus' ? 'active' : ''}`}
                >
                    <Swords size={15} />
                    <span>Duelo Versus (Comparativa 1v1)</span>
                </button>
            </div>

            {/* TAB 1: UNIFIED REPORT (BODY MAP, HUD, TACTICAL DIAGNOSIS, CASEY BUTT & REEVES RATIOS) */}
            {activeTab === 'bodymap' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }} className="animate-fade">
                    {/* 1. Body Map & HUD Columns */}
                    <div
                        ref={bodyMapContainerRef}
                        className="body-map-container glass"
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                            gap: '1.5rem',
                            padding: '1.5rem',
                            position: 'relative'
                        }}
                    >
                        {/* SVG Connector lines */}
                        <svg
                            className="measurement-lines-svg"
                            style={{
                                position: 'absolute',
                                inset: 0,
                                width: '100%',
                                height: '100%',
                                pointerEvents: 'none',
                                zIndex: 1
                            }}
                        >
                            {lines.map((line, idx) => (
                                <g key={idx}>
                                    <line
                                        x1={line.x1}
                                        y1={line.y1}
                                        x2={line.x2}
                                        y2={line.y2}
                                        stroke="rgba(245, 158, 11, 0.45)"
                                        strokeWidth="1.5"
                                        strokeDasharray="3 3"
                                    />
                                    <circle cx={line.x1} cy={line.y1} r="3" fill="#fbbf24" />
                                    <circle cx={line.x2} cy={line.y2} r="3" fill="#fbbf24" />
                                </g>
                            ))}
                        </svg>

                        {/* LEFT COLUMN: TORSO & CORE */}
                        <div className="editor-left hud-column" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="hud-section-title" style={{ color: '#fbbf24', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', fontWeight: 800, letterSpacing: '1px' }}>
                                TRONCO & CORE
                            </div>
                            <ReadOnlyHudCard id="input-neck" label="Cuello" value={measurements.neck || 0} previousValue={prevM?.neck} />
                            <ReadOnlyHudCard id="input-pecho" label="Pecho (Pectorales)" value={measurements.pecho || 0} previousValue={prevM?.pecho} />
                            <ReadOnlyHudCard id="input-back" label="Espalda / Hombros" value={measurements.back || 0} previousValue={prevM?.back} />
                            <ReadOnlyHudCard id="input-waist" label="Cintura (Abdomen)" value={measurements.waist || 0} previousValue={prevM?.waist} />
                            <ReadOnlyHudCard id="input-hips" label="Cadera (Glúteos)" value={measurements.hips || 0} previousValue={prevM?.hips} />
                        </div>

                        {/* CENTER SILHOUETTE */}
                        <div className="editor-center" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', minHeight: '380px' }}>
                            <div style={{ marginBottom: '1rem', width: '100%', display: 'flex', justifyContent: 'center' }}>
                                <button
                                    type="button"
                                    className="btn-map-link"
                                    onClick={() => setIsMapModalOpen(true)}
                                    style={{
                                        background: 'rgba(245, 158, 11, 0.15)',
                                        border: '1px solid rgba(245, 158, 11, 0.4)',
                                        color: '#fbbf24',
                                        padding: '0.5rem 1rem',
                                        borderRadius: '12px',
                                        fontSize: '0.75rem',
                                        fontFamily: 'var(--font-mono)',
                                        fontWeight: 800,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <MapIcon size={16} />
                                    <span>MAPA ANATÓMICO</span>
                                </button>
                            </div>

                            <DynamicSilhouette
                                measurements={measurements}
                                sex={sex}
                            />
                        </div>

                        {/* RIGHT COLUMN: UPPER & LOWER LIMBS */}
                        <div className="editor-right hud-column" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div className="hud-section-title" style={{ color: '#fbbf24', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', fontWeight: 800, letterSpacing: '1px' }}>
                                EXTREMIDADES SUP.
                            </div>
                            <ReadOnlyHudCard id="input-arm" label="Brazo (Bíceps)" value={measurements.arm} previousValue={prevM?.arm} />
                            <ReadOnlyHudCard id="input-forearm" label="Antebrazo" value={measurements.forearm} previousValue={prevM?.forearm} />
                            <ReadOnlyHudCard id="input-wrist" label="Muñeca" value={measurements.wrist} previousValue={prevM?.wrist} />

                            <div className="hud-section-title" style={{ color: '#fbbf24', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', fontWeight: 800, letterSpacing: '1px', marginTop: '0.5rem' }}>
                                EXTREMIDADES INF.
                            </div>
                            <ReadOnlyHudCard id="input-thigh" label="Muslo" value={measurements.thigh} previousValue={prevM?.thigh} />
                            <ReadOnlyHudCard id="input-calf" label="Pantorrilla" value={measurements.calf} previousValue={prevM?.calf} />
                            <ReadOnlyHudCard id="input-ankle" label="Tobillo" value={measurements.ankle} previousValue={prevM?.ankle} />
                        </div>
                    </div>

                    {/* 2. Tactical Biomechanical Diagnosis */}
                    {diagnosis && (
                        <div className="card glass" style={{
                            padding: '1.25rem 1.5rem',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                            background: 'linear-gradient(135deg, rgba(16, 20, 31, 0.95), rgba(9, 12, 18, 0.98))'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                                <span style={{ fontSize: '0.75rem', color: '#fbbf24', fontFamily: 'var(--font-mono)', fontWeight: 800 }}>
                                    DIAGNÓSTICO TÁCTICO BIOMECÁNICO
                                </span>
                                <span style={{ padding: '2px 8px', borderRadius: '6px', background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', fontSize: '0.7rem', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                                    {diagnosis.statusText}
                                </span>
                            </div>
                            <h4 style={{ margin: '0 0 0.4rem 0', fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-head)' }}>
                                {diagnosis.headline}
                            </h4>
                            <p style={{ margin: '0 0 0.75rem 0', fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                                {diagnosis.summary}
                            </p>
                            <div style={{ padding: '0.65rem 0.85rem', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)', fontSize: '0.8rem', color: '#fbbf24' }}>
                                <strong>DIRECTRIZ SUGERIDA:</strong> {diagnosis.actionableAdvice}
                            </div>
                        </div>
                    )}

                    {/* 3. Casey Butt Genetic Potential Benchmarks */}
                    {analysis && (
                        <section style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Scale size={20} style={{ color: 'var(--primary-color)' }} />
                                    <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-head)' }}>
                                        Límites Genéticos Naturales (Modelo Casey Butt)
                                    </h3>
                                </div>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                                    💡 Haz click en cualquier grupo para auditar su desarrollo
                                </span>
                            </div>

                            <div className="benchmarks-grid">
                                {analysis.muscleBenchmarks.map((bm) => (
                                    <div
                                        key={bm.key}
                                        onClick={() => setSelectedMuscle(bm)}
                                        style={{ cursor: 'pointer' }}
                                        title={`Auditar desarrollo de ${bm.label}`}
                                    >
                                        <BenchmarkCard benchmark={bm} />
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* 4. Steve Reeves & Frank Zane Golden Proportions */}
                    {analysis && (
                        <section style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Sparkles size={20} style={{ color: 'var(--primary-color)' }} />
                                <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-head)' }}>
                                    Ratios Clásicos & Cánones de Simetría (Steve Reeves / Frank Zane)
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

            {/* TAB 3: VERSUS COMPARISON */}
            {activeTab === 'versus' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="animate-fade">
                    <AthleteComparisonCard
                        currentRecord={activeRecord || undefined}
                        records={records}
                        sex={sex}
                        initialRivalId={paramRival}
                    />
                </div>
            )}

            {/* UNIFIED CALL TO ACTION BANNER */}
            <div className="viral-signup-banner">
                <div className="viral-signup-content">
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#fbbf24', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', fontWeight: 800, textTransform: 'uppercase' }}>
                        <Sparkles size={14} />
                        <span>HYPERTROPHY TRACKER &bull; AUDITORÍA BIOMECÁNICA</span>
                    </div>
                    <h3 className="viral-signup-title">
                        ¿Quieres retar a {name} o auditar tu propio desarrollo muscular?
                    </h3>
                    <p className="viral-signup-desc">
                        Ingresa tus medidas antropométricas para calcular tus Ratios Áureos de Reeves, comparar asimetrías bilaterales y proyectar tu límite genético natural.
                    </p>
                </div>

                <div className="viral-signup-actions">
                    <button
                        onClick={() => setIsQuickDuelOpen(true)}
                        className="viral-cta-btn viral-cta-primary"
                    >
                        <Swords size={18} />
                        <span>⚔️ Retar a {name} (Ingresar Medidas)</span>
                    </button>
                    <button
                        onClick={() => navigate('/')}
                        className="viral-cta-btn viral-cta-secondary"
                    >
                        <Flame size={18} />
                        <span>Ir a Hypertrophy Tracker &rarr;</span>
                    </button>
                </div>
            </div>

            {/* Individual Muscle History Modal */}
            {selectedMuscle && (
                <MuscleHistoryModal
                    benchmark={selectedMuscle}
                    records={records}
                    onClose={() => setSelectedMuscle(null)}
                />
            )}

            {/* Anatomical Muscle Map Guide Modal */}
            <MapModal
                isOpen={isMapModalOpen}
                onClose={() => setIsMapModalOpen(false)}
                title="Mapa de Medición Muscular"
            />

            {/* Athlete Story Card 9:16 Modal */}
            {isStoryModalOpen && activeRecord && (
                <AthleteStoryCardModal
                    record={activeRecord}
                    records={records}
                    userName={name}
                    sex={sex}
                    isOpen={isStoryModalOpen}
                    onClose={() => setIsStoryModalOpen(false)}
                />
            )}

            {/* Quick Duel 1v1 Challenge Modal */}
            {isQuickDuelOpen && activeRecord && (
                <QuickDuelChallengeModal
                    isOpen={isQuickDuelOpen}
                    onClose={() => setIsQuickDuelOpen(false)}
                    targetRecord={activeRecord}
                    targetName={name}
                    targetSex={sex}
                />
            )}
        </div>
    );
};
