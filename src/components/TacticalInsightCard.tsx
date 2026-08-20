import React from 'react';
import { Activity, Flame, Compass, ChevronRight, FileText } from 'lucide-react';
import type { MeasurementRecord } from '../types/measurements';
import { generateTacticalDiagnosis } from '../utils/tacticalDiagnosis';

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

    const getBadgeStyle = () => {
        switch (diagnosis.statusBadge) {
            case 'CLEAN_RECOMP':
            case 'HYPERTROPHY_PEAK':
                return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
            case 'LEAN_CUT':
                return 'bg-blue-500/20 text-blue-400 border-blue-500/40';
            case 'SURPLUS_GROWTH':
                return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40';
            case 'FIRST_RECORD':
                return 'bg-green-500/20 text-green-400 border-green-500/40';
            default:
                return 'bg-neutral-800 text-neutral-300 border-neutral-700';
        }
    };

    return (
        <div className="card glass p-5 relative overflow-hidden border border-amber-500/25 bg-gradient-to-r from-neutral-950 via-neutral-900/90 to-neutral-950">
            {/* Ambient HUD Accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                    <Activity className="text-amber-400" size={18} />
                    <span className="font-mono text-xs text-amber-400 font-semibold tracking-wider uppercase">
                        Diagnóstico Táctico Biomecánico
                    </span>
                </div>
                <span className={`font-mono text-[11px] px-2.5 py-0.5 rounded-full border ${getBadgeStyle()}`}>
                    {diagnosis.statusText}
                </span>
            </div>

            <h3 className="text-lg font-bold text-neutral-100 mb-2 font-mono flex items-center gap-2">
                <Flame size={18} className="text-amber-400 flex-shrink-0" />
                <span>{diagnosis.headline}</span>
            </h3>

            <p className="text-xs text-neutral-300 mb-4 leading-relaxed">
                {diagnosis.summary}
            </p>

            {/* Highlights Chips */}
            {diagnosis.highlights.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                    {diagnosis.highlights.map((h, i) => (
                        <div
                            key={i}
                            className="bg-neutral-900/80 border border-neutral-800 px-2.5 py-1 rounded text-[11px] font-mono text-amber-200/90"
                        >
                            {h}
                        </div>
                    ))}
                    {diagnosis.vTaperDeltaPercent !== undefined && diagnosis.vTaperDeltaPercent !== 0 && (
                        <div className="bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded text-[11px] font-mono text-amber-300 font-semibold">
                            V-Taper: {diagnosis.vTaperDeltaPercent > 0 ? `+${diagnosis.vTaperDeltaPercent}%` : `${diagnosis.vTaperDeltaPercent}%`}
                        </div>
                    )}
                </div>
            )}

            {/* Actionable Direct Advice */}
            <div className="bg-neutral-950/70 border border-neutral-800/90 rounded p-3 text-xs font-mono mb-4 flex items-start gap-2.5">
                <Compass className="text-amber-400 flex-shrink-0 mt-0.5" size={16} />
                <div className="text-neutral-300">
                    <span className="text-amber-400 font-semibold">Directriz Táctica: </span>
                    {diagnosis.actionableAdvice}
                </div>
            </div>

            {/* Bottom Actions */}
            {onOpenReport && (
                <div className="flex justify-end pt-1">
                    <button
                        onClick={onOpenReport}
                        className="btn-secondary !text-xs !py-1.5 !px-3 flex items-center gap-1.5 font-mono text-amber-400 border-amber-500/30 hover:border-amber-400"
                    >
                        <FileText size={14} />
                        <span>Generar Ficha Táctica Completa</span>
                        <ChevronRight size={14} />
                    </button>
                </div>
            )}
        </div>
    );
};
