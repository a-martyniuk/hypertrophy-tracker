import { useState, useEffect } from 'react';
import { Target, Info, Activity, HelpCircle, Sparkles, TrendingUp, Scale, Award } from 'lucide-react';
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

export const SkeletalFrameView = ({ baseline, currentMeasurements, onSave, sex = 'male' }: Props) => {
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
    <div className="skeletal-frame-view animate-fade-in space-y-6">
      <div className="view-header">
        <div className="title-group">
          <Target className="text-amber-400" size={24} />
          <h2>{t('genetics.title')}</h2>
        </div>
        <p className="subtitle">
          Análisis multidimensional de límites genéticos naturales: Casey Butt, FFMI Normalizado, Martin Berkhan y Eric Helms.
        </p>
      </div>

      {/* Grid 1: Casey Butt Inputs & Potential Limits */}
      <div className="frame-grid">
        <div className="left-column">
          <div className="card glass baseline-input">
            <div className="card-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {t('genetics.base_measurements')}
                <AppTooltip content={t('genetics.base_measurements_tooltip')} position="right">
                  <HelpCircle size={14} style={{ opacity: 0.6, cursor: 'help' }} />
                </AppTooltip>
              </h3>
            </div>
            <div className="hud-column">
              <div className="hud-input-group">
                <div className="hud-label-row">
                  <label>
                    {t('common.form.height')} (cm)
                    <AppTooltip content={t('genetics.height_tooltip')} position="top">
                      <HelpCircle size={12} style={{ display: 'inline', marginLeft: '4px', opacity: 0.5, cursor: 'help' }} />
                    </AppTooltip>
                  </label>
                </div>
                <input
                  type="number"
                  step="1"
                  value={height}
                  onChange={e => setHeight(parseFloat(e.target.value) || 0)}
                />
                <p className="input-hint">Altura total descalzo.</p>
              </div>

              <div className="hud-input-group">
                <div className="hud-label-row">
                  <label>
                    {t('common.form.weight')} (kg)
                  </label>
                </div>
                <input
                  type="number"
                  step="0.5"
                  value={weight}
                  onChange={e => setWeight(parseFloat(e.target.value) || 0)}
                />
                <p className="input-hint">Peso corporal actual.</p>
              </div>

              <div className="hud-input-group">
                <div className="hud-label-row">
                  <label>
                    {t('common.form.body_fat')} (%)
                  </label>
                </div>
                <input
                  type="number"
                  step="0.5"
                  value={bodyFat}
                  onChange={e => setBodyFat(parseFloat(e.target.value) || 0)}
                />
                <p className="input-hint">Porcentaje de grasa estimado.</p>
              </div>

              <div className="hud-input-group">
                <div className="hud-label-row">
                  <label>
                    {t('common.form.wrist')} (cm)
                    <AppTooltip content={t('genetics.wrist_tooltip')} position="top">
                      <HelpCircle size={12} style={{ display: 'inline', marginLeft: '4px', opacity: 0.5, cursor: 'help' }} />
                    </AppTooltip>
                  </label>
                </div>
                <input
                  type="number"
                  step="0.1"
                  value={frame.wrist}
                  onChange={e => setFrame({ ...frame, wrist: parseFloat(e.target.value) })}
                />
                <p className="input-hint">Mide sobre el hueso de la muñeca.</p>
              </div>

              <div className="hud-input-group">
                <div className="hud-label-row">
                  <label>
                    {t('common.form.ankle')} (cm)
                    <AppTooltip content={t('genetics.ankle_tooltip')} position="top">
                      <HelpCircle size={12} style={{ display: 'inline', marginLeft: '4px', opacity: 0.5, cursor: 'help' }} />
                    </AppTooltip>
                  </label>
                </div>
                <input
                  type="number"
                  step="0.1"
                  value={frame.ankle}
                  onChange={e => setFrame({ ...frame, ankle: parseFloat(e.target.value) })}
                />
                <p className="input-hint">Mide sobre el hueso del tobillo.</p>
              </div>
            </div>

            <button className="btn-primary w-full mt-6" onClick={() => onSave(frame)}>
              <Activity size={18} className="mr-2" /> {t('genetics.btn_update')}
            </button>
          </div>
        </div>

        <div className="card glass potential-analysis">
          <div className="analysis-header">
            <h3>{t('genetics.estimated_limit')} (Modelo Casey Butt)</h3>
            <div className="info-tag">
              <Info size={14} /> {t('genetics.body_fat_ref')}
            </div>
          </div>

          <div className="potential-list">
            {Object.entries(potential).map(([muscle, value]) => {
              const muscleKey =
                muscle === 'biceps' ? 'arm' :
                  muscle === 'forearms' ? 'forearm' :
                    muscle === 'thighs' ? 'thigh' :
                      muscle === 'calves' ? 'calf' :
                        muscle === 'chest' ? 'pecho' :
                          muscle;

              const displayNames: Record<string, string> = {
                chest: t('common.form.chest'),
                biceps: t('common.form.arm'),
                forearms: t('common.form.forearm'),
                neck: t('common.form.neck'),
                thighs: t('common.form.thigh'),
                calves: t('common.form.calf')
              };

              const current = currentMeasurements ? (currentMeasurements as any)[muscleKey] : null;
              const currentVal = (typeof current === 'object' && current !== null) ? (current.left + current.right) / 2 : current;
              const progress = currentVal ? (currentVal / parseFloat(value.toString())) * 100 : 0;

              return (
                <div key={muscle} className="potential-item">
                  <div className="item-info">
                    <span className="muscle-name capitalize">{displayNames[muscle] || muscle}:</span>
                    <span className="potential-val">Máx {value} cm</span>
                  </div>
                  <div style={{ width: '100%' }}>
                    <AppTooltip
                      content={`Actual: ${currentVal ? currentVal.toFixed(1) : '--'} cm`}
                      position="top"
                      containerStyle={{ width: '100%', display: 'block' }}
                    >
                      <div className="progress-bar-container" style={{ cursor: 'help' }}>
                        <div className="progress-bar" style={{ width: `${Math.min(progress, 100)}%` }}></div>
                        <span className="progress-pct">{progress.toFixed(0)}%</span>
                      </div>
                    </AppTooltip>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grid 2: FFMI & Berkhan Models */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* FFMI Normalizado Card */}
        <div className="card glass p-5">
          <div className="card-header flex items-center justify-between">
            <h3 className="flex items-center gap-2">
              <Scale size={16} className="text-amber-400" />
              <span>FFMI Normalizado (Fat-Free Mass Index)</span>
            </h3>
            <span className="text-xs font-mono text-amber-400/80">Kouri et al.</span>
          </div>

          {ffmi ? (
            <div className="space-y-4 font-mono">
              <div className="flex items-center justify-between p-4 bg-neutral-900/60 rounded border border-neutral-800">
                <div>
                  <div className="text-xs text-neutral-400">FFMI NORMALIZADO</div>
                  <div className="text-2xl font-bold text-amber-400 mt-0.5">{ffmi.normalizedFFMI}</div>
                  <div className="text-[11px] text-neutral-500">FFMI Crudo: {ffmi.rawFFMI}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-neutral-400">MASA MAGRA PURA</div>
                  <div className="text-xl font-bold text-white mt-0.5">{ffmi.leanMassKg} kg</div>
                  <div className="text-[11px] text-neutral-500">Grasa: {ffmi.fatMassKg} kg ({bodyFat}%)</div>
                </div>
              </div>

              {/* FFMI Natural Scale */}
              <div>
                <div className="flex justify-between text-xs text-neutral-400 mb-1.5">
                  <span>Escala Natural (15 - 25+)</span>
                  <span className="text-amber-300 font-bold">
                    {ffmi.normalizedFFMI < 20 ? 'Promedio / Recreacional' :
                     ffmi.normalizedFFMI < 22 ? 'Atlético Entrenado' :
                     ffmi.normalizedFFMI < 23 ? 'Avanzado / Competitivo' :
                     ffmi.normalizedFFMI < 25 ? 'Límite Natural Superior' : 'Excepcional / Suprafisiológico'}
                  </span>
                </div>
                <div className="w-full h-3 bg-neutral-900 rounded-full overflow-hidden p-0.5 border border-neutral-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 via-amber-500 to-red-500 transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(5, ffmi.scorePercent))}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-neutral-500 mt-1">
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
        <div className="card glass p-5 font-mono">
          <div className="card-header flex items-center justify-between">
            <h3 className="flex items-center gap-2">
              <Award size={16} className="text-amber-400" />
              <span>Modelo Martin Berkhan (Leangains)</span>
            </h3>
            <span className="text-xs font-mono text-amber-400/80">Altura - 100</span>
          </div>

          <div className="space-y-3">
            <p className="text-xs text-neutral-400 font-sans">
              Proyección de peso corporal máximo alcanzable por un atleta natural en estado magro de competición (~5-6% BF) y a tu % de grasa actual.
            </p>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 bg-neutral-900/60 rounded border border-neutral-800">
                <div className="text-[11px] text-neutral-400">MÁXIMO EN CORTE (5% BF)</div>
                <div className="text-xl font-bold text-amber-400 mt-1">{berkhan.maxWeightAtCompBf} kg</div>
                <div className="text-[10px] text-neutral-500">Masa magra: {berkhan.maxLeanWeightKg} kg</div>
              </div>
              <div className="p-3 bg-neutral-900/60 rounded border border-neutral-800">
                <div className="text-[11px] text-neutral-400">MÁXIMO A TU BF ACTUAL ({bodyFat}%)</div>
                <div className="text-xl font-bold text-amber-300 mt-1">{berkhan.maxWeightAtCurrentBf} kg</div>
                <div className="text-[10px] text-neutral-500">Con {bodyFat}% de grasa</div>
              </div>
            </div>

            <div className="p-2.5 rounded bg-neutral-950/60 border border-neutral-800 text-[11px] text-neutral-400">
              💡 Para tu estatura ({height} cm), tu potencial magro natural absoluto es de aproximadamente <strong className="text-amber-300">{berkhan.maxLeanWeightKg} kg de masa muscular pura</strong>.
            </div>
          </div>
        </div>
      </div>

      {/* Grid 3: Eric Helms Gain Rates & IEO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Eric Helms / Lyle McDonald Rates */}
        <div className="card glass p-5 font-mono">
          <div className="card-header flex items-center justify-between">
            <h3 className="flex items-center gap-2">
              <TrendingUp size={16} className="text-amber-400" />
              <span>Tasas de Ganancia Realistas (Helms & McDonald)</span>
            </h3>
          </div>

          <p className="text-xs text-neutral-400 font-sans mb-3">
            Tasa de aumento mensual de masa muscular limpia esperable según tu nivel de experiencia:
          </p>

          <div className="space-y-2.5 text-xs">
            <div className="p-2.5 rounded bg-neutral-900/60 border border-neutral-800 flex justify-between items-center">
              <div>
                <div className="font-bold text-amber-300">PRINCIPIANTE (0 - 1 año)</div>
                <div className="text-[11px] text-neutral-400">1.0% – 1.5% peso / mes</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-white">+{helms.beginner.minKgMonth} a {helms.beginner.maxKgMonth} kg/mes</div>
                <div className="text-[10px] text-neutral-500">~{helms.beginner.minGramsWeek}-{helms.beginner.maxGramsWeek} g/semana</div>
              </div>
            </div>

            <div className="p-2.5 rounded bg-neutral-900/60 border border-neutral-800 flex justify-between items-center">
              <div>
                <div className="font-bold text-amber-400">INTERMEDIO (1 - 3 años)</div>
                <div className="text-[11px] text-neutral-400">0.5% – 1.0% peso / mes</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-white">+{helms.intermediate.minKgMonth} a {helms.intermediate.maxKgMonth} kg/mes</div>
                <div className="text-[10px] text-neutral-500">~{helms.intermediate.minGramsWeek}-{helms.intermediate.maxGramsWeek} g/semana</div>
              </div>
            </div>

            <div className="p-2.5 rounded bg-neutral-900/60 border border-neutral-800 flex justify-between items-center">
              <div>
                <div className="font-bold text-yellow-500">AVANZADO (3+ años)</div>
                <div className="text-[11px] text-neutral-400">0.25% – 0.5% peso / mes</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-white">+{helms.advanced.minKgMonth} a {helms.advanced.maxKgMonth} kg/mes</div>
                <div className="text-[10px] text-neutral-500">~{helms.advanced.minGramsWeek}-{helms.advanced.maxGramsWeek} g/semana</div>
              </div>
            </div>
          </div>
        </div>

        {/* IEO Card */}
        <div className="card glass ieo-card">
          <div className="card-header">
            <h3 className="flex items-center gap-2">
              <Sparkles size={16} className="text-amber-400" />
              <span>{t('genetics.ieo.title')}</span>
            </h3>
          </div>
          <div className="ieo-display">
            <div className="ieo-main-score font-mono">
              <div className="ieo-value-row">
                <span className="ieo-number">{ieo.value}</span>
                <span className="ieo-label">{t(`genetics.ieo.${ieo.label}`)}</span>
              </div>
              {ieo.isAdvantage && (
                <div className="advantage-badge">
                  ✨ {t('genetics.ieo.advantage')}
                </div>
              )}
              <p className="ieo-desc font-sans text-xs">
                {t('genetics.ieo.description')}
              </p>
            </div>

            <div className="ieo-reference-table font-mono">
              {IEO_CATEGORIES.map((cat, idx) => {
                const isActive = ieo.rawValue >= cat.min && ieo.rawValue < cat.max;
                return (
                  <div key={idx} className={`ieo-ref-row ${isActive ? 'active' : ''}`}>
                    <span className="ref-range">{cat.range}</span>
                    <span className="ref-label">{cat.label}</span>
                    {cat.highlight && isActive && <span className="ref-check">✅</span>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .skeletal-frame-view {
          padding: 1.5rem;
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
        }
        .frame-grid {
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 2rem;
          margin-top: 1.5rem;
          align-items: start;
        }
        .card {
          border-radius: 16px;
          padding: 1.5rem;
          border: 1px solid rgba(255, 255, 255, 0.05);
          position: relative;
          z-index: 1;
        }
        .card-header h3 {
          font-size: 0.8rem;
          color: var(--primary-color);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          border-bottom: 2px solid rgba(245, 158, 11, 0.2);
          padding-bottom: 0.5rem;
          margin-bottom: 1.25rem;
        }
        .hud-column {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }
        .hud-input-group {
          background: rgba(13, 13, 15, 0.4);
          border: 1px solid rgba(245, 158, 11, 0.1);
          border-left: 4px solid #f59e0b;
          padding: 0.6rem 0.8rem;
          border-radius: 4px 12px 12px 4px;
        }
        .hud-label-row label {
          font-size: 0.75rem;
          color: #9ca3af;
          font-family: monospace;
          text-transform: uppercase;
        }
        .hud-input-group input {
          width: 100%;
          background: transparent;
          border: none;
          color: #f59e0b;
          font-size: 1.1rem;
          font-weight: 700;
          font-family: monospace;
          outline: none;
        }
        .input-hint {
          font-size: 0.65rem;
          color: #6b7280;
          margin-top: 2px;
        }
        .potential-list {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
        }
        .potential-item {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .item-info {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          font-family: monospace;
        }
        .potential-val {
          color: #f59e0b;
          font-weight: bold;
        }
        .progress-bar-container {
          height: 8px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
          overflow: hidden;
          position: relative;
        }
        .progress-bar {
          height: 100%;
          background: linear-gradient(90deg, #f59e0b, #ef4444);
          border-radius: 4px;
          transition: width 0.4s ease;
        }
        .progress-pct {
          position: absolute;
          right: 4px;
          top: -16px;
          font-size: 0.65rem;
          color: #9ca3af;
          font-family: monospace;
        }
        .ieo-display {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }
        .ieo-number {
          font-size: 2rem;
          font-weight: 900;
          color: #f59e0b;
          margin-right: 0.5rem;
        }
        .ieo-label {
          font-size: 0.9rem;
          color: #d1d5db;
          text-transform: uppercase;
        }
        .advantage-badge {
          display: inline-block;
          background: rgba(245, 158, 11, 0.15);
          color: #fbbf24;
          border: 1px solid rgba(245, 158, 11, 0.4);
          padding: 0.2rem 0.6rem;
          border-radius: 999px;
          font-size: 0.7rem;
          margin: 0.4rem 0;
        }
        .ieo-reference-table {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .ieo-ref-row {
          display: flex;
          justify-content: space-between;
          padding: 0.4rem 0.6rem;
          border-radius: 6px;
          font-size: 0.75rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid transparent;
        }
        .ieo-ref-row.active {
          background: rgba(245, 158, 11, 0.1);
          border-color: rgba(245, 158, 11, 0.4);
          color: #f59e0b;
          font-weight: bold;
        }
        @media (max-width: 900px) {
          .frame-grid {
            grid-template-columns: 1fr;
          }
          .ieo-display {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};
