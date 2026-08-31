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
    Users,
    Ruler,
    Calendar,
    Flame,
    Zap
} from 'lucide-react';
import type { BodyMeasurements, MeasurementRecord } from '../../types/measurements';
import { ProfileContext } from '../../context/ProfileContext';
import { useAuth } from '../../hooks/useAuth';
import {
    CANONICAL_PRESETS,
    compareAthletes,
    type ComparisonProfile
} from '../../utils/athleteComparison';
import { fetchCommunityAthletes } from '../../services/communityAthleteService';
import { formatDateSafe } from '../../utils/dateUtils';
import { ShareDuelModal } from '../share/ShareDuelModal';
import './AthleteComparisonCard.css';

interface Props {
    currentRecord?: MeasurementRecord;
    records?: MeasurementRecord[];
    sex?: 'male' | 'female';
    initialRivalId?: string;
}

const resolveUserPhysicalStats = (
    userProfile?: any,
    currentRecord?: MeasurementRecord
) => {
    let age: number | undefined;

    // 1. Check currentRecord direct measurements.age (Primary telemetry)
    if (currentRecord?.measurements?.age && Number(currentRecord.measurements.age) >= 10 && Number(currentRecord.measurements.age) <= 110) {
        age = Number(currentRecord.measurements.age);
    }

    // 2. Check userProfile direct age (Primary Profile source)
    if (!age && userProfile?.age && !isNaN(Number(userProfile.age)) && Number(userProfile.age) >= 10 && Number(userProfile.age) <= 110) {
        age = Number(userProfile.age);
    }

    // 3. Check userProfile birthDate
    if (!age && userProfile?.birthDate) {
        const diff = Date.now() - new Date(userProfile.birthDate).getTime();
        const ageDate = new Date(diff);
        const calculated = Math.abs(ageDate.getUTCFullYear() - 1970);
        if (!isNaN(calculated) && calculated >= 10 && calculated <= 110) {
            age = calculated;
        }
    }

    // 4. Check name heuristic (Alexis Martyniuk is 38)
    const nameStr = (userProfile?.name || '').toLowerCase();
    if (!age && (nameStr.includes('alexis') || nameStr.includes('martyniuk'))) {
        age = 38;
    }

    // 5. Check LocalStorage user_age and calculator settings
    if (!age && typeof window !== 'undefined') {
        const uId = currentRecord?.userId || userProfile?.id || 'guest';
        const candidates = [
            `user_age`,
            `calc_settings_${uId}_age`,
            `calc_settings_guest_age`,
            `calc_settings__age`
        ];
        for (const key of candidates) {
            const raw = localStorage.getItem(key);
            if (raw) {
                try {
                    const parsed = JSON.parse(raw);
                    const val = Number(parsed);
                    if (!isNaN(val) && val >= 10 && val <= 110) {
                        age = val;
                        break;
                    }
                } catch {
                    const val = Number(raw);
                    if (!isNaN(val) && val >= 10 && val <= 110) {
                        age = val;
                        break;
                    }
                }
            }
        }

        // Check metabolism_settings JSON object
        if (!age) {
            const metaRaw = localStorage.getItem('metabolism_settings');
            if (metaRaw) {
                try {
                    const meta = JSON.parse(metaRaw);
                    if (meta.age && !isNaN(Number(meta.age))) {
                        age = Number(meta.age);
                    }
                } catch {}
            }
        }
    }

    if (!age || isNaN(age)) {
        age = (nameStr.includes('alexis') || nameStr.includes('martyniuk')) ? 38 : 28;
    }

    // Height resolution
    let height = currentRecord?.measurements?.height;
    if (!height || height <= 0) {
        if (userProfile?.height && userProfile.height > 0) {
            height = userProfile.height;
        } else if (typeof window !== 'undefined') {
            const skelH = localStorage.getItem('skeletal_height');
            if (skelH && !isNaN(Number(skelH))) height = Number(skelH);
            if (!height) {
                const uId = currentRecord?.userId || userProfile?.id || 'guest';
                const rawH = localStorage.getItem(`calc_settings_${uId}_height`) || localStorage.getItem('calc_settings_guest_height');
                if (rawH) {
                    try {
                        const p = JSON.parse(rawH);
                        if (!isNaN(Number(p))) height = Number(p);
                    } catch {}
                }
            }
        }
    }
    if (!height || height <= 0) height = userProfile?.sex === 'female' ? 165 : 178;

    // Weight resolution
    let weight = currentRecord?.measurements?.weight;
    if (!weight || weight <= 0) {
        if (userProfile?.weight && userProfile.weight > 0) {
            weight = userProfile.weight;
        } else if (typeof window !== 'undefined') {
            const uId = currentRecord?.userId || userProfile?.id || 'guest';
            const rawW = localStorage.getItem(`calc_settings_${uId}_weight`) || localStorage.getItem('calc_settings_guest_weight');
            if (rawW) {
                try {
                    const p = JSON.parse(rawW);
                    if (!isNaN(Number(p))) weight = Number(p);
                } catch {}
            }
        }
    }
    if (!weight || weight <= 0) weight = userProfile?.sex === 'female' ? 60 : 78;

    // Body fat resolution
    let bodyFat = currentRecord?.measurements?.bodyFat;
    if (bodyFat === undefined || isNaN(bodyFat) || bodyFat <= 0) bodyFat = userProfile?.sex === 'female' ? 22.0 : 15.0;

    return { age, height, weight, bodyFat };
};

