import type { TimeRange } from '../../hooks/useAnalysisData';

interface Props {
    currentRange: TimeRange;
    onChange: (range: TimeRange) => void;
}

const TIME_RANGES: { labelKey: string; value: TimeRange }[] = [
    { labelKey: 'analysis.filter.all', value: 'all' },
    { labelKey: 'analysis.filter.1y', value: '1y' },
    { labelKey: 'analysis.filter.6m', value: '6m' },
    { labelKey: 'analysis.filter.3m', value: '3m' },
];

import { useTranslation } from 'react-i18next';

export const AnalysisFilter = ({ currentRange, onChange }: Props) => {
    const { t } = useTranslation();
    return (
        <div className="filters-bar">
            <span className="filter-label">{t('analysis.filter.period')}:</span>
            <div className="filter-buttons">
                {TIME_RANGES.map((range) => (
                    <button
                        key={range.value}
                        className={`filter-btn ${currentRange === range.value ? 'active' : ''}`}
                        onClick={() => onChange(range.value)}
                    >
                        {t(range.labelKey)}
                    </button>
                ))}
            </div>
        </div>
    );
};
