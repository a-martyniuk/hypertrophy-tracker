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
    <div className="skeletal-frame-view animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--primary-color)' }}>
            <Dna size={24} />
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>{t('genetics.title')}</h2>
          </div>
          <a
            href="/analysis"
            className="btn-secondary !text-xs !py-1.5 !px-3 flex items-center gap-1.5 font-mono text-amber-400 border-amber-500/30 hover:border-amber-400"
            style={{ textDecoration: 'none' }}
          >
            <Sparkles size={14} />
            <span>Ver Auditoría Real en Análisis &rarr;</span>
          </a>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
          Laboratorio de proyección y límites fisiológicos teóricos: Simulación de estructura ósea (Casey Butt), techo magro de competición (Martin Berkhan) y tasas de ganancia mensual (Eric Helms).
        </p>
      </div>

      {/* Grid 1: Casey Butt Inputs & Potential Limits */}
      <div className="frame-layout">
        {/* Left Inputs Column */}
        <div className="card glass" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>{t('genetics.base_measurements')}</span>
              <AppTooltip content={t('genetics.base_measurements_tooltip')} position="right">
                <HelpCircle size={14} style={{ opacity: 0.6, cursor: 'help' }} />
              </AppTooltip>
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontFamily: 'var(--font-mono)' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                <label>{t('common.form.height')} (CM)</label>
              </div>
              <input
                type="number"
                step="0.5"
                value={height || ''}
                onChange={(e) => setHeight(parseFloat(e.target.value) || 0)}
                style={{ width: '100%', background: 'transparent', border: 'none', fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', outline: 'none', padding: 0 }}
                placeholder="177"
              />
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                <label>{t('common.form.weight')} (KG)</label>
              </div>
              <input
                type="number"
                step="0.5"
                value={weight || ''}
                onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
                style={{ width: '100%', background: 'transparent', border: 'none', fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', outline: 'none', padding: 0 }}
                placeholder="75"
              />
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                <label>{t('common.form.body_fat')} (%)</label>
              </div>
              <input
                type="number"
                step="0.5"
                value={bodyFat || ''}
                onChange={(e) => setBodyFat(parseFloat(e.target.value) || 0)}
                style={{ width: '100%', background: 'transparent', border: 'none', fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', outline: 'none', padding: 0 }}
                placeholder="15"
              />
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '12px', padding: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                <label>{t('common.form.wrist')} (CM)</label>
                <AppTooltip content="Medida del hueso de la muñeca para calcular estructura ósea" position="top">
                  <HelpCircle size={12} style={{ opacity: 0.5 }} />
                </AppTooltip>
              </div>
              <input
                type="number"
                step="0.1"
                value={frame.wrist || ''}
                onChange={(e) => setFrame({ ...frame, wrist: parseFloat(e.target.value) || 0 })}
                style={{ width: '100%', background: 'transparent', border: 'none', fontSize: '1.25rem', fontWeight: 800, color: '#fbbf24', outline: 'none', padding: 0 }}
                placeholder="17.5"
              />
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: '12px', padding: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>
                <label>{t('common.form.ankle')} (CM)</label>
                <AppTooltip content="Medida del perímetro mínimo sobre el tobillo" position="top">
                  <HelpCircle size={12} style={{ opacity: 0.5 }} />
                </AppTooltip>
              </div>
              <input
                type="number"
                step="0.1"
                value={frame.ankle || ''}
                onChange={(e) => setFrame({ ...frame, ankle: parseFloat(e.target.value) || 0 })}
                style={{ width: '100%', background: 'transparent', border: 'none', fontSize: '1.25rem', fontWeight: 800, color: '#fbbf24', outline: 'none', padding: 0 }}
                placeholder="22.5"
              />
            </div>
          </div>
        </div>

        {/* Right Potential Limits Display */}
        <div className="card glass" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Target size={18} style={{ color: 'var(--primary-color)' }} />
              <span>Límite Genético Estimado (Modelo Casey Butt)</span>
            </h3>
            <span className="badge badge-amber font-mono text-[11px]">@ {bodyFat}% Grasa</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', fontFamily: 'var(--font-mono)' }}>
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
                <div key={key} style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)', borderRadius: '12px', padding: '0.85rem 1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontWeight: 700, color: '#ffffff' }}>{label}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      {current ? (
                        <span style={{ color: 'var(--text-secondary)' }}>Actual: <strong style={{ color: '#ffffff' }}>{current} cm</strong></span>
                      ) : null}
                      <span style={{ color: 'var(--primary-color)', fontWeight: 800 }}>Máx {max} cm</span>
                    </div>
                  </div>
                  <div style={{ width: '100%', height: '8px', background: 'rgba(0, 0, 0, 0.4)', borderRadius: '999px', overflow: 'hidden', padding: '1px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                    <div
                      style={{
                        height: '100%',
                        borderRadius: '999px',
                        background: 'var(--primary-gradient)',
                        width: `${progress}%`,
                        transition: 'width 0.5s ease'
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                    <span>Progreso: <strong style={{ color: '#fbbf24' }}>{progress}%</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grid 2: FFMI & Berkhan Models */}
      <div className="grid-2col">
        {/* FFMI Normalizado Card */}
        <div className="card glass" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Scale size={16} style={{ color: 'var(--primary-color)' }} />
              <span>FFMI Normalizado (Fat-Free Mass Index)</span>
            </h3>
            <span className="badge badge-amber font-mono text-[10px]">Kouri et al.</span>
          </div>

          {ffmi ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontFamily: 'var(--font-mono)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', padding: '1rem', background: 'rgba(0, 0, 0, 0.3)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>FFMI NORMALIZADO</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 900, color: '#fbbf24', marginTop: '0.2rem' }}>{ffmi.normalizedFFMI}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>FFMI Crudo: {ffmi.rawFFMI}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>MASA MAGRA PURA</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#ffffff', marginTop: '0.2rem' }}>{ffmi.leanMassKg} kg</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Grasa: {ffmi.fatMassKg} kg ({bodyFat}%)</div>
                </div>
              </div>

              {/* FFMI Natural Scale */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.4rem', fontFamily: 'var(--font-main)' }}>
                  <span>Escala Fisiológica Natural</span>
                  <span style={{ color: '#fbbf24', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                    {ffmi.normalizedFFMI < 20 ? 'Promedio / Recreacional' :
                     ffmi.normalizedFFMI < 22 ? 'Atlético Entrenado' :
                     ffmi.normalizedFFMI < 23 ? 'Avanzado / Competitivo' :
                     ffmi.normalizedFFMI < 25 ? 'Límite Natural Superior' : 'Excepcional / Suprafisiológico'}
                  </span>
                </div>
                <div style={{ width: '100%', height: '10px', background: 'rgba(0, 0, 0, 0.4)', borderRadius: '999px', overflow: 'hidden', padding: '1px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div
                    style={{
                      height: '100%',
                      borderRadius: '999px',
                      background: 'linear-gradient(90deg, #38bdf8 0%, #fbbf24 60%, #ef4444 100%)',
                      width: `${Math.min(100, Math.max(5, ffmi.scorePercent))}%`,
                      transition: 'all 0.5s ease'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                  <span>15.0</span>
                  <span>20.0 (Atlético)</span>
                  <span>22.0</span>
                  <span>25.0 (Techo Natural)</span>
                </div>
              </div>
            </div>
          ) : (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Ingresa peso, altura y grasa para calcular FFMI.</p>
          )}
        </div>

        {/* Martin Berkhan Model Card */}
        <div className="card glass" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontFamily: 'var(--font-mono)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Award size={16} style={{ color: 'var(--primary-color)' }} />
              <span>Modelo Martin Berkhan (Leangains)</span>
            </h3>
            <span className="badge badge-amber font-mono text-[10px]">Altura - 100</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-main)', lineHeight: 1.5 }}>
              Proyección de peso corporal máximo alcanzable por un atleta natural en estado magro de competición (~5% BF) y a tu % de grasa actual.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', textAlign: 'center' }}>
              <div style={{ padding: '1rem', background: 'rgba(0, 0, 0, 0.3)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>MÁXIMO EN CORTE (5% BF)</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#fbbf24', marginTop: '0.25rem' }}>{berkhan.maxWeightAtCompBf} kg</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Masa magra: {berkhan.maxLeanWeightKg} kg</div>
              </div>
              <div style={{ padding: '1rem', background: 'rgba(0, 0, 0, 0.3)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 700 }}>MÁXIMO A TU BF ({bodyFat}%)</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#ffffff', marginTop: '0.25rem' }}>{berkhan.maxWeightAtCurrentBf} kg</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Con {bodyFat}% de grasa</div>
              </div>
            </div>

            <div style={{ padding: '0.75rem 1rem', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)', fontSize: '0.75rem', fontFamily: 'var(--font-main)', color: 'var(--text-primary)', lineHeight: 1.4 }}>
              💡 Para tu estatura ({height} cm), tu potencial magro natural absoluto es de aproximadamente <strong style={{ color: '#fbbf24', fontFamily: 'var(--font-mono)' }}>{berkhan.maxLeanWeightKg} kg de masa muscular pura</strong>.
            </div>
          </div>
        </div>
      </div>

      {/* Grid 3: Eric Helms Gain Rates & IEO */}
      <div className="grid-2col">
        {/* Eric Helms / Lyle McDonald Rates */}
        <div className="card glass" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontFamily: 'var(--font-mono)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <TrendingUp size={16} style={{ color: 'var(--primary-color)' }} />
              <span>Tasas de Ganancia Realistas (Helms & McDonald)</span>
            </h3>
          </div>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-main)', lineHeight: 1.5 }}>
            Tasa de aumento mensual de masa muscular limpia esperable según tu nivel de experiencia:
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', fontSize: '0.8rem' }}>
            <div style={{ padding: '0.75rem 1rem', borderRadius: '12px', background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 800, color: '#fbbf24' }}>PRINCIPIANTE (0 - 1 año)</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>1.0% – 1.5% peso / mes</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 800, color: '#ffffff' }}>+{helms.beginner.minKgMonth} a {helms.beginner.maxKgMonth} kg/mes</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>~{helms.beginner.minGramsWeek}-{helms.beginner.maxGramsWeek} g/semana</div>
              </div>
            </div>

            <div style={{ padding: '0.75rem 1rem', borderRadius: '12px', background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 800, color: '#f59e0b' }}>INTERMEDIO (1 - 3 años)</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>0.5% – 1.0% peso / mes</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 800, color: '#ffffff' }}>+{helms.intermediate.minKgMonth} a {helms.intermediate.maxKgMonth} kg/mes</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>~{helms.intermediate.minGramsWeek}-{helms.intermediate.maxGramsWeek} g/semana</div>
              </div>
            </div>

            <div style={{ padding: '0.75rem 1rem', borderRadius: '12px', background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 800, color: '#d97706' }}>AVANZADO (3+ años)</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>0.25% – 0.5% peso / mes</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 800, color: '#ffffff' }}>+{helms.advanced.minKgMonth} a {helms.advanced.maxKgMonth} kg/mes</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>~{helms.advanced.minGramsWeek}-{helms.advanced.maxGramsWeek} g/semana</div>
              </div>
            </div>
          </div>
        </div>

        {/* IEO Card */}
        <div className="card glass" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Sparkles size={16} style={{ color: 'var(--primary-color)' }} />
              <span>{t('genetics.ieo.title')}</span>
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div style={{ padding: '1rem', background: 'rgba(0, 0, 0, 0.3)', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)', fontFamily: 'var(--font-mono)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                <span style={{ fontSize: '2rem', fontWeight: 900, color: '#fbbf24' }}>{ieo.value}</span>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-secondary)' }}>{t(`genetics.ieo.${ieo.label}`)}</span>
              </div>
              {ieo.isAdvantage && (
                <span className="badge badge-amber text-[10px]">
                  ✨ {t('genetics.ieo.advantage')}
                </span>
              )}
              <p style={{ fontFamily: 'var(--font-main)', fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginTop: '0.25rem' }}>
                {t('genetics.ieo.description')}
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontFamily: 'var(--font-mono)' }}>
              {IEO_CATEGORIES.map((cat, idx) => {
                const isActive = ieo.rawValue >= cat.min && ieo.rawValue < cat.max;
                return (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.6rem 0.8rem',
                      borderRadius: '8px',
                      fontSize: '0.75rem',
                      background: isActive ? 'rgba(245, 158, 11, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                      border: isActive ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(255, 255, 255, 0.04)',
                      color: isActive ? '#fbbf24' : 'var(--text-secondary)',
                      fontWeight: isActive ? 700 : 500
                    }}
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
