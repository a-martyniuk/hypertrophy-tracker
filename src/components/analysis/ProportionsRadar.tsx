import React from 'react';
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    Tooltip as RechartsTooltip
} from 'recharts';
import { Shield, Sparkles, AlertCircle, Award, CheckCircle2 } from 'lucide-react';
import type { BodyMeasurements } from '../../types/measurements';
import { analyzeProportions } from '../../utils/proportions';

interface Props {
    measurements?: BodyMeasurements;
}

export const ProportionsRadar: React.FC<Props> = ({ measurements }) => {
    const analysis = analyzeProportions(measurements);

    if (!analysis || !measurements) {
        return (
            <div className="card glass p-8 text-center text-amber-200/60 rounded-2xl border border-amber-500/20">
                <Shield className="mx-auto mb-3 text-amber-400 opacity-60" size={36} />
                <h4 className="text-base font-bold text-white font-mono mb-1">Telemetría de Simetría en Espera</h4>
                <p className="text-xs text-neutral-400 max-w-md mx-auto">
                    Registra mediciones de torso y extremidades para calcular el radar de simetría clásica y proporciones áureas.
                </p>
            </div>
        );
    }

    const { reevesTriad, adonisIndex, asymmetries, radarData, overallGoldenScore } = analysis;

    return (
        <div className="proportions-container space-y-6 animate-fade">
            {/* Top Score Banner */}
            <div className="card glass p-6 relative overflow-hidden rounded-2xl border border-amber-500/25 bg-gradient-to-r from-amber-950/30 via-neutral-900/60 to-neutral-950/80 shadow-2xl">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
                    <div>
                        <div className="flex items-center gap-2 text-amber-400 font-mono text-xs font-bold uppercase tracking-wider">
                            <Sparkles size={16} />
                            <span>Índice de Armonía Clásica & Proporción Áurea</span>
                        </div>
                        <h3 className="text-2xl font-extrabold text-white mt-1.5 font-sans">
                            Simetría Escultural: <span className="text-amber-400 font-mono">{overallGoldenScore}%</span>
                        </h3>
                        <p className="text-xs text-neutral-300/90 mt-1 max-w-xl leading-relaxed">
                            Comparado con los cánones de la era dorada de Steve Reeves y el índice áureo de Adonis (&Phi; = 1.618).
                        </p>
                    </div>

                    <div className="flex items-center gap-4 bg-neutral-950/60 border border-amber-500/20 px-5 py-3 rounded-xl backdrop-blur-sm">
                        <div className="text-right font-mono">
                            <div className="text-[11px] text-neutral-400 uppercase font-semibold">Pecho / Cintura</div>
                            <div className="text-xl font-extrabold text-amber-300">
                                {adonisIndex.chestWaistRatio || '-'}{' '}
                                <span className="text-xs text-neutral-500 font-normal">/ 1.62 ideal</span>
                            </div>
                        </div>
                        <div className="w-13 h-13 rounded-full border-2 border-amber-500/50 flex items-center justify-center bg-amber-500/15 text-amber-400 font-black font-mono text-sm shadow-md">
                            {adonisIndex.ratioScore}%
                        </div>
                    </div>
                </div>
            </div>

            {/* Grid with Radar Chart and Triad Details */}
            <div className="grid-2col">
                {/* Radar Chart */}
                <div className="card glass p-6 flex flex-col items-center justify-center min-h-[340px] rounded-2xl border border-white/10">
                    <div className="w-full flex items-center justify-between mb-3">
                        <h4 className="font-mono text-sm text-neutral-200 font-bold flex items-center gap-2">
                            <Award size={18} className="text-amber-400" />
                            <span>Radar de Ratios Áureos</span>
                        </h4>
                        <span className="badge badge-amber font-mono text-[11px]">Objetivo = 100%</span>
                    </div>

                    <div className="w-full h-[270px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                                <PolarGrid stroke="rgba(255, 255, 255, 0.1)" strokeDasharray="3 3" />
                                <PolarAngleAxis
                                    dataKey="aspect"
                                    tick={{ fill: '#cbd5e1', fontSize: 11, fontFamily: 'monospace', fontWeight: 600 }}
                                />
                                <PolarRadiusAxis
                                    angle={30}
                                    domain={[0, 100]}
                                    tick={{ fill: '#64748b', fontSize: 9 }}
                                />
                                <Radar
                                    name="Armonía"
                                    dataKey="score"
                                    stroke="#f59e0b"
                                    strokeWidth={2}
                                    fill="#f59e0b"
                                    fillOpacity={0.35}
                                />
                                <RechartsTooltip
                                    content={({ payload }) => {
                                        if (payload && payload.length) {
                                            const data = payload[0].payload;
                                            return (
                                                <div className="bg-neutral-900/95 border border-amber-500/40 p-3 rounded-xl shadow-2xl text-xs font-mono backdrop-blur-md">
                                                    <div className="text-amber-400 font-bold text-sm">{data.aspect}</div>
                                                    <div className="text-neutral-200 mt-1.5">Valor actual: <span className="text-white font-bold">{data.actual}</span></div>
                                                    <div className="text-neutral-400">Ideal clásico: <span className="text-amber-300 font-semibold">{data.ideal}</span></div>
                                                    <div className="text-neutral-300 mt-1">Puntaje: <span className="text-emerald-400 font-bold">{data.score}%</span></div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Steve Reeves Triad Breakdown */}
                <div className="card glass p-6 flex flex-col justify-between space-y-4 rounded-2xl border border-white/10">
                    <div>
                        <h4 className="font-mono text-sm text-neutral-200 font-bold mb-2 flex items-center gap-2">
                            <Shield size={18} className="text-amber-400" />
                            <span>Tríada Clásica de Steve Reeves</span>
                        </h4>
                        <p className="text-xs text-neutral-300/90 mb-4 leading-relaxed">
                            Para la máxima armonía visual de la era dorada, el perímetro de <strong>Brazo</strong>, <strong>Cuello</strong> y <strong>Gemelo</strong> deben ser idénticos (Ratio 1 : 1 : 1).
                        </p>

                        <div className="grid grid-cols-3 gap-3 font-mono text-center mb-4">
                            <div className="p-3.5 bg-neutral-900/80 rounded-xl border border-white/5 shadow-inner">
                                <div className="text-[11px] text-neutral-400 uppercase font-semibold">BRAZO</div>
                                <div className="text-lg font-black text-amber-400 mt-1">{reevesTriad.armAvg || '-'} cm</div>
                            </div>
                            <div className="p-3.5 bg-neutral-900/80 rounded-xl border border-white/5 shadow-inner">
                                <div className="text-[11px] text-neutral-400 uppercase font-semibold">CUELLO</div>
                                <div className="text-lg font-black text-amber-400 mt-1">{reevesTriad.neck || '-'} cm</div>
                            </div>
                            <div className="p-3.5 bg-neutral-900/80 rounded-xl border border-white/5 shadow-inner">
                                <div className="text-[11px] text-neutral-400 uppercase font-semibold">GEMELO</div>
                                <div className="text-lg font-black text-amber-400 mt-1">{reevesTriad.calfAvg || '-'} cm</div>
                            </div>
                        </div>

                        <div className="space-y-2.5 text-xs font-mono bg-neutral-950/70 p-3.5 rounded-xl border border-white/5">
                            <div className="flex justify-between items-center">
                                <span className="text-neutral-400">Delta Brazo vs Cuello:</span>
                                <span className={`font-bold ${Math.abs(reevesTriad.armNeckDiff) <= 1.0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                    {reevesTriad.armNeckDiff > 0 ? `+${reevesTriad.armNeckDiff}` : reevesTriad.armNeckDiff} cm
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-neutral-400">Delta Brazo vs Gemelo:</span>
                                <span className={`font-bold ${Math.abs(reevesTriad.armCalfDiff) <= 1.0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                                    {reevesTriad.armCalfDiff > 0 ? `+${reevesTriad.armCalfDiff}` : reevesTriad.armCalfDiff} cm
                                </span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-neutral-800/80">
                                <span className="text-neutral-200 font-semibold">Simetría de la Tríada:</span>
                                <span className="text-amber-400 font-extrabold text-sm">{reevesTriad.symmetryScore}%</span>
                            </div>
                        </div>
                    </div>

                    {/* Adonis Waist Target */}
                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-xs font-mono">
                        <div className="text-amber-400 font-bold mb-1 flex items-center gap-1.5">
                            <CheckCircle2 size={14} />
                            <span>Cintura Escultural Adonis:</span>
                        </div>
                        <div className="text-neutral-300">
                            Para tu altura ({measurements.height} cm), la cintura áurea recomendada es de{' '}
                            <span className="text-amber-300 font-bold">{adonisIndex.idealWaistRange[0]} a {adonisIndex.idealWaistRange[1]} cm</span>.
                        </div>
                    </div>
                </div>
            </div>

            {/* Asymmetry Alerts */}
            <div className="card glass p-6 rounded-2xl border border-white/10">
                <h4 className="font-mono text-sm text-neutral-200 font-bold mb-4 flex items-center gap-2">
                    <AlertCircle size={18} className="text-amber-400" />
                    <span>Auditoría de Simetría Bilateral (Izquierda vs Derecha)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    {asymmetries.map((asym) => {
                        const isNotable = asym.severity === 'notable';
                        const isMild = asym.severity === 'mild';
                        return (
                            <div
                                key={asym.group}
                                className={`p-3.5 rounded-xl border font-mono text-xs transition-all ${
                                    isNotable
                                        ? 'bg-rose-950/20 border-rose-500/40 text-rose-200'
                                        : isMild
                                        ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                                        : 'bg-neutral-900/50 border-neutral-800/80 text-neutral-300'
                                }`}
                            >
                                <div className="flex justify-between items-center mb-2">
                                    <span className="font-bold text-white text-sm">{asym.label}</span>
                                    <span className={`badge text-[10px] ${
                                        isNotable ? 'badge-rose' : isMild ? 'badge-amber' : 'badge-emerald'
                                    }`}>
                                        {isNotable ? 'Desbalance' : isMild ? 'Leve' : 'Simétrico'}
                                    </span>
                                </div>
                                <div className="flex justify-between text-[11px] text-neutral-400 mb-1.5">
                                    <span>L: <strong className="text-neutral-200">{asym.left || '-'} cm</strong></span>
                                    <span>R: <strong className="text-neutral-200">{asym.right || '-'} cm</strong></span>
                                </div>
                                <div className="text-[11px] pt-1.5 border-t border-white/5">
                                    Delta: <span className="font-bold text-white">{asym.diff} cm</span>{' '}
                                    {asym.largerSide !== 'equal' && `(${asym.largerSide === 'left' ? 'Izq' : 'Der'} mayor)`}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
