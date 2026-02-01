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
}

export const MeasurementChart = ({ title, tooltip, data, children, height = 300 }: Props) => {
    return (
        <div className="chart-card glass">
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {title}
                {tooltip && (
                    <AppTooltip content={tooltip} position="right">
                        <HelpCircle size={14} className="text-secondary opacity-50 cursor-help" />
                    </AppTooltip>
                )}
            </h3>
            <div className="chart-container">
                <ResponsiveContainer width="100%" height={height}>
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                        <YAxis stroke="#94a3b8" fontSize={12} />
                        <Tooltip content={<AnalysisChartTooltip />} />
                        <Legend />
                        {children}
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
