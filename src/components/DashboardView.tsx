import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, HelpCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Tooltip } from './Tooltip';
import { Skeleton } from './ui/Skeleton';
import { VolumeHeatmap } from './VolumeHeatmap';
import { HudCard } from './ui/HudCard';
import { HudButton } from './ui/HudButton';
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

export const DashboardView = ({ userName, sex, records, loading }: DashboardViewProps) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const latestRecord = records[0];
    const previousRecord = records[1];

    return (
        <div className="dashboard-grid animate-fade">
            <header className="dash-header">
                <div className="welcome-text">
                    <h1>{t('dashboard.greeting')}, {userName} 👋</h1>
                    <p>{t('dashboard.subtitle')}</p>
                </div>
                <HudButton onClick={() => navigate('/new-entry')} icon={<Plus size={18} />}>
                    {t('dashboard.register_measurements')}
                </HudButton>
            </header>

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
                                referenceMeasurements={records[records.length - 1]?.measurements}
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
                                {loading ? <Skeleton width={40} height={24} /> : records.length}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="side-stats-column">
                    <HudCard title={t('dashboard.latest_values')} className="latest-summary" style={{ flex: 1, maxHeight: 'none', overflow: 'visible' }}>
                        {latestRecord ? (
                            <ul className="summary-list">
                                {[
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
                                    const getValue = (record: any) => {
                                        if (!record) return undefined;
                                        if (key.includes('.')) {
                                            const [k1, k2] = key.split('.');
                                            return record.measurements[k1]?.[k2];
                                        }
                                        return record.measurements[key];
                                    };

                                    const val = getValue(latestRecord);
                                    const prevVal = getValue(previousRecord);
                                    const history = records
                                        .map(r => getValue(r))
                                        .filter(v => typeof v === 'number')
                                        .reverse()
                                        .slice(-5);

                                    const hasValue = val !== undefined && val !== 0;

                                    return (
                                        <li key={key}>
                                            <span>{label}:</span>
                                            <div className="summary-val-wrap">
                                                {history.length > 1 && <Sparkline data={history} />}
                                                {hasValue ? (
                                                    <>
                                                        <strong>{val} {unit}</strong>
                                                        <TrendIndicator current={val} previous={prevVal} inverse={inverse} />
                                                    </>
                                                ) : (
                                                    <button className="btn-tiny-action" onClick={() => navigate('/new-entry')}>{t('dashboard.btn_register')}</button>
                                                )}
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : (
                            <p>{t('dashboard.no_data')}</p>
                        )}
                    </HudCard>
                </div>
            </div>
            <style>{`
                .dash-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    margin-bottom: 2rem;
                }

                .welcome-text h1 {
                    font-size: 2.25rem;
                    margin-bottom: 0.25rem;
                }

                .welcome-text p {
                    color: var(--text-secondary);
                }

                .main-dashboard-content {
                    display: grid;
                    grid-template-columns: 1fr 300px;
                    gap: 1.5rem;
                }
                
                .left-column {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                    min-width: 0; /* Fix grid overflow */
                }
                
                .side-stats-column {
                     display: flex;
                     flex-direction: column;
                     gap: 1.5rem;
                }
                
                .silhouette-wrapper {
                     min-height: 450px;
                     position: relative;
                     display: flex;
                     justify-content: center;
                }

                .stats-mini-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 1.5rem;
                }

                .stat-card {
                    padding: 1.5rem;
                    border-radius: 20px;
                    border: 1px solid var(--border-color);
                    position: relative;
                    z-index: 1;
                    transition: transform 0.2s ease, z-index 0s;
                }

                .stat-card:hover {
                    z-index: 20;
                }

                .gold-border {
                    border-color: rgba(245, 158, 11, 0.4);
                    background: linear-gradient(135deg, rgba(13, 13, 15, 0.5), rgba(245, 158, 11, 0.05));
                    box-shadow: inset 0 0 20px rgba(245, 158, 11, 0.05);
                }

                .stat-card label {
                    font-size: 0.8rem;
                    color: var(--text-secondary);
                    text-transform: uppercase;
                }

                .stat-card .value {
                    font-size: 1.75rem;
                    font-weight: 700;
                    margin-top: 0.5rem;
                }

                .latest-summary {
                    /* Overrides for hud card if needed */
                }

                .summary-list {
                    list-style: none;
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    margin-top: 1.5rem;
                }

                .summary-list li {
                    display: flex;
                    justify-content: space-between;
                    padding-bottom: 0.75rem;
                    border-bottom: 1px solid var(--border-color);
                }

                .summary-list span {
                    color: var(--text-secondary);
                }

                .summary-val-wrap {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }

                .trend-icon {
                    opacity: 0.8;
                    padding: 2px;
                    border-radius: 4px;
                }

                .trend-icon.stable { color: #64748b; }
                .trend-icon.up { color: #f59e0b; }
                .trend-icon.down { color: #f59e0b; }
                .trend-icon.warn { color: #ef4444; }

                .btn-tiny-action {
                    background: rgba(245, 158, 11, 0.1);
                    color: #f59e0b;
                    border: 1px solid rgba(245, 158, 11, 0.2);
                    border-radius: 4px;
                    padding: 2px 8px;
                    font-size: 0.7rem;
                    cursor: pointer;
                    transition: var(--transition-smooth);
                }
                .btn-tiny-action:hover {
                    background: rgba(245, 158, 11, 0.2);
                    box-shadow: 0 0 10px rgba(245, 158, 11, 0.1);
                }

                @media (max-width: 1024px) {
                    .main-dashboard-content {
                        grid-template-columns: 1fr;
                    }
                }

                @media (max-width: 768px) {
                    .dash-header {
                        flex-direction: column;
                        align-items: flex-start;
                        gap: 1rem;
                    }
                    
                    .stats-mini-grid {
                        grid-template-columns: 1fr;
                    }
                }
            `}</style>
        </div>
    );
};
