interface CustomTooltipProps {
    active?: boolean;
    payload?: any[];
    label?: string;
}

export const AnalysisChartTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        const conditionMap: Record<string, string> = {
            fasted: 'Ayunas 🧪',
            post_workout: 'Post-Entreno (Pump) 🔥',
            rest_day: 'Descanso 💤'
        };

        return (
            <div className="custom-tooltip glass">
                <style>{`
                    .custom-tooltip {
                        padding: 1rem;
                        border-radius: 12px;
                        font-size: 0.85rem;
                        box-shadow: 0 8px 32px rgba(0,0,0,0.4);
                        background: rgba(13, 13, 15, 0.9);
                        border: 1px solid var(--border-color);
                        color: white;
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
