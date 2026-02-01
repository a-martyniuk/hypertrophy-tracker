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

interface Props {
    records: MeasurementRecord[];
    goals: GrowthGoal[];
    sex?: 'male' | 'female';
}

export const AnalysisView = ({ records, goals, sex = 'male' }: Props) => {
    const getGoalValue = (type: string) => {
        const goal = goals.find(g => g.measurementType === type && g.status === 'active');
        return goal ? goal.targetValue : null;
    };
    const chartData = [...records].reverse().map(r => ({
        date: new Date(r.date).toLocaleDateString(),
        peso: r.measurements.weight || 0,
        cintura: r.measurements.waist,
        cadera: r.measurements.hips,
        whr: r.measurements.hips ? (r.measurements.waist / r.measurements.hips).toFixed(2) : 0,
        tronco: (r.measurements.pecho + r.measurements.back + r.measurements.neck) / 3,
        brazoDer: r.measurements.arm.right,
        brazoIzq: r.measurements.arm.left,
        piernaDer: r.measurements.thigh.right,
        piernaIzq: r.measurements.thigh.left,
        condition: r.metadata?.condition || 'fasted',
        sleepHours: r.metadata?.sleepHours || 8,
    }));

    const latest = records[0];
    const previous = records[1];

    // Intelligent Alerts
    const alerts = [];
    if (latest && previous) {
        // Asymmetries
        const armDiff = Math.abs(latest.measurements.arm.left - latest.measurements.arm.right);
        if (armDiff > 1.5) alerts.push({ type: 'warning', msg: `Asimetría en brazos detectada: ${armDiff.toFixed(1)}cm` });

        const legDiff = Math.abs(latest.measurements.thigh.left - latest.measurements.thigh.right);
        if (legDiff > 1.5) alerts.push({ type: 'warning', msg: `Asimetría en muslos detectada: ${legDiff.toFixed(1)}cm` });

        // Stagnation (last 3 records)
        if (records.length >= 3) {
            const last3 = records.slice(0, 3);
            const weightDelta = last3[0].measurements.weight - last3[2].measurements.weight;
            if (Math.abs(weightDelta) < 0.2) {
                alerts.push({ type: 'info', msg: 'Peso estancado en las últimas 3 mediciones.' });
            }
        }
    }

    const whrValue = latest ? (latest.measurements.waist / latest.measurements.hips).toFixed(2) : '--';
    const whrThreshold = sex === 'female' ? 0.85 : 0.90;

    // Simple heuristic for arm potential (Male model) - Just a label change for females maybe?
    // For now we keep the calculation but acknowledge it's a rough ratio
    const armPotential = latest ? (latest.measurements.arm.right / latest.measurements.wrist.right).toFixed(2) : '--';

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            const conditionMap: Record<string, string> = {
                fasted: 'Ayunas 🧪',
                post_workout: 'Post-Entreno (Pump) 🔥',
                rest_day: 'Descanso 💤'
            };

            return (
                <div className="custom-tooltip glass">
                    <p className="label">{label}</p>
                    <div className="data-points">
                        {payload.map((entry: any, index: number) => (
                            <p key={index} style={{ color: entry.color }}>
                                {entry.name}: <strong>{entry.value}</strong>
                            </p>
                        ))}
                    </div>
                    <div className="meta-info">
                        <p>Estado: <span>{conditionMap[data.condition] || data.condition}</span></p>
                        <p>Sueño: <span>{data.sleepHours} hrs</span></p>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="analysis-view animate-fade">
            <header className="view-header-stats">
                <div className="stat-card-mini glass">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        Indice W/H (Cintura/Cadera)
                        <AppTooltip
                            width="300px"
                            content={
                                <div className="text-xs space-y-2">
                                    <p className="font-bold border-b border-white/10 pb-1 mb-2">RANGOS CLÍNICOS (HOMBRES)</p>

                                    <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 items-start">
                                        <span className="text-emerald-400 font-bold whitespace-nowrap">≤ 0.89</span>
                                        <div>
                                            <span className="text-emerald-400 font-bold">Bajo Riesgo</span>
                                            <ul className="list-disc pl-3 opacity-70 text-[10px] leading-tight space-y-1 mt-1">
                                                <li>Buena distribución de grasa</li>
                                                <li>Predominio subcutáneo</li>
                                                <li>Menor riesgo cardiometabólico</li>
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
                                                <li>Mayor riesgo: Resistencia a la insulina, Hipertensión, Enfermedad cardiovascular</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            }
                            position="bottom"
                        >
                            <HelpCircle size={14} style={{ opacity: 0.6, cursor: 'help' }} />
                        </AppTooltip>
                    </label>
                    <div className="value">{whrValue}</div>
                    <span className="subtitle">
                        {Number(whrValue) < whrThreshold
                            ? 'Rango Saludable'
                            : 'Riesgo Elevado'
                        }
                        <span style={{ fontSize: '0.6em', opacity: 0.7 }}> (Ref: {whrThreshold})</span>
                    </span>
                </div>
                <div className="stat-card-mini glass">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        Ratio Brazo/Muñeca
                        <AppTooltip
                            width="300px"
                            content={
                                <div className="text-xs space-y-2">
                                    <p className="font-bold border-b border-white/10 pb-1 mb-2">POTENCIAL ESTRUCTURAL (BRAZOS)</p>

                                    <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 items-start">
                                        <span className="text-red-400 font-bold whitespace-nowrap">≤ 2.1</span>
                                        <div>
                                            <span className="text-red-400 font-bold">Bajo potencial</span>
                                            <ul className="list-disc pl-3 opacity-70 text-[10px] leading-tight space-y-1 mt-1">
                                                <li>Estructura fina</li>
                                                <li>Brazos grandes se ven "llenos" pero no masivos</li>
                                            </ul>
                                        </div>

                                        <span className="text-yellow-400 font-bold whitespace-nowrap">2.2 - 2.4</span>
                                        <div>
                                            <span className="text-yellow-400 font-bold">Potencial medio</span>
                                            <ul className="list-disc pl-3 opacity-70 text-[10px] leading-tight space-y-1 mt-1">
                                                <li>Buen balance estructura / músculo</li>
                                                <li>Físico atlético sólido</li>
                                            </ul>
                                        </div>

                                        <span className="text-emerald-400 font-bold whitespace-nowrap">≥ 2.5</span>
                                        <div>
                                            <span className="text-emerald-400 font-bold">Alto potencial</span>
                                            <ul className="list-disc pl-3 opacity-70 text-[10px] leading-tight space-y-1 mt-1">
                                                <li>Muñeca gruesa + gran masa muscular</li>
                                                <li>Brazos con look "culturista"</li>
                                            </ul>
                                        </div>
                                    </div>
                                    <div className="mt-2 pt-2 border-t border-white/10 text-[10px] opacity-60 italic">
                                        ⚠️ Ojo: no es un límite genético duro, es potencial visual y estructural.
                                    </div>
                                </div>
                            }
                            position="bottom"
                        >
                            <HelpCircle size={12} className="text-secondary opacity-60 cursor-help" />
                        </AppTooltip>
                    </label>
                    <div className="value">{armPotential}</div>
                    <span className="subtitle">Potencial Genético</span>
                </div>
                <div className="stat-card-mini glass">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        Ratio Cintura/Pecho
                        <AppTooltip content="Relación entre cintura y pecho. Ideal 'Old School' ≈ 0.70 - 0.75 (V-Taper)." position="bottom">
                            <HelpCircle size={12} className="text-secondary opacity-60 cursor-help" />
                        </AppTooltip>
                    </label>
                    <div className="value">
                        {latest ? (latest.measurements.waist / latest.measurements.pecho).toFixed(2) : '--'}
                    </div>
                    <span className="subtitle">Estética (V-Shape)</span>
                </div>
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
                                <Tooltip content={<CustomTooltip />} />
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
                                <Tooltip content={<CustomTooltip />} />
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
                                <Tooltip content={<CustomTooltip />} />
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
                                <Tooltip content={<CustomTooltip />} />
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
                                <Tooltip content={<CustomTooltip />} />
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
        }
        .view-header-stats {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1.5rem;
        }
        .stat-card-mini {
            padding: 1.25rem;
            border-radius: 16px;
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
            position: relative;
            z-index: 1;
            transition: all 0.2s ease;
        }
        .stat-card-mini:hover {
            z-index: 50;
            background: rgba(255, 255, 255, 0.03);
            transform: translateY(-2px);
        }
        .stat-card-mini label {
            font-size: 0.65rem;
            color: var(--text-secondary);
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .stat-card-mini .value {
            font-size: 1.5rem;
            font-weight: 700;
            color: #f59e0b;
        }
        .stat-card-mini .subtitle {
            font-size: 0.7rem;
            color: var(--text-secondary);
            opacity: 0.7;
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
          grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          gap: 1.5rem;
        }
        @media (max-width: 500px) {
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

        .custom-tooltip {
            padding: 1rem;
            border-radius: 12px;
            font-size: 0.85rem;
            box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        }
        .custom-tooltip .label {
            margin-bottom: 0.5rem;
            font-weight: bold;
            color: white;
            border-bottom: 1px solid rgba(255,255,255,0.1);
            padding-bottom: 0.5rem;
        }
        .custom-tooltip .data-points {
            margin-bottom: 0.75rem;
        }
        .custom-tooltip .meta-info {
            padding-top: 0.5rem;
            border-top: 1px dashed rgba(255,255,255,0.1);
            font-size: 0.75rem;
            color: var(--text-secondary);
        }
        .custom-tooltip .meta-info span {
            color: #f59e0b;
            font-weight: 600;
        }
      `}</style>
        </div>
    );
};
