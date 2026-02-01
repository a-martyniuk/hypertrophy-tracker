import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    ReferenceLine
} from 'recharts';
import { HelpCircle } from 'lucide-react';
import { Tooltip as AppTooltip } from './Tooltip';
import type { MeasurementRecord, GrowthGoal } from '../types/measurements';
import { AnalysisChartTooltip } from './analysis/AnalysisTooltip';
import { StatCard } from './ui/StatCard';
import { useAnalysisData, type TimeRange } from '../hooks/useAnalysisData';

interface Props {
    records: MeasurementRecord[];
    goals: GrowthGoal[];
    sex?: 'male' | 'female';
}

export const AnalysisView = ({ records, goals, sex = 'male' }: Props) => {
    const {
        timeRange,
        setTimeRange,
        chartData,
        alerts,
        getGoalValue,
        stats
    } = useAnalysisData({ records, goals, sex });

    const timeRanges: { label: string; value: TimeRange }[] = [
        { label: 'Todo', value: 'all' },
        { label: '1 Año', value: '1y' },
        { label: '6 Meses', value: '6m' },
        { label: '3 Meses', value: '3m' },
    ];

    return (
        <div className="analysis-view animate-fade">
            <div className="filters-bar">
                <span className="filter-label">Periodo:</span>
                <div className="filter-buttons">
                    {timeRanges.map((range) => (
                        <button
                            key={range.value}
                            className={`filter-btn ${timeRange === range.value ? 'active' : ''}`}
                            onClick={() => setTimeRange(range.value)}
                        >
                            {range.label}
                        </button>
                    ))}
                </div>
            </div>

            <header className="view-header-stats">
                <StatCard
                    label="Indice W/H (Cintura/Cadera)"
                    value={stats.whrValue}
                    subtitle={
                        <span>
                            {Number(stats.whrValue) < stats.whrThreshold ? 'Rango Saludable' : 'Riesgo Elevado'}
                            <span style={{ fontSize: '0.6em', opacity: 0.7 }}> (Ref: {stats.whrThreshold})</span>
                        </span>
                    }
                    tooltipContent={
                        <div className="text-xs space-y-2">
                            <p className="font-bold border-b border-white/10 pb-1 mb-2">RANGOS CLÍNICOS (HOMBRES)</p>
                            <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 items-start">
                                <span className="text-emerald-400 font-bold whitespace-nowrap">≤ 0.89</span>
                                <div>
                                    <span className="text-emerald-400 font-bold">Bajo Riesgo</span>
                                    <ul className="list-disc pl-3 opacity-70 text-[10px] leading-tight space-y-1 mt-1">
                                        <li>Buena distribución de grasa</li>
                                        <li>Predominio subcutáneo</li>
                                    </ul>
                                </div>
                                <span className="text-yellow-400 font-bold whitespace-nowrap">0.90 - 0.94</span>
                                <div>
                                    <span className="text-yellow-400 font-bold">Riesgo Moderado</span>
                                    <ul className="list-disc pl-3 opacity-70 text-[10px] leading-tight space-y-1 mt-1">
                                        <li>Inicio de acumulación central</li>
                                        <li>Grasa visceral en aumento</li>
                                    </ul>
                                </div>
                                <span className="text-red-400 font-bold whitespace-nowrap">≥ 0.95</span>
                                <div>
                                    <span className="text-red-400 font-bold">Riesgo Elevado</span>
                                    <ul className="list-disc pl-3 opacity-70 text-[10px] leading-tight space-y-1 mt-1">
                                        <li>Alta probabilidad de grasa visceral</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    }
                />

                <StatCard
                    label="Ratio Brazo/Muñeca"
                    value={stats.armPotential}
                    subtitle="Potencial Genético"
                    tooltipContent={
                        <div className="text-xs space-y-2">
                            <p className="font-bold border-b border-white/10 pb-1 mb-2">POTENCIAL ESTRUCTURAL (BRAZOS)</p>
                            <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 items-start">
                                <span className="text-red-400 font-bold whitespace-nowrap">≤ 2.1</span>
                                <div><span className="text-red-400 font-bold">Bajo potencial</span></div>
                                <span className="text-yellow-400 font-bold whitespace-nowrap">2.2 - 2.4</span>
                                <div><span className="text-yellow-400 font-bold">Potencial medio</span></div>
                                <span className="text-emerald-400 font-bold whitespace-nowrap">≥ 2.5</span>
                                <div><span className="text-emerald-400 font-bold">Alto potencial</span></div>
                            </div>
                        </div>
                    }
                />

                <StatCard
                    label="Ratio Cintura/Pecho"
                    value={stats.vShapeRatio}
                    subtitle="Estética (V-Shape)"
                    tooltipContent={
                        <div className="text-xs space-y-2">
                            <p className="font-bold border-b border-white/10 pb-1 mb-2">Rangos Orientativos (Hombres)</p>
                            <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 items-start">
                                <span className="text-emerald-400 font-bold whitespace-nowrap">≤ 0.75</span>
                                <div><span className="text-emerald-400 font-bold">Excelente</span></div>
                                <span className="text-yellow-400 font-bold whitespace-nowrap">0.76 - 0.82</span>
                                <div><span className="text-yellow-400 font-bold">Bueno</span></div>
                                <span className="text-orange-400 font-bold whitespace-nowrap">≥ 0.89</span>
                                <div><span className="text-red-400 font-bold">Desfavorable</span></div>
                            </div>
                        </div>
                    }
                />
            </header>

            {alerts.length > 0 && (
                <div className="alerts-strip">
                    {alerts.map((a, i) => (
                        <div key={i} className={`alert-item ${a.type}`}>
                            <span className="dot"></span>
                            {a.msg}
                        </div>
                    ))}
                </div>
            )}

            <h2>Panel de Evoluciones</h2>

            <div className="charts-grid">
                <div className="chart-card glass">
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        Peso & Cintura
                        <AppTooltip content="Evolución temporal. La cintura es el mejor indicador de grasa corporal real." position="right">
                            <HelpCircle size={14} className="text-secondary opacity-50 cursor-help" />
                        </AppTooltip>
                    </h3>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                                <YAxis stroke="#94a3b8" fontSize={12} />
                                <Tooltip content={<AnalysisChartTooltip />} />
                                <Legend />
                                {getGoalValue('peso') && <ReferenceLine y={getGoalValue('peso')!} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'right', value: 'Meta', fill: '#ef4444', fontSize: 10 }} />}
                                {getGoalValue('cintura') && <ReferenceLine y={getGoalValue('cintura')!} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'right', value: 'Meta', fill: '#ef4444', fontSize: 10 }} />}
                                <Line type="monotone" dataKey="peso" stroke="#f59e0b" name="Peso (kg)" strokeWidth={2} dot={{ r: 4 }} />
                                <Line type="monotone" dataKey="cintura" stroke="#fbbf24" name="Cintura (cm)" strokeWidth={2} dot={{ r: 4 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="chart-card glass">
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        Comparativa Brazos (R/L)
                        <AppTooltip content="Detecta asimetrías. Pequeñas diferencias son normales, >1cm requiere atención." position="right">
                            <HelpCircle size={14} className="text-secondary opacity-50 cursor-help" />
                        </AppTooltip>
                    </h3>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                                <YAxis stroke="#94a3b8" fontSize={12} />
                                <Tooltip content={<AnalysisChartTooltip />} />
                                <Legend />
                                {getGoalValue('arm.right') && <ReferenceLine y={getGoalValue('arm.right')!} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'right', value: 'Meta', fill: '#ef4444', fontSize: 10 }} />}
                                <Line type="monotone" dataKey="brazoDer" stroke="#f59e0b" name="Derecho" strokeWidth={2} />
                                <Line type="monotone" dataKey="brazoIzq" stroke="#fbbf24" name="Izquierdo" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="chart-card glass">
                    <h3>Comparativa Piernas (R/L)</h3>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                                <YAxis stroke="#94a3b8" fontSize={12} />
                                <Tooltip content={<AnalysisChartTooltip />} />
                                <Legend />
                                {getGoalValue('thigh.right') && <ReferenceLine y={getGoalValue('thigh.right')!} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'right', value: 'Meta', fill: '#ef4444', fontSize: 10 }} />}
                                <Line type="monotone" dataKey="piernaDer" stroke="#f59e0b" name="Derecho" strokeWidth={2} />
                                <Line type="monotone" dataKey="piernaIzq" stroke="#fbbf24" name="Izquierdo" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="chart-card glass">
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        Proporción Tronco
                        <AppTooltip content="Media de Pecho, Espalda y Cuello. Indica crecimiento global del torso." position="right">
                            <HelpCircle size={14} className="text-secondary opacity-50 cursor-help" />
                        </AppTooltip>
                    </h3>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                                <YAxis stroke="#94a3b8" fontSize={12} />
                                <Tooltip content={<AnalysisChartTooltip />} />
                                <Legend />
                                <Line type="step" dataKey="tronco" stroke="#f59e0b" name="Media Tronco" strokeWidth={3} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="chart-card glass">
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        Ratio Cintura/Cadera
                        <AppTooltip content="Indicador clave de salud metabólica. Hombres < 0.9, Mujeres < 0.85 recomendado." position="right">
                            <HelpCircle size={14} className="text-secondary opacity-50 cursor-help" />
                        </AppTooltip>
                    </h3>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                                <YAxis domain={[0.5, 1.2]} stroke="#94a3b8" fontSize={12} />
                                <Tooltip content={<AnalysisChartTooltip />} />
                                <Line type="monotone" dataKey="whr" stroke="#fbbf24" name="W/H Ratio" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <style>{`
        .analysis-view {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          padding-bottom: 3rem;
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
        }
        .filters-bar {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: -1rem;
            padding: 0 0.5rem;
        }
        .filter-label {
            font-size: 0.85rem;
            color: var(--text-secondary);
            font-weight: 500;
        }
        .filter-buttons {
            display: flex;
            background: rgba(255, 255, 255, 0.05);
            padding: 4px;
            border-radius: 8px;
            border: 1px solid var(--border-color);
        }
        .filter-btn {
            background: transparent;
            border: none;
            color: var(--text-secondary);
            padding: 4px 12px;
            border-radius: 6px;
            font-size: 0.8rem;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        .filter-btn:hover {
            color: white;
        }
        .filter-btn.active {
            background: var(--primary-color);
            color: #1a1a1d;
            font-weight: 600;
        }

        .view-header-stats {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1.5rem;
        }
        
        .alerts-strip {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
        }
        .alert-item {
            background: rgba(245, 158, 11, 0.05);
            border: 1px solid rgba(245, 158, 11, 0.1);
            padding: 0.75rem 1rem;
            border-radius: 10px;
            font-size: 0.85rem;
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }
        .alert-item.warning { border-left: 4px solid #ef4444; color: #ef4444; }
        .alert-item.info { border-left: 4px solid #f59e0b; color: #f59e0b; }
        .alert-item .dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: currentColor;
            box-shadow: 0 0 10px currentColor;
        }

        .charts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
          gap: 1.5rem;
        }
        @media (max-width: 768px) {
          .analysis-view {
            padding: 0 1rem 3rem 1rem;
            gap: 1.5rem;
          }
          .filters-bar {
             flex-direction: column;
             align-items: flex-start;
             gap: 0.5rem;
          }
          .view-header-stats {
            grid-template-columns: 1fr;
            gap: 1rem;
          }
          .charts-grid {
            grid-template-columns: 1fr;
          }
        }
        .chart-card {
          padding: 1.5rem;
          border-radius: 20px;
        }
        .chart-card h3 {
          margin-bottom: 1.5rem;
          font-size: 1.1rem;
          color: var(--text-secondary);
        }
        .chart-container {
          width: 100%;
        }
      `}</style>
        </div>
    );
};
