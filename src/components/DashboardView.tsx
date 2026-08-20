import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, HelpCircle, TrendingUp, TrendingDown, Minus, FileText } from 'lucide-react';
import { Tooltip } from './Tooltip';
import { Skeleton } from './ui/Skeleton';
import { VolumeHeatmap } from './VolumeHeatmap';
import { HudCard } from './ui/HudCard';
import { HudButton } from './ui/HudButton';
import { TacticalInsightCard } from './TacticalInsightCard';
import { TacticalReportModal } from './TacticalReportModal';
import type { MeasurementRecord } from '../types/measurements';

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

import './DashboardView.css';

export const DashboardView = ({ userName, sex, records, loading }: DashboardViewProps) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [reportModalOpen, setReportModalOpen] = useState(false);
    const latestRecord = records[0];
    const previousRecord = records[1];

    return (
        <div className="dashboard-grid animate-fade space-y-6">
            <header className="dash-header">
                <div className="welcome-text">
                    <h1>{t('dashboard.greeting')}, {userName} 👋</h1>
                    <p>{t('dashboard.subtitle')}</p>
                </div>
                <div className="flex items-center gap-3">
                    {latestRecord && (
                        <button
                            onClick={() => setReportModalOpen(true)}
                            className="btn-secondary flex items-center gap-1.5 font-mono text-xs text-amber-400 border-amber-500/30 hover:border-amber-400"
                        >
                            <FileText size={16} />
                            <span>FICHA TÁCTICA HD</span>
                        </button>
                    )}
                    <HudButton onClick={() => navigate('/new-entry')} icon={<Plus size={18} />}>
                        {t('dashboard.register_measurements')}
                    </HudButton>
                </div>
            </header>

            {/* Tactical Diagnosis Intelligence Card */}
            <TacticalInsightCard
                latestRecord={latestRecord}
                previousRecord={previousRecord}
                onOpenReport={() => setReportModalOpen(true)}
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
                                {loading ? <Skeleton width={100} height={24} /> : (latestRecord ? new Date(latestRecord.date).toLocaleDateString() : '--')}
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
                    <HudCard title={t('dashboard.last_values')} className="latest-values-card">
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
                                    { key: 'waist', label: t('common.form.waist'), unit: 'cm', inverse: true },
                                    { key: 'hips', label: t('common.form.hips'), unit: 'cm', inverse: true },
                                    { key: 'arm.right', label: t('common.form.arm') + ' (R)', unit: 'cm' },
                                    { key: 'forearm.right', label: t('common.form.forearm') + ' (R)', unit: 'cm' },
                                    { key: 'thigh.right', label: t('common.form.thigh') + ' (R)', unit: 'cm' },
                                    { key: 'calf.right', label: t('common.form.calf') + ' (R)', unit: 'cm' },
                                ].map(({ key, label, unit, inverse }) => {
                                    const getValue = (record?: MeasurementRecord) => {
                                        if (!record) return undefined;
                                        if (key.includes('.')) {
                                            const [parent, child] = key.split('.');
                                            // @ts-ignore
                                            return record.measurements[parent]?.[child];
                                        }
                                        // @ts-ignore
                                        return record.measurements[key];
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
                                <div className="empty-state">
                                    <p>{t('dashboard.no_data')}</p>
                                </div>
                            )}
                        </div>
                    </HudCard>
                </div>
            </div>

            {/* Tactical Report Modal */}
            <TacticalReportModal
                isOpen={reportModalOpen}
                onClose={() => setReportModalOpen(false)}
                latestRecord={latestRecord}
                previousRecord={previousRecord}
                userName={userName}
            />
        </div>
    );
};
