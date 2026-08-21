import React from 'react';
import { Target, TrendingUp, Award } from 'lucide-react';
import type { MuscleBenchmark } from '../../utils/benchmarkAnalysis';

interface Props {
    benchmark: MuscleBenchmark;
    onClick?: () => void;
}

export const BenchmarkCard: React.FC<Props> = ({ benchmark, onClick }) => {
    const {
        label,
        current,
        potentialMax,
        percentOfMax,
        levelLabel,
        levelColor,
        levelBg,
        referenceRanges,
        deltaToNextLevel,
        nextLevelLabel
    } = benchmark;

    return (
        <div
            onClick={onClick}
            className="card glass p-5 rounded-2xl border border-white/10 hover:border-amber-500/40 transition duration-200 cursor-pointer shadow-lg relative overflow-hidden group"
            style={{ background: 'rgba(15, 18, 29, 0.7)' }}
        >
            {/* Top Row: Muscle Name + Level Badge */}
            <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                    <h4 className="text-sm font-bold text-white font-mono group-hover:text-amber-300 transition">
                        {label}
                    </h4>
                    <div className="text-[11px] text-neutral-400 mt-0.5">
                        Potencial Genético: <span className="text-neutral-300 font-semibold">{potentialMax} cm</span>
                    </div>
                </div>

                <div
                    className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 border"
                    style={{
                        color: levelColor,
                        backgroundColor: levelBg,
                        borderColor: `${levelColor}40`
                    }}
                >
                    <Award size={13} />
                    <span>{levelLabel}</span>
                </div>
            </div>

            {/* Middle: Big Value + Percent */}
            <div className="flex items-baseline justify-between mb-3">
                <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-white font-mono">{current}</span>
                    <span className="text-xs text-neutral-400 font-mono">cm</span>
                </div>
                <div className="text-right">
                    <span className="text-sm font-bold font-mono text-amber-400">{percentOfMax}%</span>
                    <span className="text-[10px] text-neutral-400 block">del techo genético</span>
                </div>
            </div>

            {/* Segmented Multi-Tier Progress Bar */}
            <div className="mb-3">
                <div className="w-full h-2.5 bg-neutral-900 rounded-full overflow-hidden p-0.5 border border-white/5 flex gap-1">
                    {/* Tier 1: Base */}
                    <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                            width: '25%',
                            backgroundColor: percentOfMax >= 70 ? '#64748b' : 'rgba(255, 255, 255, 0.1)'
                        }}
                    />
                    {/* Tier 2: Intermedio */}
                    <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                            width: '25%',
                            backgroundColor: percentOfMax >= 80 ? '#60a5fa' : 'rgba(255, 255, 255, 0.1)'
                        }}
                    />
                    {/* Tier 3: Avanzado */}
                    <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                            width: '25%',
                            backgroundColor: percentOfMax >= 90 ? '#34d399' : 'rgba(255, 255, 255, 0.1)'
                        }}
                    />
                    {/* Tier 4: Élite Natural */}
                    <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                            width: '25%',
                            backgroundColor: percentOfMax >= 98 ? '#fbbf24' : 'rgba(255, 255, 255, 0.1)'
                        }}
                    />
                </div>

                {/* Range Labels underneath */}
                <div className="flex justify-between text-[9px] font-mono text-neutral-400 mt-1.5 px-0.5">
                    <span>Base &lt;{referenceRanges.beginner[1]}</span>
                    <span>Inter. {referenceRanges.intermediate[0]}-{referenceRanges.intermediate[1]}</span>
                    <span>Avanz. {referenceRanges.advanced[0]}-{referenceRanges.advanced[1]}</span>
                    <span className="text-amber-400 font-semibold">Élite &gt;{referenceRanges.elite[0]}cm</span>
                </div>
            </div>

            {/* Bottom Next Step Delta */}
            {deltaToNextLevel && nextLevelLabel ? (
                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] font-mono">
                    <span className="text-neutral-400 flex items-center gap-1">
                        <TrendingUp size={12} className="text-amber-400" />
                        <span>Siguiente Nivel:</span>
                    </span>
                    <span className="text-amber-300 font-semibold">
                        +{deltaToNextLevel} cm para {nextLevelLabel}
                    </span>
                </div>
            ) : (
                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-emerald-400">
                    <span className="flex items-center gap-1">
                        <Target size={12} />
                        <span>Nivel Máximo:</span>
                    </span>
                    <span className="font-semibold">¡Límite Genético Alcanzado!</span>
                </div>
            )}
        </div>
    );
};
