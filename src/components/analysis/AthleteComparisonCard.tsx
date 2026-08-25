import React, { useState, useMemo, useEffect, useContext } from 'react';
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
    Sparkles,
    Share2,
    Check,
    Users,
    Ruler,
    Calendar,
    Flame,
    Zap
} from 'lucide-react';
import type { BodyMeasurements, MeasurementRecord } from '../../types/measurements';
import { ProfileContext } from '../../context/ProfileContext';
import {
    CANONICAL_PRESETS,
    compareAthletes,
    type ComparisonProfile
} from '../../utils/athleteComparison';
import { fetchCommunityAthletes } from '../../services/communityAthleteService';
import './AthleteComparisonCard.css';

interface Props {
    currentRecord?: MeasurementRecord;
    records?: MeasurementRecord[];
    sex?: 'male' | 'female';
}

const calculateAge = (birthDate?: string): number => {
    if (!birthDate) return 28;
    const diff = Date.now() - new Date(birthDate).getTime();
    const ageDate = new Date(diff);
    return Math.abs(ageDate.getUTCFullYear() - 1970);
};

export const AthleteComparisonCard: React.FC<Props> = ({
    currentRecord,
    records = [],
    sex = 'male'
}) => {
    const profileCtx = useContext(ProfileContext);
    const userProfile = profileCtx?.profile;

    const userAge = useMemo(() => {
        return calculateAge(userProfile?.birthDate);
    }, [userProfile?.birthDate]);

    // Current user's profile
    const profileA: ComparisonProfile = useMemo(() => {
        const measurements: Partial<BodyMeasurements> = currentRecord?.measurements || {};
        const name = userProfile?.name || 'Tú (Actual)';
        const height = measurements.height || 178;
        const weight = measurements.weight || 80;
        const bodyFat = measurements.bodyFat ?? 12.0;

        return {
            id: 'current_user',
            name,
            title: 'Medición Antropométrica Actual',
            era: currentRecord?.date ? new Date(currentRecord.date).toLocaleDateString() : 'Sesión Activa',
            sex: sex,
            age: userAge,
            height,
            weight,
            bodyFat,
            date: currentRecord?.date,
            measurements
        };
    }, [currentRecord, sex, userProfile, userAge]);

    // Community / Database Athletes
    const [communityAthletes, setCommunityAthletes] = useState<ComparisonProfile[]>([]);
    const [_loadingCommunity, setLoadingCommunity] = useState(true);
    const [selectedBId, setSelectedBId] = useState<string>('steve_reeves_1950');
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        let isMounted = true;
        fetchCommunityAthletes(currentRecord?.userId).then((list) => {
            if (isMounted) {
                setCommunityAthletes(list);
                setLoadingCommunity(false);
            }
        });
        return () => {
            isMounted = false;
        };
    }, [currentRecord?.userId]);

    // Build profile list for opponent B
    const profileB: ComparisonProfile = useMemo(() => {
        // 1. Preset canonical athletes
        const preset = CANONICAL_PRESETS.find((p) => p.id === selectedBId);
        if (preset) return preset;

        // 2. Community athlete from database
        const community = communityAthletes.find((a) => a.id === selectedBId);
        if (community) return community;

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
                    age: userAge,
                    height: rec.measurements.height || profileA.height || 178,
                    weight: rec.measurements.weight || 80,
                    bodyFat: rec.measurements.bodyFat ?? 12.0,
                    date: rec.date,
                    measurements: rec.measurements || {}
                };
            }
        }

        // Fallback to Steve Reeves
        return CANONICAL_PRESETS[0];
    }, [selectedBId, communityAthletes, records, sex, userAge, profileA.height]);

    // Full comparison analysis
    const comparison = useMemo(() => {
        return compareAthletes(profileA, profileB);
    }, [profileA, profileB]);

    const { metrics, radarData, verdict } = comparison;

    // Quick copy battle summary
    const handleCopySummary = () => {
        const text = `🏆 Duelo Táctico Hypertrophy Tracker Pro:
${profileA.name} (${verdict.bioA.height}cm, ${verdict.bioA.weight}kg, ${verdict.bioA.age}a) vs ${profileB.name} (${verdict.bioB.height}cm, ${verdict.bioB.weight}kg, ${verdict.bioB.age}a)
Marcador: ${verdict.scoreA} vs ${verdict.scoreB}
• V-Taper: ${verdict.vTaperA}x vs ${verdict.vTaperB}x
• FFMI Normalizado: ${verdict.bioA.ffmi} vs ${verdict.bioB.ffmi}
• Techo Magro: ${verdict.geneticCeilingA}% vs ${verdict.geneticCeilingB}%
• Tríada Reeves: ${verdict.triadScoreA}% vs ${verdict.triadScoreB}%
Dictamen: ${verdict.summary}
👉 Medite en: https://www.alexismartyniuk.com.ar/hypertrophyracker`;

        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2500);
        });
    };

    const biometricsMetrics = metrics.filter((m) => m.category === 'biometrics');
    const ratiosMetrics = metrics.filter((m) => m.category === 'ratios');
    const perimetersMetrics = metrics.filter((m) => m.category === 'perimeters' || !m.category);

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
                            <p>Auditoría anatómica relativa contra leyendas del culturismo o atletas reales de la comunidad.</p>
                        </div>
                    </div>

                    <div className="versus-controls">
                        <select
                            value={selectedBId}
                            onChange={(e) => setSelectedBId(e.target.value)}
                            className="versus-select"
                        >
                            <optgroup label="🏆 Físicos Canónicos de Referencia (Leyendas)">
                                {CANONICAL_PRESETS.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.name} ({p.height} cm · {p.weight} kg · {p.age} años)
                                    </option>
                                ))}
                            </optgroup>

                            {communityAthletes.length > 0 && (
                                <optgroup label={`👥 Atletas de la Comunidad / Base de Datos (${communityAthletes.length})`}>
                                    {communityAthletes.map((a) => (
                                        <option key={a.id} value={a.id}>
                                            👤 {a.name} — {a.height ? `${a.height} cm · ` : ''}{a.era}
                                        </option>
                                    ))}
                                </optgroup>
                            )}

                            {records.length > 1 && (
                                <optgroup label="📅 Tus Sesiones Históricas Anteriores">
                                    {records.slice(1, 8).map((r) => (
                                        <option key={r.id} value={`past_${r.id}`}>
                                            Tú ({new Date(r.date).toLocaleDateString()}) {r.measurements.weight ? `— ${r.measurements.weight} kg` : ''}
                                        </option>
                                    ))}
                                </optgroup>
                            )}
                        </select>

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

                {/* Scoreboard Banner with Biometrics Strip */}
                <div className="versus-match-banner">
                    {/* Athlete A (You) */}
                    <div className="athlete-fighter fighter-a">
                        <span className="fighter-tag">Atleta A (Tú)</span>
                        <span className="fighter-name">{profileA.name}</span>
                        <span className="fighter-era">{profileA.era}</span>

                        <div className="fighter-bio-chips">
                            <span className="bio-chip" title="Estatura / Altura">
                                <Ruler size={11} style={{ color: '#22d3ee' }} />
                                <strong>{verdict.bioA.height}</strong> cm
                            </span>
                            <span className="bio-chip" title="Edad Cronológica">
                                <Calendar size={11} style={{ color: '#22d3ee' }} />
                                <strong>{verdict.bioA.age}</strong> años
                            </span>
                            <span className="bio-chip" title="Peso Total">
                                <strong>{verdict.bioA.weight}</strong> kg
                            </span>
                            <span className="bio-chip" title="Masa Magra / Grasa Corporal">
                                <Flame size={11} style={{ color: '#22d3ee' }} />
                                <strong>{verdict.bioA.leanMassKg}</strong> kg ({verdict.bioA.bodyFat}%)
                            </span>
                            <span className="bio-chip" title="FFMI Normalizado">
                                <Zap size={11} style={{ color: '#22d3ee' }} />
                                FFMI <strong>{verdict.bioA.ffmi}</strong>
                            </span>
                        </div>
                    </div>

                    {/* VS Badge */}
                    <div className="versus-vs-badge">
                        <div className="vs-circle">VS</div>
                        <div className="vs-score-tally">
                            <span className="score-a">{verdict.scoreA}</span>
                            <span style={{ color: 'rgba(255,255,255,0.3)', margin: '0 4px' }}>:</span>
                            <span className="score-b">{verdict.scoreB}</span>
                        </div>
                    </div>

                    {/* Athlete B (Opponent / Legend) */}
                    <div className="athlete-fighter fighter-b">
                        <span className="fighter-tag">
                            {profileB.id.startsWith('comm_') || profileB.id.startsWith('cloud_') ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    <Users size={11} /> Atleta Comunidad
                                </span>
                            ) : profileB.id.startsWith('past_') ? (
                                'Histórico Propio'
                            ) : (
                                'Leyenda Canónica'
                            )}
                        </span>
                        <span className="fighter-name">{profileB.name}</span>
                        <span className="fighter-era">{profileB.era}</span>

                        <div className="fighter-bio-chips">
                            <span className="bio-chip" title="Estatura / Altura">
                                <Ruler size={11} style={{ color: '#fbbf24' }} />
                                <strong>{verdict.bioB.height}</strong> cm
                            </span>
                            <span className="bio-chip" title="Edad Cronológica">
                                <Calendar size={11} style={{ color: '#fbbf24' }} />
                                <strong>{verdict.bioB.age}</strong> años
                            </span>
                            <span className="bio-chip" title="Peso Total">
                                <strong>{verdict.bioB.weight}</strong> kg
                            </span>
                            <span className="bio-chip" title="Masa Magra / Grasa Corporal">
                                <Flame size={11} style={{ color: '#fbbf24' }} />
                                <strong>{verdict.bioB.leanMassKg}</strong> kg ({verdict.bioB.bodyFat}%)
                            </span>
                            <span className="bio-chip" title="FFMI Normalizado">
                                <Zap size={11} style={{ color: '#fbbf24' }} />
                                FFMI <strong>{verdict.bioB.ffmi}</strong>
                            </span>
                        </div>
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
                                <span>% Límite Magro Estimado</span>
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
                    <span>Matriz Detallada de Perímetros, Biometría & Deltas</span>
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
                        {/* 1. Biometrics Section */}
                        <tr className="versus-table-category-row">
                            <td colSpan={5}>📊 Datos Biométricos Generales & Composición Corporal</td>
                        </tr>
                        {biometricsMetrics.map((m) => renderMetricRow(m, profileA.name, profileB.name))}

                        {/* 2. Ratios & Canons */}
                        <tr className="versus-table-category-row">
                            <td colSpan={5}>📐 Cánones Clásicos, Ratios Áureos & Simetría</td>
                        </tr>
                        {ratiosMetrics.map((m) => renderMetricRow(m, profileA.name, profileB.name))}

                        {/* 3. Perimeters & Skeletal Frame */}
                        <tr className="versus-table-category-row">
                            <td colSpan={5}>🛡️ Perímetros Musculares & Estructura Ósea</td>
                        </tr>
                        {perimetersMetrics.map((m) => renderMetricRow(m, profileA.name, profileB.name))}
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
        </div>
    );
};

