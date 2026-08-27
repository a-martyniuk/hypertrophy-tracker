import {
    LineChart,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';
import { HelpCircle } from 'lucide-react';
import { Tooltip as AppTooltip } from '../Tooltip';
import { AnalysisChartTooltip } from './AnalysisTooltip';

interface Props {
    title: string;
    tooltip?: string;
    data: any[];
    children: React.ReactNode;
    height?: number;
    domain?: [any, any];
}

export const MeasurementChart = ({ title, tooltip, data, children, height = 320, domain = ['auto', 'auto'] }: Props) => {
    return (
        <div className="chart-card glass" style={{ background: 'rgba(14, 17, 27, 0.85)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '16px', padding: '1.25rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.05rem', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-head)', margin: '0 0 1rem 0' }}>
                {title}
                {tooltip && (
                    <AppTooltip content={tooltip} position="right">
                        <HelpCircle size={15} style={{ color: 'var(--text-secondary)', opacity: 0.7, cursor: 'help' }} />
                    </AppTooltip>
                )}
            </h3>
            <div className="chart-container" style={{ width: '100%' }}>
                <ResponsiveContainer width="100%" height={height}>
                    <LineChart data={data} margin={{ top: 10, right: 15, left: -10, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.07)" />
                        <XAxis dataKey="date" stroke="#64748b" fontSize={11} fontFamily="var(--font-mono)" tickLine={false} />
                        <YAxis domain={domain} stroke="#64748b" fontSize={11} fontFamily="var(--font-mono)" tickLine={false} />
                        <Tooltip content={<AnalysisChartTooltip />} />
                        <Legend wrapperStyle={{ paddingTop: '12px', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }} />
                        {children}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
