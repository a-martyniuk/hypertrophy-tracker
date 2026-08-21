import React from 'react';
import { Activity, CheckCircle, AlertTriangle, Compass } from 'lucide-react';
import type { ComprehensiveAnalysis } from '../../utils/benchmarkAnalysis';

interface Props {
    analysis: ComprehensiveAnalysis;
}

export const PhysiqueOverviewHero: React.FC<Props> = ({ analysis }) => {
    const {
        overallLevelLabel,
        overallScore,
        ffmiScore,
        strongPoints,
        laggingPoints,
        recommendation
    } = analysis;

    return (
        <div className="card glass p-6 md:p-8 rounded-3xl border border-amber-500/30 bg-gradient-to-br from-neutral-950 via-neutral-900/90 to-amber-950/20 shadow-2xl relative overflow-hidden space-y-6">
            {/* Background Ambience */}
            <div
                className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"
            />

            {/* Top Row: Overall Score & FFMI */}
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative">
                <div>
                    <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-bold uppercase tracking-wider mb-2">
                        <Activity size={16} />
                        <span>Auditoría de Desarrollo Antropométrico</span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-extrabold text-white font-sans">
                        Nivel de Desarrollo: <span className="text-amber-400 font-mono">{overallLevelLabel}</span>
                    </h2>
                    <p className="text-xs md:text-sm text-neutral-300 mt-1 max-w-xl leading-relaxed">
                        Evaluación integral comparada con los modelos antropométricos de <strong>Casey Butt</strong> (límite muscular natural por estructura ósea) y los cánones de <strong>Steve Reeves</strong>.
                    </p>
                </div>

                {/* Score Dial & FFMI */}
                <div className="flex items-center gap-4 bg-neutral-950/80 border border-white/10 p-4 rounded-2xl shadow-inner backdrop-blur-md">
                    <div className="text-center font-mono pr-4 border-r border-white/10">
                        <div className="text-[10px] text-neutral-400 uppercase font-bold">FFMI Normalizado</div>
                        <div className="text-2xl font-black text-amber-400 mt-0.5">{ffmiScore.value}</div>
                        <div className="text-[10px] text-emerald-400 font-semibold">{ffmiScore.statusText}</div>
                    </div>

                    <div className="text-center font-mono">
                        <div className="text-[10px] text-neutral-400 uppercase font-bold">% Techo Genético</div>
                        <div className="text-2xl font-black text-white mt-0.5">{overallScore}%</div>
                        <div className="text-[10px] text-neutral-400">Promedio Corporal</div>
                    </div>
                </div>
            </div>

            {/* Middle Row: Strong Points vs Lagging Points */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Puntos Fuertes */}
                <div className="bg-neutral-950/60 p-4 rounded-2xl border border-emerald-500/20 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs font-bold uppercase mb-2">
                            <CheckCircle size={14} />
                            <span>Grupos Musculares Dominantes</span>
                        </div>
                        {strongPoints.length > 0 ? (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {strongPoints.map((sp) => (
                                    <span
                                        key={sp.key}
                                        className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-mono text-xs rounded-lg font-bold flex items-center gap-1.5"
                                    >
                                        <span>{sp.label}</span>
                                        <span className="text-white font-normal">({sp.current} cm - {sp.percentOfMax}%)</span>
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-neutral-400 mt-1">
                                Desarrollo armónico y uniforme en todos los grupos evaluados.
                            </p>
                        )}
                    </div>
                </div>

                {/* Puntos Rezagados */}
                <div className="bg-neutral-950/60 p-4 rounded-2xl border border-amber-500/20 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-bold uppercase mb-2">
                            <AlertTriangle size={14} />
                            <span>Grupos con Mayor Potencial de Crecimiento</span>
                        </div>
                        {laggingPoints.length > 0 ? (
                            <div className="flex flex-wrap gap-2 mt-2">
                                {laggingPoints.map((lp) => (
                                    <span
                                        key={lp.key}
                                        className="px-3 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 font-mono text-xs rounded-lg font-bold flex items-center gap-1.5"
                                    >
                                        <span>{lp.label}</span>
                                        <span className="text-white font-normal">({lp.current} cm - {lp.percentOfMax}%)</span>
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <p className="text-xs text-neutral-400 mt-1">
                                Sin grupos rezagados significativos respecto al promedio general.
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Directive */}
            <div className="bg-neutral-950/80 p-4 rounded-2xl border border-amber-500/30 font-mono text-xs flex items-start gap-3 shadow-inner">
                <Compass className="text-amber-400 flex-shrink-0 mt-0.5" size={18} />
                <div className="text-neutral-200 leading-relaxed font-sans text-xs">
                    <span className="text-amber-400 font-mono font-bold uppercase tracking-wider">Directriz de Foco Táctico: </span>
                    {recommendation}
                </div>
            </div>
        </div>
    );
};