const renderMetricRow = (
    m: ReturnType<typeof compareAthletes>['metrics'][0],
    nameA: string,
    nameB: string
) => {
    const isWinA = m.winner === 'A';
    const isWinB = m.winner === 'B';
    const isNeutral = m.winner === 'NEUTRAL';

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
                {m.valA !== undefined && m.valA !== '' ? `${m.valA} ${m.unit}` : '--'}
            </td>
            <td className="val-cell-b">
                {m.valB !== undefined && m.valB !== '' ? `${m.valB} ${m.unit}` : '--'}
            </td>
            <td>
                {isNeutral ? (
                    <span className="delta-tag tie">
                        $\Delta$ {m.diff} {m.unit}
                    </span>
                ) : (
                    <span className={`delta-tag ${isWinA ? 'win-a' : isWinB ? 'win-b' : 'tie'}`}>
                        {typeof m.diff === 'number' && m.diff > 0 ? `+${m.diff}` : `${m.diff}`} {m.unit}
                        {m.percentDiff !== undefined ? ` (${m.percentDiff > 0 ? `+${m.percentDiff}%` : `${m.percentDiff}%`})` : ''}
                    </span>
                )}
            </td>
            <td>
                {isNeutral ? (
                    <span style={{ color: '#64748b', fontSize: '0.75rem' }}>
                        Informativo
                    </span>
                ) : isWinA ? (
                    <span style={{ color: '#22d3ee', fontWeight: 700, fontSize: '0.75rem' }}>
                        ★ {nameA}
                    </span>
                ) : isWinB ? (
                    <span style={{ color: '#fbbf24', fontWeight: 700, fontSize: '0.75rem' }}>
                        ★ {nameB}
                    </span>
                ) : (
                    <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                        = Empate
                    </span>
                )}
            </td>
        </tr>
    );
};
