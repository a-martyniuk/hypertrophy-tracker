import React, { useState, useMemo } from 'react';
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    Tooltip as RechartsTooltip,
    Legend
} from 'recharts';
import {
    Swords,
    QrCode,
    Sparkles,
    Share2,
    Check,
    X
} from 'lucide-react';
import type { MeasurementRecord } from '../../types/measurements';
import {
    CANONICAL_PRESETS,
    compareAthletes,
    type ComparisonProfile
} from '../../utils/athleteComparison';
import { decodeAthleteData } from '../../utils/shareEncoder';
import './AthleteComparisonCard.css';

interface Props {
    currentRecord?: MeasurementRecord;
    records?: MeasurementRecord[];
    sex?: 'male' | 'female';
}

export const AthleteComparisonCard: React.FC<Props> = ({
    currentRecord,
    records = [],
    sex = 'male'
}) => {
    // Current user's profile
    const profileA: ComparisonProfile = useMemo(() => {
        const measurements = currentRecord?.measurements || {};
        return {
            id: 'current_user',
            name: 'Tú (Actual)',
            title: 'Medición Antropométrica Actual',
            era: currentRecord?.date ? new Date(currentRecord.date).toLocaleDateString() : 'Sesión Activa',
            sex: sex,
            date: currentRecord?.date,
            measurements
        };
    }, [currentRecord, sex]);

    // Available comparison options
    const [selectedBId, setSelectedBId] = useState<string>('steve_reeves_1950');
    const [customProfile, setCustomProfile] = useState<ComparisonProfile | null>(null);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importInput, setImportInput] = useState('');
    const [importError, setImportError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    // Build profile list for opponent B
    const profileB: ComparisonProfile = useMemo(() => {
        // 1. Custom imported athlete
        if (selectedBId === 'custom_imported' && customProfile) {
            return customProfile;
        }

        // 2. Preset canonical athletes
        const preset = CANONICAL_PRESETS.find((p) => p.id === selectedBId);
        if (preset) return preset;

        // 3. Past user session
        if (selectedBId.startsWith('past_')) {
            const recId = selectedBId.replace('past_', '');
            const rec = records.find((r) => r.id === recId);
            if (rec) {
                return {
                    id: selectedBId,
                    name: `Tú (${new Date(rec.date).toLocaleDateString()})`,
                    title: 'Registro Histórico Propio',
                    era: new Date(rec.date).toLocaleDateString(),
                    sex: sex,
                    date: rec.date,
                    measurements: rec.measurements || {}
                };
            }
        }

        // Fallback to Steve Reeves
        return CANONICAL_PRESETS[0];
    }, [selectedBId, customProfile, records, sex]);

    // Full comparison analysis
    const comparison = useMemo(() => {
        return compareAthletes(profileA, profileB);
    }, [profileA, profileB]);

    const { metrics, radarData, verdict } = comparison;

    // Handle importing payload
    const handleImportAthlete = () => {
        setImportError(null);
        if (!importInput.trim()) {
            setImportError('Por favor pega un enlace o payload Base64 válido.');
            return;
        }

        let rawPayload = importInput.trim();
        // If it's a URL (e.g. https://.../#/share?d=PAYLOAD)
        if (rawPayload.includes('?d=')) {
            const parts = rawPayload.split('?d=');
            rawPayload = parts[1].split('&')[0];
        } else if (rawPayload.includes('#')) {
            const hashParts = rawPayload.split('#');
            const sub = hashParts[1] || '';
            if (sub.includes('?d=')) {
                rawPayload = sub.split('?d=')[1].split('&')[0];
            }
        }

        const decoded = decodeAthleteData(rawPayload);
        if (!decoded || !decoded.measurements) {
            setImportError('No se pudo decodificar el atleta. Verifica el formato del payload.');
            return;
        }

        const imported: ComparisonProfile = {
            id: 'custom_imported',
            name: decoded.name || 'Atleta Invitado',
            title: 'Atleta Importado (QR / Enlace)',
            era: decoded.date ? new Date(decoded.date).toLocaleDateString() : 'Telemetría Externa',
            sex: decoded.sex || 'male',
            date: decoded.date,
            measurements: decoded.measurements,
            isCustom: true
        };

        setCustomProfile(imported);
        setSelectedBId('custom_imported');
        setIsImportModalOpen(false);
        setImportInput('');
    };

    // Quick copy battle summary
    const handleCopySummary = () => {
        const text = `🏆 Duelo Táctico Hypertrophy Tracker Pro:
${profileA.name} vs ${profileB.name}
Marcador: ${verdict.scoreA} vs ${verdict.scoreB}
• V-Taper: ${verdict.vTaperA}x vs ${verdict.vTaperB}x
• Techo Genético: ${verdict.geneticCeilingA}% vs ${verdict.geneticCeilingB}%
• Tríada Reeves: ${verdict.triadScoreA}% vs ${verdict.triadScoreB}%
Dictamen: ${verdict.summary}
👉 Medite en: https://www.alexismartyniuk.com.ar/hypertrophyracker`;

        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        });
    };

    return (
        <div className="versus-container animate-fade">
            {/* Header & Match Control Bar */}
            <div className="versus-header-card">
                <div className="versus-top-bar">
                    <div className="versus-title-box">
                        <div className="versus-badge-icon">
                            <Swords size={22} />
                        </div>
                        <div className="versus-title-text">
                            <h3>Duelo & Comparativa Táctica Head-to-Head</h3>
                            <p>Auditoría anatómica relativa y radar de proporciones enfrentadas en tiempo real.</p>
                        </div>
                    </div>

                    <div className="versus-controls">
                        <select
                            value={selectedBId}
                            onChange={(e) => setSelectedBId(e.target.value)}
                            className="versus-select"
                        >
                            <optgroup label="Físicos Canónicos de Referencia">
                                {CANONICAL_PRESETS.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name} ({p.era})
                                    </option>
                                ))}
                            </optgroup>

                            {records.length > 1 && (
                                <optgroup label="Tus Sesiones Históricas Anteriores">
                                    {records.slice(1, 6).map((r) => (
                                        <option key={r.id} value={`past_${r.id}`}>
                                            Tú ({new Date(r.date).toLocaleDateString()})
                                        </option>
                                    ))}
                                </optgroup>
                            )}

                            {customProfile && (
                                <optgroup label="Atletas Importados">
                                    <option value="custom_imported">
                                        ⚡ {customProfile.name} (QR / Enlace)
                                    </option>
                                </optgroup>
                            )}
                        </select>

                        <button
                            onClick={() => setIsImportModalOpen(true)}
                            className="versus-btn-secondary"
                            title="Importar payload QR o enlace de otro atleta"
                        >
                            <QrCode size={14} />
                            <span>Importar Atleta</span>
                        </button>

                        <button
                            onClick={handleCopySummary}
                            className="versus-btn-secondary"
                            title="Copiar resultado del enfrentamiento"
                        >
                            {copied ? <Check size={14} style={{ color: '#34d399' }} /> : <Share2 size={14} />}
                            <span>{copied ? '¡Copiado!' : 'Compartir Duelo'}</span>
                        </button>
                    </div>
                </div>

                {/* Scoreboard Banner */}
                <div className="versus-match-banner">
                    <div className="athlete-fighter fighter-a">
                        <span className="fighter-tag">Atleta A (Tú)</span>
                        <span className="fighter-name">{profileA.name}</span>
                        <span className="fighter-era">{profileA.era}</span>
                    </div>

                    <div className="versus-vs-badge">
                        <div className="vs-circle">VS</div>
                        <div className="vs-score-tally">
                            <span className="score-a">{verdict.scoreA}</span>
                            <span style={{ color: 'rgba(255,255,255,0.3)', margin: '0 4px' }}>:</span>
                            <span className="score-b">{verdict.scoreB}</span>
                        </div>
                    </div>

                    <div className="athlete-fighter fighter-b">
                        <span className="fighter-tag">Atleta B (Rival / Ref)</span>
                        <span className="fighter-name">{profileB.name}</span>
                        <span className="fighter-era">{profileB.era}</span>
                    </div>
                </div>
            </div>

            {/* Core Grid: Dual Radar + Key Symmetries */}
            <div className="versus-core-grid">
                {/* 1. Superimposed 360° Dual Radar Chart */}
                <div className="versus-card">
                    <div className="versus-card-title">
                        <span>Radar de Armonía Superpuesto</span>
                        <span className="badge">6 EJES BIOMECÁNICOS</span>
                    </div>

                    <div style={{ width: '100%', height: '300px' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                <PolarGrid stroke="rgba(255, 255, 255, 0.1)" strokeDasharray="3 3" />
                                <PolarAngleAxis
                                    dataKey="aspect"
                                    tick={{ fill: '#cbd5e1', fontSize: 10, fontFamily: 'monospace', fontWeight: 600 }}
                                />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 8 }} />

                                {/* Athlete A: Cyan Neon */}
                                <Radar
                                    name={profileA.name}
                                    dataKey="scoreA"
                                    stroke="#06b6d4"
                                    strokeWidth={2.5}
                                    fill="#06b6d4"
                                    fillOpacity={0.25}
                                />

                                {/* Athlete B: Amber Neon */}
                                <Radar
                                    name={profileB.name}
                                    dataKey="scoreB"
                                    stroke="#f59e0b"
                                    strokeWidth={2.5}
                                    fill="#f59e0b"
                                    fillOpacity={0.25}
                                />

                                <Legend
                                    wrapperStyle={{ fontSize: '0.75rem', fontFamily: 'monospace', paddingTop: '10px' }}
                                />

                                <RechartsTooltip
                                    content={({ payload }) => {
                                        if (payload && payload.length) {
                                            const d = payload[0].payload as (typeof radarData)[0];
                                            return (
                                                <div style={{ background: '#090a0f', border: '1px solid rgba(255, 255, 255, 0.2)', padding: '0.75rem', borderRadius: '10px', fontSize: '0.75rem', fontFamily: 'monospace', color: '#ffffff' }}>
                                                    <div style={{ fontWeight: 800, color: '#ffffff', marginBottom: '4px' }}>{d.aspect}</div>
                                                    <div style={{ color: '#22d3ee' }}>{profileA.name}: <strong>{d.valA} ({d.scoreA}%)</strong></div>
                                                    <div style={{ color: '#fbbf24' }}>{profileB.name}: <strong>{d.valB} ({d.scoreB}%)</strong></div>
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

                {/* 2. Key Pillars & Relative Symmetries */}
                <div className="versus-card">
                    <div className="versus-card-title">
                        <span>Pilares de Proporción & Simetría</span>
                        <span className="badge">NORMALIZACIÓN GENÉTICA</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {/* V-Taper Ratio */}
                        <div className="pillar-row">
                            <div className="pillar-header">
                                <span>Ratio V-Taper (Pecho / Cintura)</span>
                                <span style={{ color: verdict.vTaperA >= verdict.vTaperB ? '#22d3ee' : '#fbbf24' }}>
                                    {verdict.vTaperA >= verdict.vTaperB ? `+${(verdict.vTaperA - verdict.vTaperB).toFixed(2)}x ${profileA.name}` : `+${(verdict.vTaperB - verdict.vTaperA).toFixed(2)}x ${profileB.name}`}
                                </span>
                            </div>
                            <div className="pillar-values">
                                <span style={{ color: '#22d3ee' }}>{verdict.vTaperA}x</span>
                                <span style={{ color: '#fbbf24' }}>{verdict.vTaperB}x</span>
                            </div>
                            <div className="pillar-bars">
                                <div className="bar-track">
                                    <div className="bar-fill-a" style={{ width: `${Math.min(100, (verdict.vTaperA / 1.7) * 100)}%` }} />
                                </div>
                                <div className="bar-track">
                                    <div className="bar-fill-b" style={{ width: `${Math.min(100, (verdict.vTaperB / 1.7) * 100)}%` }} />
                                </div>
                            </div>
                        </div>

                        {/* % Casey Butt Genetic Ceiling */}
                        <div className="pillar-row">
                            <div className="pillar-header">
                                <span>% Límite Genético Natural (Casey Butt)</span>
                                <span style={{ color: verdict.geneticCeilingA >= verdict.geneticCeilingB ? '#22d3ee' : '#fbbf24' }}>
                                    {verdict.geneticCeilingA >= verdict.geneticCeilingB ? `${profileA.name} más cerca` : `${profileB.name} más cerca`}
                                </span>
                            </div>
                            <div className="pillar-values">
                                <span style={{ color: '#22d3ee' }}>{verdict.geneticCeilingA}%</span>
                                <span style={{ color: '#fbbf24' }}>{verdict.geneticCeilingB}%</span>
                            </div>
                            <div className="pillar-bars">
                                <div className="bar-track">
                                    <div className="bar-fill-a" style={{ width: `${verdict.geneticCeilingA}%` }} />
                                </div>
                                <div className="bar-track">
                                    <div className="bar-fill-b" style={{ width: `${verdict.geneticCeilingB}%` }} />
                                </div>
                            </div>
                        </div>

                        {/* Steve Reeves Triad Symmetry */}
                        <div className="pillar-row">
                            <div className="pillar-header">
                                <span>Simetría Tríada Steve Reeves (1:1:1)</span>
                                <span style={{ color: verdict.triadScoreA >= verdict.triadScoreB ? '#22d3ee' : '#fbbf24' }}>
                                    {verdict.triadScoreA >= verdict.triadScoreB ? `+${verdict.triadScoreA - verdict.triadScoreB}% Armonía` : `+${verdict.triadScoreB - verdict.triadScoreA}% Armonía`}
                                </span>
                            </div>
                            <div className="pillar-values">
                                <span style={{ color: '#22d3ee' }}>{verdict.triadScoreA}%</span>
                                <span style={{ color: '#fbbf24' }}>{verdict.triadScoreB}%</span>
                            </div>
                            <div className="pillar-bars">
                                <div className="bar-track">
                                    <div className="bar-fill-a" style={{ width: `${verdict.triadScoreA}%` }} />
                                </div>
                                <div className="bar-track">
                                    <div className="bar-fill-b" style={{ width: `${verdict.triadScoreB}%` }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Head-to-Head Detailed Telemetry Table */}
            <div className="versus-table-card">
                <div className="versus-card-title" style={{ marginBottom: '0.75rem' }}>
                    <span>Matriz Detallada de Perímetros & Deltas</span>
                    <span className="badge">HEAD-TO-HEAD AUDIT</span>
                </div>

                <table className="versus-table">
                    <thead>
                        <tr>
                            <th>Métrica Antropométrica</th>
                            <th style={{ color: '#22d3ee' }}>{profileA.name}</th>
                            <th style={{ color: '#fbbf24' }}>{profileB.name}</th>
                            <th>Diferencia ($\Delta$)</th>
                            <th>Ventaja Táctica</th>
                        </tr>
                    </thead>
                    <tbody>
                        {metrics.map((m) => {
                            const isWinA = m.winner === 'A';
                            const isWinB = m.winner === 'B';
                            return (
                                <tr key={m.key}>
                                    <td style={{ fontWeight: 600 }}>
                                        {m.label}
                                        {m.insight && (
                                            <span style={{ display: 'block', fontSize: '0.7rem', color: '#64748b', fontWeight: 400 }}>
                                                {m.insight}
                                            </span>
                                        )}
                                    </td>
                                    <td className="val-cell-a">
                                        {m.valA > 0 ? `${m.valA} ${m.unit}` : '--'}
                                    </td>
                                    <td className="val-cell-b">
                                        {m.valB > 0 ? `${m.valB} ${m.unit}` : '--'}
                                    </td>
                                    <td>
                                        <span className={`delta-tag ${isWinA ? 'win-a' : isWinB ? 'win-b' : 'tie'}`}>
                                            {m.diff > 0 ? `+${m.diff}` : `${m.diff}`} {m.unit} ({m.percentDiff > 0 ? `+${m.percentDiff}%` : `${m.percentDiff}%`})
                                        </span>
                                    </td>
                                    <td>
                                        {isWinA ? (
                                            <span style={{ color: '#22d3ee', fontWeight: 700, fontSize: '0.75rem' }}>
                                                ★ {profileA.name}
                                            </span>
                                        ) : isWinB ? (
                                            <span style={{ color: '#fbbf24', fontWeight: 700, fontSize: '0.75rem' }}>
                                                ★ {profileB.name}
                                            </span>
                                        ) : (
                                            <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                                                = Empate
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Tactical AI Verdict */}
            <div className="versus-verdict-card">
                <div className="verdict-header">
                    <Sparkles size={16} />
                    <span>DICTAMEN TÁCTICO // {verdict.title}</span>
                </div>
                <p className="verdict-desc">{verdict.summary}</p>
            </div>

            {/* Import Payload Modal */}
            {isImportModalOpen && (
                <div className="import-modal-overlay" onClick={() => setIsImportModalOpen(false)}>
                    <div className="import-modal-box" onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h4 style={{ margin: 0, color: '#ffffff', fontSize: '1rem', fontWeight: 800, fontFamily: 'monospace' }}>
                                Importar Atleta (QR / Enlace URL)
                            </h4>
                            <button
                                onClick={() => setIsImportModalOpen(false)}
                                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
                            Pega aquí el enlace de compartición o el payload Base64 generado desde la app de otro atleta para iniciar la comparativa instantánea.
                        </p>

                        <textarea
                            value={importInput}
                            onChange={(e) => setImportInput(e.target.value)}
                            placeholder="Pega la URL de reporte o el código Base64 aquí..."
                            className="import-textarea"
                        />

                        {importError && (
                            <div style={{ color: '#f87171', fontSize: '0.75rem', fontWeight: 600 }}>
                                ⚠️ {importError}
                            </div>
                        )}

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                            <button
                                onClick={() => setIsImportModalOpen(false)}
                                className="versus-btn-secondary"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleImportAthlete}
                                className="versus-btn-secondary"
                                style={{ background: '#f59e0b', color: '#000000', borderColor: '#f59e0b', fontWeight: 800 }}
                            >
                                Cargar & Comparar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
