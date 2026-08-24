import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target, HelpCircle, Sparkles, TrendingUp, Award, Dna } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Tooltip as AppTooltip } from './Tooltip';
import type { BodyMeasurements, SkeletalFrame } from '../types/measurements';
import {
  calculateSkeletalPotential,
  calculateIEO,
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
  const navigate = useNavigate();
  const { t } = useTranslation();

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

  useEffect(() => {
    localStorage.setItem('skeletal_frame_draft', JSON.stringify(frame));
  }, [frame]);

  const potential = calculateSkeletalPotential(frame.wrist, frame.ankle, height, sex);
  const ieo = calculateIEO(frame.wrist, frame.ankle, sex);
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
      {/* Header with Direct SPA Navigation to Analysis */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', paddingBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--primary-color)' }}>
            <Dna size={24} />
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>{t('genetics.title')}</h2>
          </div>
          <button
            onClick={() => navigate('/analysis')}
            className="btn-secondary !text-xs !py-1.5 !px-3 flex items-center gap-1.5 font-mono text-amber-400 border-amber-500/30 hover:border-amber-400"
          >
            <Sparkles size={14} />
            <span>Ver Auditoría Real en Análisis &rarr;</span>
          </button>
        </div>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
          Laboratorio de simulación y modelos de potencial fisiológico: Estructura ósea (Casey Butt), techo magro de competición (Martin Berkhan) y tasas de ganancia mensual (Eric Helms).
        </p>
      </div>

      {/* Grid 1: Simulation Inputs & Casey Butt Potential Projection */}
      <div className="frame-layout">
        {/* Left Inputs Simulation Column */}
        <div className="card glass" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--primary-color)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span>{t('genetics.base_measurements')} (Simulador)</span>
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

        {/* Right Potential Limits Table */}
        <div className="card glass" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Target size={18} style={{ color: 'var(--primary-color)' }} />
              <span>Proyección de Perímetros Máximos (Casey Butt)</span>
            </h3>
            <span className="badge badge-amber font-mono text-[11px]">@ {bodyFat}% Grasa</span>
          </div>

          {/* Educational Callout Banner */}
          <div style={{
            padding: '0.75rem 0.9rem',
            borderRadius: '12px',
            background: 'rgba(56, 189, 248, 0.08)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.25rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#38bdf8', fontWeight: 800, fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
              <HelpCircle size={14} />
              <span>¿CÓMO INTERPRETAR ESTA PROYECCIÓN?</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.73rem', color: '#cbd5e1', lineHeight: 1.4 }}>
              Este es el <strong>techo genético 100% natural</strong> que puede alcanzar tu musculatura según el grosor de tus huesos de muñeca (<strong style={{ color: '#fbbf24' }}>{frame.wrist} cm</strong>) y tobillo (<strong style={{ color: '#fbbf24' }}>{frame.ankle} cm</strong>).
            </p>
          </div>

          {/* Muscle Projections Comparison Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem', fontFamily: 'var(--font-mono)' }}>
            {(() => {
              const getActual = (val: number | { left: number; right: number } | undefined) => {
                if (!val) return 0;
                if (typeof val === 'object') {
                  return Math.max(val.left || 0, val.right || 0);
                }
                return val || 0;
              };

              const items = [
                { id: 'chest', label: t('common.form.chest'), max: potential.chest, actual: currentMeasurements ? getActual(currentMeasurements.pecho) : 0 },
                { id: 'arm', label: t('common.form.arm'), max: potential.biceps, actual: currentMeasurements ? getActual(currentMeasurements.arm) : 0 },
                { id: 'forearm', label: t('common.form.forearm'), max: potential.forearms, actual: currentMeasurements ? getActual(currentMeasurements.forearm) : 0 },
                { id: 'neck', label: t('common.form.neck'), max: potential.neck, actual: currentMeasurements ? getActual(currentMeasurements.neck) : 0 },
                { id: 'thigh', label: t('common.form.thigh'), max: potential.thighs, actual: currentMeasurements ? getActual(currentMeasurements.thigh) : 0 },
                { id: 'calf', label: t('common.form.calf'), max: potential.calves, actual: currentMeasurements ? getActual(currentMeasurements.calf) : 0 },
              ];

              return items.map(({ label, max, actual }) => {
                const pct = actual > 0 ? Math.min(100, Math.round((actual / max) * 100)) : 0;
                const remaining = actual > 0 ? Math.max(0, parseFloat((max - actual).toFixed(1))) : 0;

                let badgeColor = '#64748b';
                let badgeBg = 'rgba(255, 255, 255, 0.05)';
                let badgeText = 'Límite Estimado';

                if (pct >= 95) {
                  badgeColor = '#fbbf24';
                  badgeBg = 'rgba(245, 158, 11, 0.15)';
                  badgeText = `${pct}% Élite Natural`;
                } else if (pct >= 90) {
                  badgeColor = '#10b981';
                  badgeBg = 'rgba(16, 185, 129, 0.15)';
                  badgeText = `${pct}% Avanzado`;
                } else if (pct >= 80) {
                  badgeColor = '#38bdf8';
                  badgeBg = 'rgba(56, 189, 248, 0.15)';
                  badgeText = `${pct}% Intermedio`;
                } else if (pct > 0) {
                  badgeColor = '#94a3b8';
                  badgeBg = 'rgba(148, 163, 184, 0.12)';
                  badgeText = `${pct}% Base`;
                }

                return (
                  <div
                    key={label}
                    style={{
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.07)',
                      borderRadius: '14px',
                      padding: '0.85rem 1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem'
                    }}
                  >
                    {/* Header: Name + Badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#ffffff', textTransform: 'uppercase' }}>
                        {label}
                      </span>
                      <span
                        style={{
                          fontSize: '0.65rem',
                          fontWeight: 800,
                          color: badgeColor,
                          background: badgeBg,
                          padding: '2px 7px',
                          borderRadius: '999px',
                          border: `1px solid ${badgeColor}35`
                        }}
                      >
                        {badgeText}
                      </span>
                    </div>

                    {/* Values Row: Actual vs Max */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', alignItems: 'baseline' }}>
                      <div>
                        <div style={{ fontSize: '0.62rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Tu Medida</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 900, color: actual > 0 ? '#ffffff' : '#64748b' }}>
                          {actual > 0 ? actual : '--'} <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>cm</span>
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.62rem', color: '#fbbf24', textTransform: 'uppercase', fontWeight: 700 }}>Techo Máximo</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--primary-color)' }}>
                          {max} <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>cm</span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    {actual > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.2rem' }}>
                        <div style={{ position: 'relative', width: '100%', height: '6px', background: 'rgba(0, 0, 0, 0.4)', borderRadius: '999px', overflow: 'hidden' }}>
                          <div
                            style={{
                              position: 'absolute',
                              left: 0,
                              top: 0,
                              height: '100%',
                              width: `${pct}%`,
                              background: pct >= 95
                                ? 'linear-gradient(90deg, #f59e0b, #fbbf24)'
                                : pct >= 90
                                ? 'linear-gradient(90deg, #38bdf8, #10b981)'
                                : 'linear-gradient(90deg, #64748b, #38bdf8)',
                              borderRadius: '999px',
                              boxShadow: '0 0 8px rgba(56, 189, 248, 0.3)'
                            }}
                          />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.62rem', color: 'var(--text-secondary)' }}>
                          <span>Margen de crecimiento:</span>
                          <span style={{ color: remaining === 0 ? '#10b981' : '#38bdf8', fontWeight: 700 }}>
                            {remaining > 0 ? `+${remaining} cm por ganar` : '¡Máximo Alcanzado! 🎉'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              });
            })()}
          </div>

          <div style={{ padding: '0.75rem 1rem', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.06)', border: '1px solid rgba(245, 158, 11, 0.2)', fontSize: '0.73rem', color: '#cbd5e1', lineHeight: 1.4 }}>
            <strong style={{ color: '#fbbf24', display: 'block', marginBottom: '2px' }}>Fórmula Dinámica en Tiempo Real:</strong>
            Al modificar tus medidas óseas o el % de grasa en el simulador de la izquierda, tus perímetros máximos se recalculan al instante.
          </div>
        </div>
      </div>

      {/* Grid 2: Martin Berkhan Model & Helms Gain Rates */}
      <div className="grid-2col">
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
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-main)', lineHeight: 1.5, margin: 0 }}>
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

        {/* Eric Helms / Lyle McDonald Rates */}
        <div className="card glass" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontFamily: 'var(--font-mono)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <TrendingUp size={16} style={{ color: 'var(--primary-color)' }} />
              <span>Tasas de Ganancia Realistas (Helms & McDonald)</span>
            </h3>
          </div>

          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-main)', lineHeight: 1.5, margin: 0 }}>
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
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>~{helms.beginner.minGramsWeek}-{helms.beginner.maxGramsWeek} g/sem</div>
              </div>
            </div>

            <div style={{ padding: '0.75rem 1rem', borderRadius: '12px', background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 800, color: '#f59e0b' }}>INTERMEDIO (1 - 3 años)</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>0.5% – 1.0% peso / mes</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 800, color: '#ffffff' }}>+{helms.intermediate.minKgMonth} a {helms.intermediate.maxKgMonth} kg/mes</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>~{helms.intermediate.minGramsWeek}-{helms.intermediate.maxGramsWeek} g/sem</div>
              </div>
            </div>

            <div style={{ padding: '0.75rem 1rem', borderRadius: '12px', background: 'rgba(0, 0, 0, 0.3)', border: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 800, color: '#d97706' }}>AVANZADO (3+ años)</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>0.25% – 0.5% peso / mes</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 800, color: '#ffffff' }}>+{helms.advanced.minKgMonth} a {helms.advanced.maxKgMonth} kg/mes</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>~{helms.advanced.minGramsWeek}-{helms.advanced.maxGramsWeek} g/sem</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid 3: IEO Complexion Index */}
      <div className="card glass" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '0.75rem' }}>
          <h3 style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Sparkles size={16} style={{ color: 'var(--primary-color)' }} />
            <span>{t('genetics.ieo.title')} (Índice de Estructura Ósea)</span>
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
            <p style={{ fontFamily: 'var(--font-main)', fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4, marginTop: '0.25rem', margin: 0 }}>
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
  );
};
