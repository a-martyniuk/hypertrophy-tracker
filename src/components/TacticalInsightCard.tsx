import React from 'react';
import { Activity, Flame, Compass, ChevronRight, FileText, Sparkles, TrendingUp, TrendingDown } from 'lucide-react';
import type { MeasurementRecord } from '../types/measurements';
import { generateTacticalDiagnosis } from '../utils/tacticalDiagnosis';
import './TacticalInsightCard.css';

interface Props {
    latestRecord?: MeasurementRecord;
    previousRecord?: MeasurementRecord;
    onOpenReport?: () => void;
}

export const TacticalInsightCard: React.FC<Props> = ({
    latestRecord,
    previousRecord,
    onOpenReport
}) => {
    const diagnosis = generateTacticalDiagnosis(latestRecord, previousRecord);

    const getBadgeClass = () => {
        switch (diagnosis.statusBadge) {
            case 'CLEAN_RECOMP':
            case 'HYPERTROPHY_PEAK':
            case 'SURPLUS_GROWTH':
                return 'amber';
            case 'LEAN_CUT':
                return 'sky';
            case 'FIRST_RECORD':
                return 'emerald';
            default:
                return 'amber';
        }
    };

    return (
        <div className="tactical-card">
            {/* Ambient Accent Aura */}
            <div className="tactical-ambient-aura" />

            {/* Header: Tag + Badge */}
            <div className="tactical-header">
                <div className="tactical-tag">
                    <div className="tactical-tag-icon">
                        <Activity size={16} />
                    </div>
                    <span>Diagnóstico Táctico Biomecánico</span>
                </div>

                <div className={`tactical-badge ${getBadgeClass()}`}>
                    <Sparkles size={12} />
                    <span>{diagnosis.statusText}</span>
                </div>
            </div>

            {/* Main Headline */}
            <h3 className="tactical-headline">
                <Flame size={22} style={{ color: '#fbbf24', flexShrink: 0 }} />
                <span>{diagnosis.headline}</span>
            </h3>

            {/* Summary */}
            <p className="tactical-summary">
                {diagnosis.summary}
            </p>

            {/* Structured Metric Chips Grid */}
            {diagnosis.metrics.length > 0 && (
                <div className="tactical-metrics-grid">
                    {diagnosis.metrics.map((m, i) => (
                        <div key={i} className="tactical-metric-card">
                            <div className="tactical-metric-label">{m.label}</div>
                            <div className="tactical-metric-val">
                                <span>{m.value}</span>
                                {m.trend === 'up' && <TrendingUp size={14} style={{ color: '#34d399' }} />}
                                {m.trend === 'down' && <TrendingDown size={14} style={{ color: '#38bdf8' }} />}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Actionable Tactical Directive */}
            <div className="tactical-directive-box">
                <Compass size={18} className="directive-icon" style={{ color: '#fbbf24', flexShrink: 0, marginTop: '2px' }} />
                <div className="tactical-directive-text">
                    <strong style={{ color: '#fbbf24', textTransform: 'uppercase', marginRight: '6px' }}>
                        Directriz Táctica:
                    </strong>
                    <span>{diagnosis.actionableAdvice}</span>
                </div>
            </div>

            {/* Bottom Actions */}
            {onOpenReport && (
                <div className="tactical-footer">
                    <button
                        onClick={onOpenReport}
                        className="tactical-report-btn"
                    >
                        <FileText size={15} />
                        <span>GENERAR FICHA TÁCTICA HD</span>
                        <ChevronRight size={15} />
                    </button>
                </div>
            )}
        </div>
    );
};
