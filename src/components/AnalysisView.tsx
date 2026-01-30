import type { MeasurementRecord } from '../types/measurements';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';

interface Props {
    records: MeasurementRecord[];
}

export const AnalysisView = ({ records }: Props) => {
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
    const armPotential = latest ? (latest.measurements.arm.right / latest.measurements.wrist.right).toFixed(2) : '--';

    return (
        <div className="analysis-view animate-fade">
            <header className="view-header-stats">
                <div className="stat-card-mini glass">
                    <label>Indice W/H (Cintura/Cadera)</label>
                    <div className="value">{whrValue}</div>
                    <span className="subtitle">{Number(whrValue) < 0.9 ? 'Rango Saludable' : 'Riesgo Elevado'}</span>
                </div>
                <div className="stat-card-mini glass">
                    <label>Ratio Brazo/Muñeca</label>
                    <div className="value">{armPotential}</div>
                    <span className="subtitle">Potencial Genético</span>
                </div>
                <div className="stat-card-mini glass">
                    <label>Evolución Tronco</label>
                    <div className="value">
                        {latest && previous ? (((latest.measurements.pecho + latest.measurements.back) / 2) - ((previous.measurements.pecho + previous.measurements.back) / 2)).toFixed(1) : '0.0'}
                        <small>cm</small>
                    </div>
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
                    <h3>Peso & Cintura</h3>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                                <YAxis stroke="#94a3b8" fontSize={12} />
                                <Tooltip
                                    contentStyle={{ background: '#1a1a1d', border: '1px solid #334155' }}
                                    itemStyle={{ color: '#f8fafc' }}
                                />
                                <Legend />
                                <Line type="monotone" dataKey="peso" stroke="#f59e0b" name="Peso (kg)" strokeWidth={2} dot={{ r: 4 }} />
                                <Line type="monotone" dataKey="cintura" stroke="#fbbf24" name="Cintura (cm)" strokeWidth={2} dot={{ r: 4 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="chart-card glass">
                    <h3>Comparativa Brazos (R/L)</h3>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                                <YAxis stroke="#94a3b8" fontSize={12} />
                                <Tooltip
                                    contentStyle={{ background: '#1a1a1d', border: '1px solid #334155' }}
                                />
                                <Legend />
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
                                <Tooltip
                                    contentStyle={{ background: '#1a1a1d', border: '1px solid #334155' }}
                                />
                                <Legend />
                                <Line type="monotone" dataKey="piernaDer" stroke="#f59e0b" name="Derecho" strokeWidth={2} />
                                <Line type="monotone" dataKey="piernaIzq" stroke="#fbbf24" name="Izquierdo" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="chart-card glass">
                    <h3>Proporción Tronco (Pecho/Espalda/Cuello)</h3>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                                <YAxis stroke="#94a3b8" fontSize={12} />
                                <Tooltip contentStyle={{ background: '#1a1a1d', border: '1px solid #334155' }} />
                                <Legend />
                                <Line type="step" dataKey="tronco" stroke="#f59e0b" name="Media Tronco" strokeWidth={3} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="chart-card glass">
                    <h3>Ratio Cintura/Cadera (Salud Metabólica)</h3>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                                <YAxis domain={[0.5, 1.2]} stroke="#94a3b8" fontSize={12} />
                                <Tooltip contentStyle={{ background: '#1a1a1d', border: '1px solid #334155' }} />
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
      `}</style>
        </div>
    );
};