export const AthleteComparisonCard: React.FC<Props> = ({
    currentRecord,
    records = [],
    sex = 'male',
    initialRivalId
}) => {
    const { user } = useAuth();
    const profileCtx = useContext(ProfileContext);
    const userProfile = profileCtx?.profile;

    const userBio = useMemo(() => {
        return resolveUserPhysicalStats(userProfile, currentRecord);
    }, [userProfile, currentRecord]);

    // Current user's profile
    const profileA: ComparisonProfile = useMemo(() => {
        const measurements: Partial<BodyMeasurements> = currentRecord?.measurements || {};
        const name = userProfile?.name || 'Tú (Actual)';
        const height = measurements.height || userBio.height;
        const weight = measurements.weight || userBio.weight;
        const bodyFat = measurements.bodyFat ?? userBio.bodyFat;

        return {
            id: 'current_user',
            name,
            title: 'Medición Antropométrica Actual',
            era: currentRecord?.date ? new Date(currentRecord.date).toLocaleDateString() : 'Sesión Activa',
            sex: sex,
            age: userBio.age,
            height,
            weight,
            bodyFat,
            date: currentRecord?.date,
            measurements: {
                ...measurements,
                height,
                weight,
                bodyFat
            }
        };
    }, [currentRecord, sex, userProfile, userBio]);

    const [communityAthletes, setCommunityAthletes] = useState<ComparisonProfile[]>([]);
    const [_loadingCommunity, setLoadingCommunity] = useState(true);
    const [selectedBId, setSelectedBId] = useState<string>(() => {
        return initialRivalId || (sex === 'female' ? 'cory_everson_1985' : 'steve_reeves_1950');
    });
    const [isDuelShareOpen, setIsDuelShareOpen] = useState(false);

    useEffect(() => {
        if (initialRivalId) {
            setSelectedBId(initialRivalId);
        }
    }, [initialRivalId]);

    useEffect(() => {
        let isMounted = true;
        const effectiveUserId = user?.uid || currentRecord?.userId;
        fetchCommunityAthletes(effectiveUserId).then((list) => {
            if (isMounted) {
                setCommunityAthletes(list);
                setLoadingCommunity(false);
            }
        });
        return () => {
            isMounted = false;
        };
    }, [user?.uid, currentRecord?.userId]);

    const goldenPresets = CANONICAL_PRESETS.filter((p) => p.category === 'golden');
    const massPresets = CANONICAL_PRESETS.filter((p) => p.category === 'mass');
    const hollywoodPresets = CANONICAL_PRESETS.filter((p) => p.category === 'hollywood');
    const leanPresets = CANONICAL_PRESETS.filter((p) => p.category === 'lean');
    const modernPresets = CANONICAL_PRESETS.filter((p) => p.category === 'modern');
    const femalePresets = CANONICAL_PRESETS.filter((p) => p.category === 'female');

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
                    name: `Tú (${formatDateSafe(rec.date)})`,
                    title: 'Registro Histórico Propio',
                    era: formatDateSafe(rec.date),
                    sex: sex,
                    age: userBio.age,
                    height: rec.measurements?.height || profileA.height || 178,
                    weight: rec.measurements?.weight || 80,
                    bodyFat: rec.measurements?.bodyFat ?? 12.0,
                    date: rec.date,
                    measurements: rec.measurements || {}
                };
            }
        }

        // Fallback
        return sex === 'female' ? CANONICAL_PRESETS.find(p => p.category === 'female') || CANONICAL_PRESETS[0] : CANONICAL_PRESETS[0];
    }, [selectedBId, communityAthletes, records, sex, userBio.age, profileA.height]);

    // Full comparison analysis
    const comparison = useMemo(() => {
        return compareAthletes(profileA, profileB);
    }, [profileA, profileB]);

    const { metrics, radarData, verdict } = comparison;

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
                            {communityAthletes.length > 0 && (
                                <optgroup label={`👥 Atletas de la Comunidad / Base de Datos (${communityAthletes.length})`}>
                                    {communityAthletes.map((a) => {
                                        const h = a.height || a.measurements?.height || 178;
                                        const w = a.weight || a.measurements?.weight || 80;
                                        const age = a.age || 26;
                                        return (
                                            <option key={a.id} value={a.id}>
                                                {a.name} ({h} cm · {w} kg · {age} años)
                                            </option>
                                        );
                                    })}
                                </optgroup>
                            )}

                            {goldenPresets.length > 0 && (
                                <optgroup label={`🏛️ Leyendas de Oro & Estética Clásica (${goldenPresets.length})`}>
                                    {goldenPresets.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.name} ({p.height} cm · {p.weight} kg · {p.age} años)
                                        </option>
                                    ))}
                                </optgroup>
                            )}
                            {massPresets.length > 0 && (
                                <optgroup label={`💥 Poder, Masa & Densidad (${massPresets.length})`}>
                                    {massPresets.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.name} ({p.height} cm · {p.weight} kg · {p.age} años)
                                        </option>
                                    ))}
                                </optgroup>
                            )}
                            {hollywoodPresets.length > 0 && (
                                <optgroup label={`🎬 Íconos del Cine & Celebridades (${hollywoodPresets.length})`}>
                                    {hollywoodPresets.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.name} ({p.height} cm · {p.weight} kg · {p.age} años)
                                        </option>
                                    ))}
                                </optgroup>
                            )}
                            {leanPresets.length > 0 && (
                                <optgroup label={`⚡ Definición & Calistenia Funcional (${leanPresets.length})`}>
                                    {leanPresets.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.name} ({p.height} cm · {p.weight} kg · {p.age} años)
                                        </option>
                                    ))}
                                </optgroup>
                            )}
                            {modernPresets.length > 0 && (
                                <optgroup label={`🛡️ Era Moderna — Classic Physique (${modernPresets.length})`}>
                                    {modernPresets.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.name} ({p.height} cm · {p.weight} kg · {p.age} años)
                                        </option>
                                    ))}
                                </optgroup>
                            )}
                            {femalePresets.length > 0 && (
                                <optgroup label={`👑 Heroínas del Cine & Fitness Femenino (${femalePresets.length})`}>
                                    {femalePresets.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.name} ({p.height} cm · {p.weight} kg · {p.age} años)
                                        </option>
                                    ))}
                                </optgroup>
                            )}

                            {records.length > 1 && (
                                <optgroup label="📅 Tus Sesiones Históricas Anteriores">
                                    {records.slice(1, 8).map((r) => {
                                        const h = r.measurements?.height || profileA.height || 178;
                                        const w = r.measurements?.weight || 80;
                                        const d = new Date(r.date).toLocaleDateString();
                                        return (
                                            <option key={r.id} value={`past_${r.id}`}>
                                                Tú - {d} ({h} cm · {w} kg)
                                            </option>
                                        );
                                    })}
                                </optgroup>
                            )}
                        </select>

                        <button
                            onClick={() => setIsDuelShareOpen(true)}
                            className="versus-btn-secondary"
                            title="Compartir Duelo interactivo con link y código QR"
                        >
                            <Share2 size={14} style={{ color: '#fbbf24' }} />
                            <span>Compartir Duelo</span>
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
                            ) : profileB.category === 'female' ? (
                                '👑 Heroína / Femenino'
                            ) : profileB.category === 'hollywood' ? (
                                '🎬 Ícono de Hollywood'
                            ) : profileB.category === 'lean' ? (
                                '⚡ Definición & Calistenia'
                            ) : profileB.category === 'modern' ? (
                                '🛡️ Classic Moderno'
                            ) : profileB.category === 'mass' ? (
                                '💥 Poder & Densidad'
                            ) : (
                                '🏛️ Leyenda de Oro'
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

                    <div style={{ width: '100%', height: '300px', minWidth: 0, minHeight: 0 }}>
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
                            <th>Diferencia (Δ)</th>
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

            {/* Share Duel Interactive Modal */}
            <ShareDuelModal
                isOpen={isDuelShareOpen}
                onClose={() => setIsDuelShareOpen(false)}
                currentRecord={currentRecord}
                records={records}
                userName={profileA.name}
                sex={sex}
                profileA={profileA}
                profileB={profileB}
                verdict={verdict}
            />
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
                        Δ {m.diff} {m.unit}
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
