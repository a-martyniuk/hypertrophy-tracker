import { useNavigate } from 'react-router-dom';
import { Plus, HelpCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Tooltip } from './Tooltip';
import { Skeleton } from './ui/Skeleton';
import { VolumeHeatmap } from './VolumeHeatmap';
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
    const navigate = useNavigate();
    const latestRecord = records[0];
    const previousRecord = records[1];

    return (
        <div className="dashboard-grid animate-fade">
            <header className="dash-header">
                <div className="welcome-text">
                    <h1>Hola, {userName} 👋</h1>
                    <p>Tu evolución física en números reales.</p>
                </div>
                <button className="btn-primary" onClick={() => navigate('/new-entry')}>
                    <Plus size={18} /> Registrar Medidas
                </button>
            </header>

            <div className="main-dashboard-content">
                <div className="left-column">
                    <div className="silhouette-card glass">
                        <h3>Tu Silueta Actual</h3>
                        <div className="silhouette-wrapper">
                            <VolumeHeatmap
                                currentMeasurements={latestRecord?.measurements || {
                                    weight: 0, height: 0, bodyFat: 0, neck: 0, back: 0, pecho: 0, waist: 0, hips: 0,
                                    arm: { left: 0, right: 0 }, forearm: { left: 0, right: 0 }, wrist: { left: 0, right: 0 },
                                    thigh: { left: 0, right: 0 }, calf: { left: 0, right: 0 }, ankle: { left: 0, right: 0 }
                                }}
                                referenceMeasurements={records[records.length - 1]?.measurements}
                                sex={sex}
                                onMarkerClick={() => navigate('/analysis')}
                            />
                        </div>
                    </div>

                    <div className="stats-mini-grid">
                        <div className="stat-card glass gold-border">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                Último Registro
                                <Tooltip content="Fecha de la última medición registrada." position="top">
                                    <HelpCircle size={14} style={{ opacity: 0.6, cursor: 'help' }} />
                                </Tooltip>
                            </label>
                            <div className="value">
                                {loading ? <Skeleton width={100} height={24} /> : (latestRecord ? new Date(latestRecord.date).toLocaleDateString() : '--')}
                            </div>
                        </div>
                        <div className="stat-card glass">
                            <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                Total Registros
                                <Tooltip content="Cantidad total de mediciones guardadas en el historial." position="top">
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
                    <div className="card latest-summary glass" style={{ flex: 1, padding: '1.5rem', maxHeight: 'none', overflow: 'visible' }}>
                        <h3>Últimos Valores</h3>
                        {latestRecord ? (
                            <ul className="summary-list">
                                {[
                                    { key: 'height', label: 'Altura', unit: 'cm' },
                                    { key: 'weight', label: 'Peso', unit: 'kg', inverse: true },
                                    { key: 'bodyFat', label: 'Grasa', unit: '%', inverse: true },
                                    { key: 'neck', label: 'Cuello', unit: 'cm' },
                                    { key: 'pecho', label: 'Pecho', unit: 'cm' },
                                    { key: 'waist', label: 'Cintura', unit: 'cm', inverse: true },
                                    { key: 'hips', label: 'Cadera', unit: 'cm', inverse: true },
                                    { key: 'arm.right', label: 'Bíceps (D)', unit: 'cm' },
                                    { key: 'forearm.right', label: 'Antebrazo (D)', unit: 'cm' },
                                    { key: 'thigh.right', label: 'Muslo (D)', unit: 'cm' },
                                    { key: 'calf.right', label: 'Gemelo (D)', unit: 'cm' },
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
                                                    <button className="btn-tiny-action" onClick={() => navigate('/new-entry')}>Registrar</button>
                                                )}
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        ) : (
                            <p>No hay datos recientes</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
