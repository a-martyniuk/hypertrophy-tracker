import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  CheckCircle2,
  HelpCircle
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
  const { t } = useTranslation();
  const [showCoreModal, setShowCoreModal] = useState(false);

  // List of anatomical muscles for navigation
  const muscleKeys = MEASUREMENT_KEYS.filter(k => !['weight', 'height', 'bodyFat'].includes(k));
  const currentIndex = muscleKeys.indexOf(activeMuscle);
  const currentMetadata = MUSCLE_METADATA[activeMuscle] || MUSCLE_METADATA['pecho'];

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

  // Calculate measured count
  const measuredCount = muscleKeys.filter(k => {
    const val = (measurements as any)[k];
    if (typeof val === 'object' && val !== null) {
      return (val.left > 0 || val.right > 0);
    }
    return val > 0;
  }).length;

  return (
    <div className="mobile-tap-measure-container">
      {/* Top Floating Control Bar */}
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
            <span>Guía</span>
          </button>
        </div>

        {/* Quick Core Metrics Pills */}
        <div className="core-pills-row">
          <button
            type="button"
            className={`core-pill ${(measurements.weight > 0) ? 'filled' : ''}`}
            onClick={() => setShowCoreModal(true)}
          >
            <Scale size={13} className="pill-icon" />
            <span className="pill-label">Peso:</span>
            <span className="pill-val">{measurements.weight > 0 ? `${measurements.weight}kg` : '--'}</span>
          </button>

          <button
            type="button"
            className={`core-pill ${(measurements.height > 0) ? 'filled' : ''}`}
            onClick={() => setShowCoreModal(true)}
          >
            <Ruler size={13} className="pill-icon" />
            <span className="pill-label">Alt:</span>
            <span className="pill-val">{measurements.height > 0 ? `${measurements.height}cm` : '--'}</span>
          </button>

          <button
            type="button"
            className={`core-pill ${(measurements.bodyFat > 0) ? 'filled' : ''}`}
            onClick={() => setShowCoreModal(true)}
          >
            <Percent size={13} className="pill-icon" />
            <span className="pill-label">Grasa:</span>
            <span className="pill-val">{measurements.bodyFat > 0 ? `${measurements.bodyFat}%` : '--'}</span>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="progress-bar-container">
          <div 
            className="progress-bar-fill" 
            style={{ width: `${(measuredCount / muscleKeys.length) * 100}%` }}
          />
          <span className="progress-text">{measuredCount} / {muscleKeys.length} grupos medidos</span>
        </div>
      </div>

      {/* Center Interactive Silhouette Stage */}
      <div className="mobile-silhouette-stage">
        <div className="stage-instruction-bubble animate-pulse-subtle">
          <span>👆 Toca un músculo en la silueta para medirlo</span>
        </div>

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

      {/* Floating Bottom Sheet HUD */}
      <div className="mobile-bottom-sheet glass animate-slide-up">
        {/* Muscle Header & ISAK Tip */}
        <div className="sheet-header">
          <div className="sheet-title-col">
            <div className="sheet-badge-row">
              <span className="sheet-category-badge">{currentMetadata.categoryLabel}</span>
              {((measurements as any)[activeMuscle] > 0 || ((measurements as any)[activeMuscle]?.left > 0)) && (
                <span className="sheet-recorded-badge">
                  <CheckCircle2 size={12} /> Registrado
                </span>
              )}
            </div>
            <h3 className="sheet-muscle-title">{currentMetadata.name}</h3>
          </div>

          <div className="sheet-nav-controls">
            <button type="button" className="btn-sheet-nav" onClick={handlePrev} title="Anterior">
              <ChevronLeft size={20} />
            </button>
            <span className="sheet-index-indicator">
              {currentIndex + 1}/{muscleKeys.length}
            </span>
            <button type="button" className="btn-sheet-nav" onClick={handleNext} title="Siguiente">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        <p className="sheet-instruction-tip">
          <HelpCircle size={13} className="tip-icon" />
          <span>{currentMetadata.instruction}</span>
        </p>

        {/* Dynamic Measurement Inputs */}
        <div className="sheet-input-stage">
          {currentMetadata.isBilateral ? (
            <div className="bilateral-sheet-inputs">
              {/* Left Side */}
              <div className="side-input-box">
                <div className="side-label-row">
                  <span className="side-tag">IZQUIERDO</span>
                  {prevVal?.left > 0 && (
                    <span className="side-prev">Ant: {prevVal.left}cm</span>
                  )}
                </div>
                <div className="side-input-wrapper">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="0.0"
                    className="sheet-number-input"
                    value={(measurements as any)[activeMuscle]?.left || ''}
                    onChange={(e) => {
                      const cur = (measurements as any)[activeMuscle] || { left: 0, right: 0 };
                      setValue(activeMuscle, { ...cur, left: parseFloat(e.target.value) || 0 }, { shouldDirty: true, shouldValidate: true });
                    }}
                  />
                  <span className="sheet-unit">cm</span>
                </div>
              </div>

              {/* Right Side */}
              <div className="side-input-box">
                <div className="side-label-row">
                  <span className="side-tag">DERECHO</span>
                  {prevVal?.right > 0 && (
                    <span className="side-prev">Ant: {prevVal.right}cm</span>
                  )}
                </div>
                <div className="side-input-wrapper">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="0.0"
                    className="sheet-number-input"
                    value={(measurements as any)[activeMuscle]?.right || ''}
                    onChange={(e) => {
                      const cur = (measurements as any)[activeMuscle] || { left: 0, right: 0 };
                      setValue(activeMuscle, { ...cur, right: parseFloat(e.target.value) || 0 }, { shouldDirty: true, shouldValidate: true });
                    }}
                  />
                  <span className="sheet-unit">cm</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="single-sheet-input-box">
              <div className="single-input-wrapper">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="0.0"
                  className="sheet-number-input single"
                  value={(measurements as any)[activeMuscle] || ''}
                  onChange={(e) => {
                    setValue(activeMuscle, parseFloat(e.target.value) || 0, { shouldDirty: true, shouldValidate: true });
                  }}
                />
                <span className="sheet-unit single">{currentMetadata.unit}</span>
              </div>
              {prevVal > 0 && (
                <div className="single-prev-comparison">
                  <span>Anterior: <strong>{prevVal} {currentMetadata.unit}</strong></span>
                  {((measurements as any)[activeMuscle] > 0) && (
                    <span className={`diff-pill ${((measurements as any)[activeMuscle] - prevVal) >= 0 ? 'up' : 'down'}`}>
                      {((measurements as any)[activeMuscle] - prevVal) >= 0 ? '▲ +' : '▼ '}
                      {Math.abs((measurements as any)[activeMuscle] - prevVal).toFixed(1)} {currentMetadata.unit}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
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
