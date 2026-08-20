import React from 'react';
import { Activity, Flame, Compass, ChevronRight, FileText, Sparkles } from 'lucide-react';
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
                return 'badge-amber';
            case 'LEAN_CUT':
                return 'badge-sky';
            case 'SURPLUS_GROWTH':
                return 'badge-amber';
            case 'FIRST_RECORD':
                return 'badge-emerald';
            default:
                return 'bg-neutral-800 text-neutral-300 border-neutral-700';
        }
    };

    return (
        <div className="card glass p-6 relative overflow-hidden border border-amber-500/20 bg-gradient-to-br from-neutral-900/90 via-neutral-950/95 to-neutral-900/90 shadow-2xl transition-all duration-300 hover:border-amber-500/40">
            {/* Ambient HUD Accent */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-sky-500/5 rounded-full blur-2xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-sm">
                        <Activity size={16} />
                    </div>
                    <span className="font-mono text-xs text-amber-400 font-bold tracking-wider uppercase">
                        Diagnóstico Táctico Biomecánico
                    </span>
                </div>
                <span className={`badge ${getBadgeStyle()} font-mono text-[11px]`}>
                    <Sparkles size={12} className="inline mr-1" />
                    {diagnosis.statusText}
                </span>
            </div>

            <h3 className="text-xl font-bold text-white mb-2 font-mono flex items-center gap-2 tracking-tight">
                <Flame size={20} className="text-amber-400 flex-shrink-0 animate-pulse" />
                <span>{diagnosis.headline}</span>
            </h3>

            <p className="text-sm text-neutral-300/90 mb-4 leading-relaxed font-sans">
                {diagnosis.summary}
            </p>

            {/* Highlights Chips */}
            {diagnosis.highlights.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                    {diagnosis.highlights.map((h, i) => (
                        <div
                            key={i}
                            className="bg-neutral-900/80 border border-neutral-700/60 px-3 py-1 rounded-lg text-xs font-mono text-amber-200/90 shadow-sm"
                        >
                            {h}
                        </div>
                    ))}
                    {diagnosis.vTaperDeltaPercent !== undefined && diagnosis.vTaperDeltaPercent !== 0 && (
                        <div className="bg-amber-500/15 border border-amber-500/40 px-3 py-1 rounded-lg text-xs font-mono text-amber-300 font-bold shadow-sm">
                            V-Taper: {diagnosis.vTaperDeltaPercent > 0 ? `+${diagnosis.vTaperDeltaPercent}%` : `${diagnosis.vTaperDeltaPercent}%`}
                        </div>
                    )}
                </div>
            )}

            {/* Actionable Direct Advice */}
            <div className="bg-neutral-950/80 border border-amber-500/20 rounded-xl p-4 text-xs font-mono mb-4 flex items-start gap-3 shadow-inner">
                <Compass className="text-amber-400 flex-shrink-0 mt-0.5" size={18} />
                <div className="text-neutral-200 leading-relaxed">
                    <span className="text-amber-400 font-bold uppercase tracking-wider">Directriz Táctica: </span>
                    {diagnosis.actionableAdvice}
                </div>
            </div>

            {/* Bottom Actions */}
            {onOpenReport && (
                <div className="flex justify-end pt-1">
                    <button
                        onClick={onOpenReport}
                        className="btn-secondary !text-xs !py-2 !px-4 flex items-center gap-2 font-mono text-amber-400 border-amber-500/30 hover:border-amber-400 hover:bg-amber-500/10 shadow-sm"
                    >
                        <FileText size={15} />
                        <span className="font-bold">GENERAR FICHA TÁCTICA HD</span>
                        <ChevronRight size={15} />
                    </button>
                </div>
            )}
        </div>
    );
};
