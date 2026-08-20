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
import { Shield, Sparkles, AlertCircle, Award } from 'lucide-react';
import type { BodyMeasurements } from '../../types/measurements';
import { analyzeProportions } from '../../utils/proportions';

interface Props {
    measurements?: BodyMeasurements;
}

export const ProportionsRadar: React.FC<Props> = ({ measurements }) => {
    const analysis = analyzeProportions(measurements);

    if (!analysis || !measurements) {
        return (
            <div className="card glass p-6 text-center text-amber-200/50">
                <Shield className="mx-auto mb-2 opacity-40" size={32} />
                <p>Registra mediciones de torso y extremidades para calcular el radar de simetría.</p>
            </div>
        );
    }

    const { reevesTriad, adonisIndex, asymmetries, radarData, overallGoldenScore } = analysis;

    return (
        <div className="proportions-container space-y-6">
            {/* Top Score Banner */}
            <div className="card glass p-5 relative overflow-hidden border border-amber-500/20 bg-gradient-to-r from-amber-950/20 via-neutral-900/40 to-neutral-950/60">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-amber-400 font-mono text-xs uppercase tracking-wider">
                            <Sparkles size={14} />
                            <span>Índice de Armonía Clásica & Proporción Áurea</span>
                        </div>
                        <h3 className="text-xl font-bold text-neutral-100 mt-1">
                            Simetría Escultural: <span className="text-amber-400">{overallGoldenScore}%</span>
                        </h3>
                        <p className="text-xs text-neutral-400 mt-0.5">
                            Comparado con los ideales de Steve Reeves y la proporción áurea de Adonis (Φ = 1.618).
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="text-right font-mono">
                            <div className="text-xs text-neutral-400">Ratio Pecho / Cintura</div>
                            <div className="text-lg font-bold text-amber-300">
                                {adonisIndex.chestWaistRatio || '-'}{' '}
                                <span className="text-xs text-neutral-500 font-normal">/ 1.62 ideal</span>
                            </div>
                        </div>
                        <div className="w-12 h-12 rounded-full border-2 border-amber-500/40 flex items-center justify-center bg-amber-500/10 text-amber-400 font-bold font-mono text-sm">
                            {adonisIndex.ratioScore}%
                        </div>
                    </div>
                </div>
            </div>

            {/* Grid with Radar Chart and Triad Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Radar Chart */}
                <div className="card glass p-5 flex flex-col items-center justify-center min-h-[320px]">
                    <div className="w-full flex items-center justify-between mb-2">
                        <h4 className="font-mono text-sm text-neutral-300 font-semibold flex items-center gap-2">
                            <Award size={16} className="text-amber-400" />
                            <span>Radar de Ratios Áureos</span>
                        </h4>
                        <span className="text-xs font-mono text-amber-400/80">Objetivo = 100%</span>
                    </div>

                    <div className="w-full h-[260px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                                <PolarGrid stroke="#374151" strokeDasharray="3 3" />
                                <PolarAngleAxis
                                    dataKey="aspect"
                                    tick={{ fill: '#9ca3af', fontSize: 11, fontFamily: 'monospace' }}
                                />
                                <PolarRadiusAxis
                                    angle={30}
                                    domain={[0, 100]}
                                    tick={{ fill: '#6b7280', fontSize: 9 }}
                                />
                                <Radar
                                    name="Armonía"
                                    dataKey="score"
                                    stroke="#f59e0b"
                                    fill="#f59e0b"
                                    fillOpacity={0.35}
                                />
                                <RechartsTooltip
                                    content={({ payload }) => {
                                        if (payload && payload.length) {
                                            const data = payload[0].payload;
                                            return (
                                                <div className="bg-neutral-900 border border-amber-500/30 p-2.5 rounded shadow-lg text-xs font-mono">
                                                    <div className="text-amber-400 font-bold">{data.aspect}</div>
                                                    <div className="text-neutral-300 mt-1">Valor actual: <span className="text-white font-bold">{data.actual}</span></div>
                                                    <div className="text-neutral-400">Ideal clásico: <span className="text-amber-300">{data.ideal}</span></div>
                                                    <div className="text-neutral-400">Puntaje: <span className="text-green-400 font-bold">{data.score}%</span></div>
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
                <div className="card glass p-5 flex flex-col justify-between space-y-4">
                    <div>
                        <h4 className="font-mono text-sm text-neutral-300 font-semibold mb-3 flex items-center gap-2">
                            <Shield size={16} className="text-amber-400" />
                            <span>Tríada Clásica de Steve Reeves</span>
                        </h4>
                        <p className="text-xs text-neutral-400 mb-4">
                            Steve Reeves estableció que para la máxima armonía visual, el perímetro de <strong>Brazo</strong>, <strong>Cuello</strong> y <strong>Gemelo</strong> deben ser idénticos (Ratio 1 : 1 : 1).
                        </p>

                        <div className="grid grid-cols-3 gap-2.5 font-mono text-center mb-4">
                            <div className="p-3 bg-neutral-900/60 rounded border border-neutral-800">
                                <div className="text-[11px] text-neutral-400">BRAZO</div>
                                <div className="text-base font-bold text-amber-400 mt-1">{reevesTriad.armAvg || '-'} cm</div>
                            </div>
                            <div className="p-3 bg-neutral-900/60 rounded border border-neutral-800">
                                <div className="text-[11px] text-neutral-400">CUELLO</div>
                                <div className="text-base font-bold text-amber-400 mt-1">{reevesTriad.neck || '-'} cm</div>
                            </div>
                            <div className="p-3 bg-neutral-900/60 rounded border border-neutral-800">
                                <div className="text-[11px] text-neutral-400">GEMELO</div>
                                <div className="text-base font-bold text-amber-400 mt-1">{reevesTriad.calfAvg || '-'} cm</div>
                            </div>
                        </div>

                        <div className="space-y-2 text-xs font-mono bg-neutral-950/40 p-3 rounded border border-neutral-800/80">
                            <div className="flex justify-between">
                                <span className="text-neutral-400">Delta Brazo vs Cuello:</span>
                                <span className={Math.abs(reevesTriad.armNeckDiff) <= 1.0 ? 'text-green-400' : 'text-amber-400'}>
                                    {reevesTriad.armNeckDiff > 0 ? `+${reevesTriad.armNeckDiff}` : reevesTriad.armNeckDiff} cm
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-neutral-400">Delta Brazo vs Gemelo:</span>
                                <span className={Math.abs(reevesTriad.armCalfDiff) <= 1.0 ? 'text-green-400' : 'text-amber-400'}>
                                    {reevesTriad.armCalfDiff > 0 ? `+${reevesTriad.armCalfDiff}` : reevesTriad.armCalfDiff} cm
                                </span>
                            </div>
                            <div className="flex justify-between pt-1 border-t border-neutral-800">
                                <span className="text-neutral-300 font-semibold">Simetría de la Tríada:</span>
                                <span className="text-amber-400 font-bold">{reevesTriad.symmetryScore}%</span>
                            </div>
                        </div>
                    </div>

                    {/* Adonis Waist Target */}
                    <div className="p-3 rounded bg-amber-500/10 border border-amber-500/20 text-xs font-mono">
                        <div className="text-amber-400 font-semibold mb-1">Cintura Escultural Adonis:</div>
                        <div className="text-neutral-300">
                            Para tu altura ({measurements.height} cm), la cintura áurea óptima es de{' '}
                            <span className="text-amber-300 font-bold">{adonisIndex.idealWaistRange[0]} a {adonisIndex.idealWaistRange[1]} cm</span>.
                        </div>
                    </div>
                </div>
            </div>

            {/* Asymmetry Alerts */}
            <div className="card glass p-5">
                <h4 className="font-mono text-sm text-neutral-300 font-semibold mb-3 flex items-center gap-2">
                    <AlertCircle size={16} className="text-amber-400" />
                    <span>Auditoría de Simetría Bilateral (Izquierda vs Derecha)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {asymmetries.map((asym) => {
                        const isNotable = asym.severity === 'notable';
                        const isMild = asym.severity === 'mild';
                        return (
                            <div
                                key={asym.group}
                                className={`p-3 rounded border font-mono text-xs ${
                                    isNotable
                                        ? 'bg-red-950/20 border-red-500/40 text-red-200'
                                        : isMild
                                        ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                                        : 'bg-neutral-900/40 border-neutral-800 text-neutral-300'
                                }`}
                            >
                                <div className="flex justify-between items-center mb-1.5">
                                    <span className="font-semibold text-neutral-100">{asym.label}</span>
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                                        isNotable ? 'bg-red-500/20 text-red-400' : isMild ? 'bg-amber-500/20 text-amber-400' : 'bg-green-500/20 text-green-400'
                                    }`}>
                                        {isNotable ? 'Desbalance' : isMild ? 'Leve' : 'Simétrico'}
                                    </span>
                                </div>
                                <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                                    <span>L: {asym.left || '-'} cm</span>
                                    <span>R: {asym.right || '-'} cm</span>
                                </div>
                                <div className="text-[11px]">
                                    Delta: <span className="font-bold">{asym.diff} cm</span>{' '}
                                    {asym.largerSide !== 'equal' && `(Mayor en ${asym.largerSide === 'left' ? 'Izq' : 'Der'})`}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
