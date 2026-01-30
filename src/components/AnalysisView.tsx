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
        brazoDer: r.measurements.arm.right,
        brazoIzq: r.measurements.arm.left,
        piernaDer: r.measurements.thigh.right,
        piernaIzq: r.measurements.thigh.left,
    }));

    return (
        <div className="analysis-view animate-fade">
            <h2>Análisis de Evolución</h2>

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
                                <Line type="monotone" dataKey="peso" stroke="#6366f1" name="Peso (kg)" strokeWidth={2} dot={{ r: 4 }} />
                                <Line type="monotone" dataKey="cintura" stroke="#10b981" name="Cintura (cm)" strokeWidth={2} dot={{ r: 4 }} />
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
                                <Line type="monotone" dataKey="brazoDer" stroke="#6366f1" name="Derecho" strokeWidth={2} />
                                <Line type="monotone" dataKey="brazoIzq" stroke="#f43f5e" name="Izquierdo" strokeWidth={2} />
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
                                <Line type="monotone" dataKey="piernaDer" stroke="#6366f1" name="Derecho" strokeWidth={2} />
                                <Line type="monotone" dataKey="piernaIzq" stroke="#f43f5e" name="Izquierdo" strokeWidth={2} />
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
