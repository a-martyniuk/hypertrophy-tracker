import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, HelpCircle, TrendingUp, TrendingDown, Minus, Trophy, Sparkles } from 'lucide-react';
import { Tooltip } from './Tooltip';
import { Skeleton } from './ui/Skeleton';
import { VolumeHeatmap } from './VolumeHeatmap';
import { HudCard } from './ui/HudCard';
import { HudButton } from './ui/HudButton';
import { TacticalInsightCard } from './TacticalInsightCard';
import { AthleteBadgesGrid } from './dashboard/AthleteBadgesGrid';
import { HarmonyRadarChart } from './dashboard/HarmonyRadarChart';
import { TrophyRoomModal } from './achievements/TrophyRoomModal';
import { evaluateAthleteBadges } from '../utils/athleteBadges';
import { formatDateSafe } from '../utils/dateUtils';
import type { MeasurementRecord } from '../types/measurements';
import './DashboardView.css';

interface DashboardViewProps {
    userName: string;
    sex: 'male' | 'female';
    records: MeasurementRecord[];
    loading: boolean;
}

const TrendIndicator = ({ current, previous, inverse = false }: { current: number, previous?: number, inverse?: boolean }) => {
    if (previous === undefined || current === previous) return <Minus size={14} className="trend-icon stable" />;

    const isIncrease = current > previous;
    const isPositive = inverse ? !isIncrease : isIncrease;

    if (isIncrease) {
        return <TrendingUp size={14} className={`trend-icon ${isPositive ? 'up' : 'warn'}`} />;
    } else {
        return <TrendingDown size={14} className={`trend-icon ${isPositive ? 'down' : 'warn'}`} />;
    }
};

