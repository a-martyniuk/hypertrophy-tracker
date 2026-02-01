import type { TimeRange } from '../../hooks/useAnalysisData';

interface Props {
    currentRange: TimeRange;
    onChange: (range: TimeRange) => void;
}

const TIME_RANGES: { label: string; value: TimeRange }[] = [
    { label: 'Todo', value: 'all' },
    { label: '1 Año', value: '1y' },
    { label: '6 Meses', value: '6m' },
    { label: '3 Meses', value: '3m' },
];

export const AnalysisFilter = ({ currentRange, onChange }: Props) => {
    return (
        <div className="filters-bar">
            <span className="filter-label">Periodo:</span>
            <div className="filter-buttons">
                {TIME_RANGES.map((range) => (
                    <button
                        key={range.value}
                        className={`filter-btn ${currentRange === range.value ? 'active' : ''}`}
                        onClick={() => onChange(range.value)}
                    >
                        {range.label}
                    </button>
                ))}
            </div>
        </div>
    );
};
