import React from 'react';
import { Sparkles, Info, CheckCircle2 } from 'lucide-react';
import type { RatioBenchmark } from '../../utils/benchmarkAnalysis';

interface Props {
    benchmark: RatioBenchmark;
}

export const RatioBenchmarkCard: React.FC<Props> = ({ benchmark }) => {
    const {
        name,
        label,
        scaleDescription,
        statusText,
        statusColor,
        statusBg,
        explanation,
        referenceTiers
    } = benchmark;

    return (
        <div
            className="card glass p-5 rounded-2xl border border-white/10 shadow-lg relative overflow-hidden flex flex-col justify-between"
            style={{ background: 'rgba(15, 18, 29, 0.7)' }}
        >
            <div>
                {/* Header: Ratio Name & Status Badge */}
                <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                        <h4 className="text-sm font-bold text-white font-mono flex items-center gap-1.5">
                            <Sparkles size={14} className="text-amber-400 flex-shrink-0" />
                            <span>{name}</span>
                        </h4>
                        <div className="text-[11px] text-neutral-400 mt-0.5 font-mono">
                            {scaleDescription}
                        </div>
                    </div>

                    <div
                        className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 border flex-shrink-0"
                        style={{
                            color: statusColor,
                            backgroundColor: statusBg,
                            borderColor: `${statusColor}40`
                        }}
                    >
                        <span>{statusText}</span>
                    </div>
                </div>

                {/* Big Metric Display */}
                <div className="my-3 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-amber-400 font-mono">{label}</span>
                </div>

                {/* Explanation */}
                <p className="text-xs text-neutral-300 leading-relaxed mb-4">
                    {explanation}
                </p>
            </div>

            {/* Reference Tiers Scale */}
            <div className="bg-neutral-950/60 p-3 rounded-xl border border-white/5 font-mono text-[11px]">
                <div className="text-[10px] text-neutral-400 uppercase tracking-wider font-bold mb-2 flex items-center gap-1">
                    <Info size={11} className="text-amber-400" />
                    <span>Escala de Niveles y Referencia:</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {referenceTiers.map((tier, idx) => (
                        <div
                            key={idx}
                            className={`p-2 rounded-lg border text-center transition-all ${
                                tier.isCurrent
                                    ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold shadow-sm'
                                    : 'bg-neutral-900/40 border-white/5 text-neutral-400'
                            }`}
                        >
                            <div className="text-[10px] truncate">{tier.label}</div>
                            <div className="text-xs mt-0.5 text-white font-semibold">{tier.range}</div>
                            {tier.isCurrent && (
                                <div className="text-[9px] text-amber-400 font-bold mt-0.5 flex items-center justify-center gap-0.5">
                                    <CheckCircle2 size={10} />
                                    <span>TU VALOR</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