const Sparkline = ({ data }: { data: number[] }) => {
    if (data.length < 2) return null;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = (max - min) || 1;
    const width = 34;
    const height = 14;

    const points = data.map((v, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((v - min) / range) * height;
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg width={width} height={height} className="sparkline" style={{ marginRight: '8px', opacity: 0.6 }}>
            <polyline
                fill="none"
                stroke="var(--primary-color)"
                strokeWidth="1.5"
                strokeLinejoin="round"
                strokeLinecap="round"
                points={points}
            />
        </svg>
    );
};

export const DashboardView = ({ userName, sex, records, loading }: DashboardViewProps) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [trophyModalOpen, setTrophyModalOpen] = useState(false);
    const latestRecord = records[0];
    const previousRecord = records[1];

    const badges = evaluateAthleteBadges(records, sex);
    const unlockedCount = badges.filter((b) => b.isUnlocked).length;

    return (
        <div className="dashboard-grid animate-fade space-y-6">
            <header className="dash-header">
                <div className="welcome-text">
                    <h1>{t('dashboard.greeting')}, {userName} 👋</h1>
                    <p>{t('dashboard.subtitle')}</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        className="trophy-header-btn glass"
                        onClick={() => setTrophyModalOpen(true)}
                    >
                        <Trophy size={16} className="text-amber-400" />
                        <span>{unlockedCount} / {badges.length} Trofeos</span>
                        <Sparkles size={12} className="text-amber-400" />
                    </button>
                    <HudButton onClick={() => navigate('/new-entry')} icon={<Plus size={18} />}>
                        {t('dashboard.register_measurements')}
                    </HudButton>
                </div>
            </header>

            {/* Tactical Diagnosis Intelligence Card */}
            <TacticalInsightCard
                latestRecord={latestRecord}
                previousRecord={previousRecord}
            />

            <div className="main-dashboard-content">
                <div className="left-column">
                    <HudCard title={t('dashboard.silhouette')} className="silhouette-card">
                        <div className="silhouette-wrapper">
                            <VolumeHeatmap
                                currentMeasurements={latestRecord?.measurements || {
                                    weight: 0, height: 0, bodyFat: 0, neck: 0, back: 0, pecho: 0, waist: 0, hips: 0,
                                    arm: { left: 0, right: 0 }, forearm: { left: 0, right: 0 }, wrist: { left: 0, right: 0 },
                                    thigh: { left: 0, right: 0 }, calf: { left: 0, right: 0 }, ankle: { left: 0, right: 0 }
                                }}
                                referenceMeasurements={records[1]?.measurements || records[0]?.measurements}
                                sex={sex}
                                onMarkerClick={(zone) => navigate(`/analysis?muscle=${zone}`)}
                            />
                        </div>
                    </HudCard>

                    <div className="stats-mini-grid">
                        <div className="stat-card glass gold-border">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {t('dashboard.last_record')}
                                <Tooltip content={t('dashboard.last_record_tooltip')} position="top">
                                    <HelpCircle size={14} style={{ opacity: 0.6, cursor: 'help' }} />
                                </Tooltip>
                            </label>
                            <div className="value">
                                {loading ? <Skeleton width={100} height={24} /> : (latestRecord ? formatDateSafe(latestRecord.date) : '--')}
                            </div>
                        </div>
                        <div className="stat-card glass">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {t('dashboard.total_records')}
                                <Tooltip content={t('dashboard.total_records_tooltip')} position="top">
                                    <HelpCircle size={14} style={{ opacity: 0.6, cursor: 'help' }} />
                                </Tooltip>
                            </label>
                            <div className="value">
                                {loading ? <Skeleton width={50} height={24} /> : records.length}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="right-column">
                    {/* Harmony Radar Chart (360° Biometrics) */}
                    <HarmonyRadarChart
                        currentMeasurements={latestRecord?.measurements}
                        sex={sex}
                    />

                    <HudCard title={t('dashboard.latest_values')} className="latest-values-card">
                        <div className="values-list">
                            {loading ? (
                                Array.from({ length: 8 }).map((_, i) => (
                                    <div key={i} className="value-item-skeleton">
                                        <Skeleton width="40%" height={16} />
                                        <Skeleton width="30%" height={16} />
                                    </div>
                                ))
                            ) : latestRecord ? (
                                [
                                    { key: 'height', label: t('common.form.height'), unit: 'cm' },
                                    { key: 'weight', label: t('common.form.weight'), unit: 'kg', inverse: true },
                                    { key: 'bodyFat', label: t('common.form.body_fat'), unit: '%', inverse: true },
                                    { key: 'neck', label: t('common.form.neck'), unit: 'cm' },
                                    { key: 'pecho', label: t('common.form.chest'), unit: 'cm' },
                                    { key: 'back', label: t('common.form.back'), unit: 'cm' },
                                    { key: 'waist', label: t('common.form.waist'), unit: 'cm', inverse: true },
                                    { key: 'hips', label: t('common.form.hips'), unit: 'cm', inverse: true },
                                    { key: 'arm', label: t('common.form.arm'), unit: 'cm' },
                                    { key: 'forearm', label: t('common.form.forearm'), unit: 'cm' },
                                    { key: 'thigh', label: t('common.form.thigh'), unit: 'cm' },
                                    { key: 'calf', label: t('common.form.calf'), unit: 'cm' },
                                ].map(({ key, label, unit, inverse }) => {
                                    const getValue = (record?: MeasurementRecord) => {
                                        if (!record?.measurements) return undefined;
                                        const m = record.measurements as any;
                                        if (['arm', 'forearm', 'thigh', 'calf', 'wrist', 'ankle'].includes(key)) {
                                            const item = m[key];
                                            if (item && typeof item === 'object') {
                                                const l = item.left || 0;
                                                const r = item.right || 0;
                                                if (l > 0 && r > 0) return parseFloat(((l + r) / 2).toFixed(1));
                                                return l || r || undefined;
                                            }
                                            return typeof item === 'number' ? item : undefined;
                                        }
                                        return m[key];
                                    };

                                    const val = getValue(latestRecord);
                                    const prevVal = getValue(previousRecord);

                                    // Extract history for sparkline
                                    const history = records.map(r => getValue(r)).filter((v): v is number => typeof v === 'number' && v > 0).reverse();

                                    if (val === undefined || val === 0) return null;

                                    return (
                                        <div key={key} className="value-item">
                                            <span className="value-label">{label}</span>
                                            <div className="value-data">
                                                <Sparkline data={history} />
                                                <TrendIndicator current={val} previous={prevVal} inverse={inverse} />
                                                <span className="value-num">{val}</span>
                                                <span className="value-unit">{unit}</span>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="empty-state" style={{ padding: '1.5rem 1rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                                    <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>{t('dashboard.no_data')}</p>
                                    <button
                                        onClick={() => navigate('/new-entry')}
                                        className="btn-primary"
                                        style={{ fontSize: '0.8rem', padding: '0.5rem 0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                                    >
                                        <Plus size={15} />
                                        <span>{t('dashboard.register_measurements')}</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </HudCard>
                </div>
            </div>

            {/* Badges & Tactical Achievements */}
            <AthleteBadgesGrid
                records={records}
                sex={sex}
                onOpenTrophyRoom={() => setTrophyModalOpen(true)}
            />

            {/* Full Trophy Room & Hall of Fame Modal */}
            <TrophyRoomModal
                isOpen={trophyModalOpen}
                onClose={() => setTrophyModalOpen(false)}
                records={records}
                sex={sex}
            />
        </div>
    );
};
