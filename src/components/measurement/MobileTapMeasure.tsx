import React, { useState, useRef, useEffect } from 'react';
import { DynamicSilhouette } from '../DynamicSilhouette';
import { MUSCLE_METADATA, MEASUREMENT_KEYS } from '../../utils/muscleMetadata';
import type { BodyMeasurements, MeasurementRecord } from '../../types/measurements';
import { 
  ChevronLeft, 
  ChevronRight, 
  Map as MapIcon, 
  Calculator, 
  Scale, 
  Ruler, 
  Percent,
  Calendar,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Plus,
  Minus
} from 'lucide-react';
import './MobileTapMeasure.css';

interface Props {
  measurements: BodyMeasurements;
  activeMuscle: string;
  setActiveMuscle: (muscle: string) => void;
  setValue: (name: any, val: any, options?: any) => void;
  previousRecord?: MeasurementRecord;
  sex?: 'male' | 'female';
  onOpenMap: () => void;
  onOpenBfCalc: () => void;
  date: string;
  setDate: (d: string) => void;
  errors?: any;
}

export const MobileTapMeasure: React.FC<Props> = ({
  measurements,
  activeMuscle,
  setActiveMuscle,
  setValue,
  previousRecord,
  sex = 'male',
  onOpenMap,
  onOpenBfCalc,
  date,
  setDate,
}) => {
  const [showCoreModal, setShowCoreModal] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // List of anatomical muscles for navigation
  const muscleKeys = MEASUREMENT_KEYS.filter(k => !['weight', 'height', 'bodyFat'].includes(k));
  const currentIndex = muscleKeys.indexOf(activeMuscle);
  const currentMetadata = MUSCLE_METADATA[activeMuscle] || MUSCLE_METADATA['pecho'];
  const nextMuscleKey = currentIndex < muscleKeys.length - 1 ? muscleKeys[currentIndex + 1] : muscleKeys[0];
  const nextMetadata = MUSCLE_METADATA[nextMuscleKey];

  // Auto focus input when active muscle changes
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [activeMuscle]);

  const handlePrev = () => {
    if (currentIndex <= 0) {
      setActiveMuscle(muscleKeys[muscleKeys.length - 1]);
    } else {
      setActiveMuscle(muscleKeys[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (currentIndex >= muscleKeys.length - 1) {
      setActiveMuscle(muscleKeys[0]);
    } else {
      setActiveMuscle(muscleKeys[currentIndex + 1]);
    }
  };

  // Helper for previous value comparison
  const getPrevValue = (key: string) => {
    if (!previousRecord?.measurements) return null;
    return (previousRecord.measurements as any)[key];
  };

  const prevVal = getPrevValue(activeMuscle);

  const weightVal = measurements?.weight || 0;
  const heightVal = measurements?.height || 0;
  const ageVal = measurements?.age || 0;
  const bodyFatVal = measurements?.bodyFat || 0;

  // Calculate measured count
  const measuredCount = muscleKeys.filter(k => {
    const val = (measurements as any)?.[k];
    if (typeof val === 'object' && val !== null) {
      return ((val.left || 0) > 0 || (val.right || 0) > 0);
    }
    return (val || 0) > 0;
  }).length;

  // Adjust single value by delta
  const adjustSingleVal = (delta: number) => {
    const cur = (measurements as any)[activeMuscle] || 0;
    const newVal = Math.max(0, parseFloat((cur + delta).toFixed(1)));
    setValue(activeMuscle, newVal, { shouldDirty: true, shouldValidate: true });
  };

  return (
    <div className="mobile-tap-measure-container">
      {/* Top Header Controls */}
      <div className="mobile-top-bar glass">
        <div className="top-meta-row">
          <input
            type="date"
            className="mobile-date-input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <button
            type="button"
            className="btn-mobile-map"
            onClick={onOpenMap}
          >
            <MapIcon size={14} />
            <span>Guía Anatómica</span>
          </button>
        </div>

        {/* Quick Core Metrics Pills */}
        <div className="core-pills-row">
          <button
            type="button"
            className={`core-pill ${weightVal > 0 ? 'filled' : ''}`}
            onClick={() => setShowCoreModal(true)}
          >
            <Scale size={13} className="pill-icon" />
            <span className="pill-label">Peso:</span>
            <span className="pill-val">{weightVal > 0 ? `${weightVal}kg` : '--'}</span>
          </button>

          <button
            type="button"
            className={`core-pill ${heightVal > 0 ? 'filled' : ''}`}
            onClick={() => setShowCoreModal(true)}
          >
            <Ruler size={13} className="pill-icon" />
            <span className="pill-label">Alt:</span>
            <span className="pill-val">{heightVal > 0 ? `${heightVal}cm` : '--'}</span>
          </button>

          <button
            type="button"
            className={`core-pill ${ageVal > 0 ? 'filled' : ''}`}
            onClick={() => setShowCoreModal(true)}
          >
            <Calendar size={13} className="pill-icon" />
            <span className="pill-label">Edad:</span>
            <span className="pill-val">{ageVal > 0 ? `${ageVal}a` : '--'}</span>
          </button>

          <button
            type="button"
            className={`core-pill ${bodyFatVal > 0 ? 'filled' : ''}`}
            onClick={() => setShowCoreModal(true)}
          >
            <Percent size={13} className="pill-icon" />
            <span className="pill-label">Grasa:</span>
            <span className="pill-val">{bodyFatVal > 0 ? `${bodyFatVal}%` : '--'}</span>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="progress-bar-container">
          <div 
            className="progress-bar-fill" 
            style={{ width: `${(measuredCount / muscleKeys.length) * 100}%` }}
          />
          <span className="progress-text">{measuredCount} de {muscleKeys.length} grupos medidos</span>
        </div>
      </div>

      {/* Center Silhouette Stage */}
      <div className="mobile-silhouette-stage">
        <div className="mobile-silhouette-wrapper">
          <DynamicSilhouette
            measurements={measurements}
            sex={sex}
            activeMuscle={activeMuscle}
            onMarkerClick={(muscle) => {
              const cleanMuscle = muscle.replace(/[LR]$/, '');
              setActiveMuscle(cleanMuscle);
            }}
          />
        </div>
      </div>

      {/* Directly Integrated Active Measurement Card */}
      <div className="active-measurement-hero-card glass animate-scale-up">
        {/* Card Header & Muscle Navigation */}
        <div className="hero-card-header">
          <div className="hero-title-group">
            <div className="hero-badge-row">
              <span className="hero-category-tag">{currentMetadata.categoryLabel}</span>
              {((measurements as any)[activeMuscle] > 0 || ((measurements as any)[activeMuscle]?.left > 0)) ? (
                <span className="hero-status-tag recorded">
                  <CheckCircle2 size={12} /> Registrado
                </span>
              ) : (
                <span className="hero-status-tag pending">
                  <Sparkles size={12} /> Toca para medir
                </span>
              )}
            </div>
            <h3 className="hero-muscle-title">{currentMetadata.name}</h3>
          </div>

          <div className="hero-nav-buttons">
            <button type="button" className="btn-hero-nav" onClick={handlePrev} title="Anterior">
              <ChevronLeft size={20} />
            </button>
            <span className="hero-step-text">{currentIndex + 1}/{muscleKeys.length}</span>
            <button type="button" className="btn-hero-nav" onClick={handleNext} title="Siguiente">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* ISAK Measurement Protocol Tip */}
        <div className="hero-protocol-tip">
          <span>📏 {currentMetadata.instruction}</span>
        </div>

        {/* Big Touch-First Input Stage */}
        <div className="hero-input-stage">
          {currentMetadata.isBilateral ? (
            <div className="hero-bilateral-inputs">
              {/* Left Side */}
              <div className="hero-side-card" style={{ borderColor: 'rgba(56, 189, 248, 0.3)' }}>
                <div className="hero-side-header">
                  <span className="hero-side-tag" style={{ color: '#38bdf8' }}>👈 TU IZQ (L)</span>
                  {prevVal?.left > 0 && <span className="hero-prev-text">Ant: {prevVal.left}cm</span>}
                </div>
                <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginBottom: '0.35rem', textAlign: 'left' }}>
                  Extremidad Izquierda
                </div>
                <div className="hero-side-row">
                  <input
                    ref={inputRef}
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="0.0"
                    className="hero-number-input"
                    value={(measurements as any)[activeMuscle]?.left || ''}
                    onChange={(e) => {
                      const cur = (measurements as any)[activeMuscle] || { left: 0, right: 0 };
                      setValue(activeMuscle, { ...cur, left: parseFloat(e.target.value) || 0 }, { shouldDirty: true, shouldValidate: true });
                    }}
                  />
                  <span className="hero-unit-tag">cm</span>
                </div>
              </div>

              {/* Right Side */}
              <div className="hero-side-card" style={{ borderColor: 'rgba(245, 158, 11, 0.3)' }}>
                <div className="hero-side-header">
                  <span className="hero-side-tag" style={{ color: '#fbbf24' }}>TU DER (R) 👉</span>
                  {prevVal?.right > 0 && <span className="hero-prev-text">Ant: {prevVal.right}cm</span>}
                </div>
                <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginBottom: '0.35rem', textAlign: 'left' }}>
                  Extremidad Derecha
                </div>
                <div className="hero-side-row">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="0.0"
                    className="hero-number-input"
                    value={(measurements as any)[activeMuscle]?.right || ''}
                    onChange={(e) => {
                      const cur = (measurements as any)[activeMuscle] || { left: 0, right: 0 };
                      setValue(activeMuscle, { ...cur, right: parseFloat(e.target.value) || 0 }, { shouldDirty: true, shouldValidate: true });
                    }}
                  />
                  <span className="hero-unit-tag">cm</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="hero-single-input-card">
              <div className="hero-stepper-row">
                <button
                  type="button"
                  className="btn-stepper minus"
                  onClick={() => adjustSingleVal(-0.5)}
                >
                  <Minus size={18} />
                </button>

                <div className="hero-single-input-wrapper">
                  <input
                    ref={inputRef}
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="0.0"
                    className="hero-number-input single"
                    value={(measurements as any)[activeMuscle] || ''}
                    onChange={(e) => {
                      setValue(activeMuscle, parseFloat(e.target.value) || 0, { shouldDirty: true, shouldValidate: true });
                    }}
                  />
                  <span className="hero-unit-tag single">{currentMetadata.unit}</span>
                </div>

                <button
                  type="button"
                  className="btn-stepper plus"
                  onClick={() => adjustSingleVal(0.5)}
                >
                  <Plus size={18} />
                </button>
              </div>

              {prevVal > 0 && (
                <div className="hero-prev-row">
                  <span>Medida anterior: <strong>{prevVal} {currentMetadata.unit}</strong></span>
                  {((measurements as any)[activeMuscle] > 0) && (
                    <span className={`hero-delta-badge ${((measurements as any)[activeMuscle] - prevVal) >= 0 ? 'up' : 'down'}`}>
                      {((measurements as any)[activeMuscle] - prevVal) >= 0 ? '▲ +' : '▼ '}
                      {Math.abs((measurements as any)[activeMuscle] - prevVal).toFixed(1)} {currentMetadata.unit}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Fast Step Action Button */}
        <button
          type="button"
          className="btn-hero-next"
          onClick={handleNext}
        >
          <span>Siguiente: {nextMetadata.name}</span>
          <ArrowRight size={18} />
        </button>
      </div>

      {/* Core Metrics Modal Dialog */}
      {showCoreModal && (
        <div className="mobile-core-modal-overlay animate-fade-in" onClick={() => setShowCoreModal(false)}>
          <div className="mobile-core-modal glass animate-scale-up" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Métricas Corporales Base</h3>
              <button type="button" className="btn-close-modal" onClick={() => setShowCoreModal(false)}>✕</button>
            </div>

            <div className="core-modal-inputs">
              <div className="core-field-card">
                <label>Peso Corporal (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="Ej: 82.5"
                  value={measurements.weight || ''}
                  onChange={(e) => setValue('weight', parseFloat(e.target.value) || 0, { shouldDirty: true })}
                />
              </div>

              <div className="core-field-card">
                <label>Altura (cm)</label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  placeholder="Ej: 180"
                  value={measurements.height || ''}
                  onChange={(e) => setValue('height', parseFloat(e.target.value) || 0, { shouldDirty: true })}
                />
              </div>

              <div className="core-field-card">
                <label>Edad del Atleta (Años)</label>
                <input
                  type="number"
                  step="1"
                  min="10"
                  max="120"
                  placeholder="Ej: 28"
                  value={measurements.age || ''}
                  onChange={(e) => setValue('age', parseFloat(e.target.value) || 0, { shouldDirty: true })}
                />
              </div>

              <div className="core-field-card">
                <label>% Grasa Corporal</label>
                <div className="bf-input-group">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="Ej: 15.0"
                    value={measurements.bodyFat || ''}
                    onChange={(e) => setValue('bodyFat', parseFloat(e.target.value) || 0, { shouldDirty: true })}
                  />
                  <button
                    type="button"
                    className="btn-navy-calc"
                    onClick={() => {
                      setShowCoreModal(false);
                      onOpenBfCalc();
                    }}
                  >
                    <Calculator size={14} />
                    <span>Fórmula US Navy</span>
                  </button>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="btn-apply-core"
              onClick={() => setShowCoreModal(false)}
            >
              Listo
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
