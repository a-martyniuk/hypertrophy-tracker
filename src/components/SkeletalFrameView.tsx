import { useState, useEffect } from 'react';
import { Target, HelpCircle, Sparkles, TrendingUp, Scale, Award, Dna } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Tooltip as AppTooltip } from './Tooltip';
import type { BodyMeasurements, SkeletalFrame } from '../types/measurements';
import {
  calculateSkeletalPotential,
  calculateIEO,
  calculateFFMI,
  calculateBerkhanLimit,
  calculateHelmsGainRates
} from '../utils/skeletal';

interface Props {
  baseline?: SkeletalFrame;
  currentMeasurements?: BodyMeasurements;
  onSave: (baseline: SkeletalFrame) => void;
  sex?: 'male' | 'female';
}

export const SkeletalFrameView = ({ baseline, currentMeasurements, onSave: _onSave, sex = 'male' }: Props) => {
  const [height, setHeight] = useState<number>(() => {
    const saved = localStorage.getItem('skeletal_height');
    if (saved) return parseFloat(saved);
    return currentMeasurements?.height || 177;
  });

  const [weight, setWeight] = useState<number>(() => {
    return currentMeasurements?.weight || 75;
  });

  const [bodyFat, setBodyFat] = useState<number>(() => {
    return currentMeasurements?.bodyFat || 15;
  });

  const [frame, setFrame] = useState<SkeletalFrame>(() => {
    if (baseline) return baseline;

    const saved = localStorage.getItem('skeletal_frame_draft');
    if (saved) {
      try { return JSON.parse(saved); } catch { }
    }

    let wrist = 17;
    let ankle = 22;

    if (currentMeasurements) {
      const getAvg = (m: { left: number; right: number }) => {
        if (m.left > 0 && m.right > 0) return (m.left + m.right) / 2;
        if (m.left > 0) return m.left;
        if (m.right > 0) return m.right;
        return 0;
      };

      const w = getAvg(currentMeasurements.wrist);
      const a = getAvg(currentMeasurements.ankle);

      if (w > 0) wrist = parseFloat(w.toFixed(1));
      if (a > 0) ankle = parseFloat(a.toFixed(1));
    }

    return { wrist, ankle, knee: 38 };
  });

  useEffect(() => {
    localStorage.setItem('skeletal_height', height.toString());
  }, [height]);

  const { t } = useTranslation();

  useEffect(() => {
    localStorage.setItem('skeletal_frame_draft', JSON.stringify(frame));
  }, [frame]);

  const potential = calculateSkeletalPotential(frame.wrist, frame.ankle, height, sex);
  const ieo = calculateIEO(frame.wrist, frame.ankle, sex);
  const ffmi = calculateFFMI(weight, height, bodyFat);
  const berkhan = calculateBerkhanLimit(height, sex, bodyFat);
  const helms = calculateHelmsGainRates(weight);

  const IEO_CATEGORIES = sex === 'female' ? [
    { label: t('genetics.ieo.small'), range: '< 16', min: 0, max: 16 },
    { label: t('genetics.ieo.medium'), range: '16 – 17.9', min: 16, max: 17.99 },
    { label: t('genetics.ieo.large'), range: '18 – 19.9', min: 18, max: 19.99, highlight: true },
    { label: t('genetics.ieo.very_large'), range: '≥ 20', min: 20, max: 999, highlight: true },
  ] : [
    { label: t('genetics.ieo.small'), range: '< 18', min: 0, max: 18 },
    { label: t('genetics.ieo.medium'), range: '18 – 19.9', min: 18, max: 19.99 },
    { label: t('genetics.ieo.large'), range: '20 – 21.9', min: 20, max: 21.99, highlight: true },
    { label: t('genetics.ieo.very_large'), range: '≥ 22', min: 22, max: 999, highlight: true },
  ];

  return (
    <div className="skeletal-frame-view animate-fade space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-2 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2.5 text-amber-400">
            <Dna size={22} />
            <h2 className="text-2xl font-extrabold text-white">{t('genetics.title')}</h2>
          </div>
          <p className="text-xs text-neutral-400 mt-1 max-w-2xl leading-relaxed">
            Análisis multidimensional de límites genéticos naturales: Casey Butt, FFMI Normalizado, Martin Berkhan y Eric Helms.
          </p>
        </div>
      </div>

      {/* Grid 1: Casey Butt Inputs & Potential Limits */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs Column */}
        <div className="lg:col-span-4 space-y-4">
          <div className="card glass p-6 rounded-2xl border border-white/10 shadow-xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
              <h3 className="text-sm font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <span>{t('genetics.base_measurements')}</span>
                <AppTooltip content={t('genetics.base_measurements_tooltip')} position="right">
                  <HelpCircle size={14} className="opacity-60 cursor-help" />
                </AppTooltip>
              </h3>
            </div>

            <div className="space-y-3 font-mono">
              <div className="bg-neutral-900/70 border border-white/5 rounded-xl p-3 focus-within:border-amber-500/50 transition-all">
                <div className="flex justify-between items-center text-xs text-neutral-400 mb-1">
                  <label>{t('common.form.height')} (CM)</label>
                </div>
                <input
                  type="number"
                  step="0.5"
                  value={height || ''}
                  onChange={(e) => setHeight(parseFloat(e.target.value) || 0)}
                  className="w-full bg-transparent text-xl font-bold text-white outline-none"
                  placeholder="177"
                />
              </div>

              <div className="bg-neutral-900/70 border border-white/5 rounded-xl p-3 focus-within:border-amber-500/50 transition-all">
                <div className="flex justify-between items-center text-xs text-neutral-400 mb-1">
                  <label>{t('common.form.weight')} (KG)</label>
                </div>
                <input
                  type="number"
                  step="0.5"
                  value={weight || ''}
                  onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
                  className="w-full bg-transparent text-xl font-bold text-white outline-none"
                  placeholder="75"
                />
              </div>

              <div className="bg-neutral-900/70 border border-white/5 rounded-xl p-3 focus-within:border-amber-500/50 transition-all">
                <div className="flex justify-between items-center text-xs text-neutral-400 mb-1">
                  <label>{t('common.form.body_fat')} (%)</label>
                </div>
                <input
                  type="number"
                  step="0.5"
                  value={bodyFat || ''}
                  onChange={(e) => setBodyFat(parseFloat(e.target.value) || 0)}
                  className="w-full bg-transparent text-xl font-bold text-white outline-none"
                  placeholder="15"
                />
              </div>

              <div className="bg-neutral-900/70 border border-white/5 rounded-xl p-3 focus-within:border-amber-500/50 transition-all">
                <div className="flex justify-between items-center text-xs text-neutral-400 mb-1">
                  <label>{t('common.form.wrist')} (CM)</label>
                  <AppTooltip content="Medida del hueso de la muñeca para calcular estructura ósea" position="top">
                    <HelpCircle size={12} className="opacity-50" />
                  </AppTooltip>
                </div>
                <input
                  type="number"
                  step="0.1"
                  value={frame.wrist || ''}
                  onChange={(e) => setFrame({ ...frame, wrist: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-transparent text-xl font-bold text-amber-400 outline-none"
                  placeholder="17.5"
                />
              </div>

              <div className="bg-neutral-900/70 border border-white/5 rounded-xl p-3 focus-within:border-amber-500/50 transition-all">
                <div className="flex justify-between items-center text-xs text-neutral-400 mb-1">
                  <label>{t('common.form.ankle')} (CM)</label>
                  <AppTooltip content="Medida del perímetro mínimo sobre el tobillo" position="top">
                    <HelpCircle size={12} className="opacity-50" />
                  </AppTooltip>
                </div>
                <input
                  type="number"
                  step="0.1"
                  value={frame.ankle || ''}
                  onChange={(e) => setFrame({ ...frame, ankle: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-transparent text-xl font-bold text-amber-400 outline-none"
                  placeholder="22.5"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Potential Limits Display */}
        <div className="lg:col-span-8">
          <div className="card glass p-6 rounded-2xl border border-white/10 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/5">
              <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Target size={16} className="text-amber-400" />
                <span>Límite Genético Estimado (Modelo Casey Butt)</span>
              </h3>
              <span className="badge badge-amber font-mono text-[11px]">@ {bodyFat}% Grasa</span>
            </div>

            <div className="space-y-3.5 font-mono">
              {[
                { key: 'chest', label: t('common.form.chest'), current: currentMeasurements?.pecho, max: potential.chest },
                { key: 'arm', label: t('common.form.arm'), current: currentMeasurements?.arm ? (currentMeasurements.arm.left + currentMeasurements.arm.right) / 2 : undefined, max: potential.biceps },
                { key: 'forearm', label: t('common.form.forearm'), current: currentMeasurements?.forearm ? (currentMeasurements.forearm.left + currentMeasurements.forearm.right) / 2 : undefined, max: potential.forearms },
                { key: 'neck', label: t('common.form.neck'), current: currentMeasurements?.neck, max: potential.neck },
                { key: 'thigh', label: t('common.form.thigh'), current: currentMeasurements?.thigh ? (currentMeasurements.thigh.left + currentMeasurements.thigh.right) / 2 : undefined, max: potential.thighs },
                { key: 'calf', label: t('common.form.calf'), current: currentMeasurements?.calf ? (currentMeasurements.calf.left + currentMeasurements.calf.right) / 2 : undefined, max: potential.calves },
              ].map(({ key, label, current, max }) => {
                const progress = current && max ? Math.min(100, Math.round((current / max) * 100)) : 0;
                return (
                  <div key={key} className="bg-neutral-900/60 p-3.5 rounded-xl border border-white/5">
                    <div className="flex justify-between items-center text-xs mb-2">
                      <span className="font-bold text-neutral-200">{label}</span>
                      <div className="flex items-center gap-3">
                        {current ? (
                          <span className="text-neutral-400">Actual: <strong className="text-white">{current} cm</strong></span>
                        ) : null}
                        <span className="text-amber-400 font-bold">Máx {max} cm</span>
                      </div>
                    </div>
                    <div className="w-full h-2.5 bg-neutral-950 rounded-full overflow-hidden p-0.5 border border-white/5">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-500"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex justify-end text-[10px] text-neutral-400 mt-1">
                      <span>Progreso: <strong className="text-amber-300">{progress}%</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Grid 2: FFMI & Berkhan Models */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* FFMI Normalizado Card */}
        <div className="card glass p-6 rounded-2xl border border-white/10 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <h3 className="text-sm font-mono font-bold text-white flex items-center gap-2">
              <Scale size={16} className="text-amber-400" />
              <span>FFMI Normalizado (Fat-Free Mass Index)</span>
            </h3>
            <span className="badge badge-amber font-mono text-[10px]">Kouri et al.</span>
          </div>

          {ffmi ? (
            <div className="space-y-4 font-mono">
              <div className="grid grid-cols-2 gap-3 p-4 bg-neutral-950/70 rounded-xl border border-white/5">
                <div>
                  <div className="text-[11px] text-neutral-400">FFMI NORMALIZADO</div>
                  <div className="text-3xl font-black text-amber-400 mt-0.5">{ffmi.normalizedFFMI}</div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">FFMI Crudo: {ffmi.rawFFMI}</div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-neutral-400">MASA MAGRA PURA</div>
                  <div className="text-2xl font-black text-white mt-0.5">{ffmi.leanMassKg} kg</div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">Grasa: {ffmi.fatMassKg} kg ({bodyFat}%)</div>
                </div>
              </div>

              {/* FFMI Natural Scale */}
              <div>
                <div className="flex justify-between text-xs text-neutral-300 mb-1.5 font-sans">
                  <span>Escala Fisiológica Natural</span>
                  <span className="text-amber-300 font-bold font-mono">
                    {ffmi.normalizedFFMI < 20 ? 'Promedio / Recreacional' :
                     ffmi.normalizedFFMI < 22 ? 'Atlético Entrenado' :
                     ffmi.normalizedFFMI < 23 ? 'Avanzado / Competitivo' :
                     ffmi.normalizedFFMI < 25 ? 'Límite Natural Superior' : 'Excepcional / Suprafisiológico'}
                  </span>
                </div>
                <div className="w-full h-3.5 bg-neutral-950 rounded-full overflow-hidden p-0.5 border border-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-sky-500 via-amber-500 to-rose-500 transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(5, ffmi.scorePercent))}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-neutral-400 mt-1">
                  <span>15.0</span>
                  <span>20.0 (Atlético)</span>
                  <span>22.0</span>
                  <span>25.0 (Techo Natural)</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-neutral-400">Ingresa peso, altura y grasa para calcular FFMI.</p>
          )}
        </div>

        {/* Martin Berkhan Model Card */}
        <div className="card glass p-6 rounded-2xl border border-white/10 shadow-xl font-mono space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <h3 className="text-sm font-mono font-bold text-white flex items-center gap-2">
              <Award size={16} className="text-amber-400" />
              <span>Modelo Martin Berkhan (Leangains)</span>
            </h3>
            <span className="badge badge-amber font-mono text-[10px]">Altura - 100</span>
          </div>

          <div className="space-y-3">
            <p className="text-xs text-neutral-300 font-sans leading-relaxed">
              Proyección de peso corporal máximo alcanzable por un atleta natural en estado magro de competición (~5% BF) y a tu % de grasa actual.
            </p>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-4 bg-neutral-950/70 rounded-xl border border-white/5">
                <div className="text-[11px] text-neutral-400 uppercase font-semibold">MÁXIMO EN CORTE (5% BF)</div>
                <div className="text-2xl font-black text-amber-400 mt-1">{berkhan.maxWeightAtCompBf} kg</div>
                <div className="text-[11px] text-neutral-400 mt-0.5">Masa magra: {berkhan.maxLeanWeightKg} kg</div>
              </div>
              <div className="p-4 bg-neutral-950/70 rounded-xl border border-white/5">
                <div className="text-[11px] text-neutral-400 uppercase font-semibold">MÁXIMO A TU BF ({bodyFat}%)</div>
                <div className="text-2xl font-black text-amber-300 mt-1">{berkhan.maxWeightAtCurrentBf} kg</div>
                <div className="text-[11px] text-neutral-400 mt-0.5">Con {bodyFat}% de grasa</div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-sans text-neutral-200">
              💡 Para tu estatura ({height} cm), tu potencial magro natural absoluto es de aproximadamente <strong className="text-amber-300 font-mono">{berkhan.maxLeanWeightKg} kg de masa muscular pura</strong>.
            </div>
          </div>
        </div>
      </div>

      {/* Grid 3: Eric Helms Gain Rates & IEO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Eric Helms / Lyle McDonald Rates */}
        <div className="card glass p-6 rounded-2xl border border-white/10 shadow-xl font-mono space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <h3 className="text-sm font-mono font-bold text-white flex items-center gap-2">
              <TrendingUp size={16} className="text-amber-400" />
              <span>Tasas de Ganancia Realistas (Helms & McDonald)</span>
            </h3>
          </div>

          <p className="text-xs text-neutral-300 font-sans leading-relaxed">
            Tasa de aumento mensual de masa muscular limpia esperable según tu nivel de experiencia:
          </p>

          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-xl bg-neutral-950/70 border border-white/5 flex justify-between items-center">
              <div>
                <div className="font-bold text-amber-300">PRINCIPIANTE (0 - 1 año)</div>
                <div className="text-[11px] text-neutral-400">1.0% – 1.5% peso / mes</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-white">+{helms.beginner.minKgMonth} a {helms.beginner.maxKgMonth} kg/mes</div>
                <div className="text-[10px] text-neutral-400">~{helms.beginner.minGramsWeek}-{helms.beginner.maxGramsWeek} g/semana</div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-neutral-950/70 border border-white/5 flex justify-between items-center">
              <div>
                <div className="font-bold text-amber-400">INTERMEDIO (1 - 3 años)</div>
                <div className="text-[11px] text-neutral-400">0.5% – 1.0% peso / mes</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-white">+{helms.intermediate.minKgMonth} a {helms.intermediate.maxKgMonth} kg/mes</div>
                <div className="text-[10px] text-neutral-400">~{helms.intermediate.minGramsWeek}-{helms.intermediate.maxGramsWeek} g/semana</div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-neutral-950/70 border border-white/5 flex justify-between items-center">
              <div>
                <div className="font-bold text-amber-500">AVANZADO (3+ años)</div>
                <div className="text-[11px] text-neutral-400">0.25% – 0.5% peso / mes</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-white">+{helms.advanced.minKgMonth} a {helms.advanced.maxKgMonth} kg/mes</div>
                <div className="text-[10px] text-neutral-400">~{helms.advanced.minGramsWeek}-{helms.advanced.maxGramsWeek} g/semana</div>
              </div>
            </div>
          </div>
        </div>

        {/* IEO Card */}
        <div className="card glass p-6 rounded-2xl border border-white/10 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/5">
            <h3 className="text-sm font-mono font-bold text-white flex items-center gap-2">
              <Sparkles size={16} className="text-amber-400" />
              <span>{t('genetics.ieo.title')}</span>
            </h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-neutral-950/70 rounded-xl border border-white/5 font-mono space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-amber-400">{ieo.value}</span>
                <span className="text-xs uppercase font-bold text-neutral-300">{t(`genetics.ieo.${ieo.label}`)}</span>
              </div>
              {ieo.isAdvantage && (
                <span className="badge badge-amber text-[10px]">
                  ✨ {t('genetics.ieo.advantage')}
                </span>
              )}
              <p className="font-sans text-xs text-neutral-300 leading-relaxed pt-1">
                {t('genetics.ieo.description')}
              </p>
            </div>

            <div className="space-y-1.5 font-mono">
              {IEO_CATEGORIES.map((cat, idx) => {
                const isActive = ieo.rawValue >= cat.min && ieo.rawValue < cat.max;
                return (
                  <div
                    key={idx}
                    className={`flex justify-between items-center p-2.5 rounded-lg text-xs border transition-all ${
                      isActive
                        ? 'bg-amber-500/15 border-amber-500/40 text-amber-300 font-bold'
                        : 'bg-neutral-900/40 border-white/5 text-neutral-400'
                    }`}
                  >
                    <span>{cat.range}</span>
                    <span>{cat.label}</span>
                    {cat.highlight && isActive && <span>⭐</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
