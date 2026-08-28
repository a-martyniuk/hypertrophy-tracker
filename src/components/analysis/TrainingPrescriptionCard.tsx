import React, { useState } from 'react';
import { Dumbbell, Target, Sparkles, ChevronDown, ChevronUp, AlertCircle, CheckCircle2, Flame, Layers, HelpCircle } from 'lucide-react';
import { Tooltip as AppTooltip } from '../Tooltip';
import type { ComprehensivePrescription } from '../../utils/trainingPrescription';
import './TrainingPrescriptionCard.css';

interface Props {
  prescriptionData: ComprehensivePrescription;
}

export const TrainingPrescriptionCard: React.FC<Props> = ({ prescriptionData }) => {
  const [selectedMuscle, setSelectedMuscle] = useState<string>(
    prescriptionData.prescriptions[0]?.key || ''
  );
  const [showAdvice, setShowAdvice] = useState<boolean>(true);

  if (!prescriptionData || prescriptionData.prescriptions.length === 0) {
    return (
      <div className="prescription-card glass">
        <div className="prescription-empty">
          <AlertCircle size={28} className="text-amber-400" />
          <p>Registra tus medidas antropométricas completas para generar tu prescripción de hipertrofia personalizada.</p>
        </div>
      </div>
    );
  }

  const activePrescription = prescriptionData.prescriptions.find(p => p.key === selectedMuscle) || prescriptionData.prescriptions[0];

  return (
    <div className="prescription-card glass animate-fade-in">
      {/* Header */}
      <div className="prescription-header">
        <div className="header-left">
          <div className="prescription-icon-badge">
            <Dumbbell size={22} className="text-amber-400" />
          </div>
          <div>
            <div className="header-badge-row">
              <span className="prescription-tag">Coaching Biomecánico & Algoritmo de Volumen</span>
              <span className="prescription-score-badge">Nivel Global: {prescriptionData.globalScore}%</span>
            </div>
            <h3 className="prescription-title">Prescripción Táctica de Entrenamiento</h3>
          </div>
        </div>
      </div>

      {/* Lagging Muscle Alert Banner */}
      <div className="lagging-focus-banner">
        <div className="banner-icon">
          <Flame size={20} className="text-red-400" />
        </div>
        <div className="banner-text">
          <span className="banner-label">Foco de Especialización Prioritaria:</span>
          <span className="banner-val">{prescriptionData.primaryLaggingGroup}</span>
          <p className="banner-sub">
            Se recomienda destinar mayor frecuencia y volumen semanal para balancear la simetría con el resto del cuerpo.
          </p>
        </div>
      </div>

      {/* Muscle Selector Tabs */}
      <div className="muscle-selector-strip">
        {prescriptionData.prescriptions.map((p) => {
          const isSelected = p.key === activePrescription.key;
          return (
            <button
              key={p.key}
              type="button"
              className={`muscle-tab-btn ${isSelected ? 'active' : ''} priority-lvl-${p.priorityLevel}`}
              onClick={() => setSelectedMuscle(p.key)}
              style={{
                borderColor: isSelected ? p.priorityColor : undefined,
                boxShadow: isSelected ? `0 0 15px ${p.priorityBg}` : undefined
              }}
            >
              <div className="tab-top">
                <span className="tab-name">{p.muscleName}</span>
                <span 
                  className="tab-badge"
                  style={{ color: p.priorityColor, backgroundColor: p.priorityBg }}
                >
                  P{p.priorityLevel}
                </span>
              </div>
              <div className="tab-metric">
                <span>{p.percentOfMax}%</span>
                <small>de {p.potentialCm} cm</small>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Muscle Prescription Detail View */}
      {activePrescription && (
        <div className="active-prescription-panel glass-darker animate-scale-up">
          {/* Top Info Row */}
          <div className="active-panel-top">
            <div className="active-name-group">
              <div className="active-title-row">
                <h4 className="active-muscle-title">{activePrescription.muscleName}</h4>
                <AppTooltip content="P1 = Prioridad Máxima (grupo rezagado con mayor volumen asignado). P2/P3 = Crecimiento equilibrado. P4 = Mantenimiento y calidad." position="top" width="260px">
                  <span 
                    className="priority-pill"
                    style={{ color: activePrescription.priorityColor, backgroundColor: activePrescription.priorityBg, cursor: 'help' }}
                  >
                    {activePrescription.priorityLabel}
                  </span>
                </AppTooltip>
              </div>
              <p className="active-diagnosis">{activePrescription.tacticalDiagnosis}</p>
            </div>

            {/* Quick Metrics Cards */}
            <div className="active-metrics-grid">
              <div className="metric-box">
                <span className="m-lbl" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                  <span>Volumen Semanal</span>
                  <AppTooltip content="Series efectivas a la semana llevadas a RIR 1-3 (cerca del fallo muscular) para máxima hipertrofia sin fatiga residual excesiva." position="top" width="240px">
                    <HelpCircle size={12} style={{ opacity: 0.6, cursor: 'help' }} />
                  </AppTooltip>
                </span>
                <span className="m-val highlight" style={{ color: activePrescription.priorityColor }}>
                  {activePrescription.recommendedWeeklySets} series
                </span>
                <span className="m-sub">óptimas / sem</span>
              </div>
              <div className="metric-box">
                <span className="m-lbl" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                  <span>Frecuencia</span>
                  <AppTooltip content="Número de días a la semana en que conviene entrenar este músculo para mantener la síntesis proteica elevada." position="top" width="220px">
                    <HelpCircle size={12} style={{ opacity: 0.6, cursor: 'help' }} />
                  </AppTooltip>
                </span>
                <span className="m-val">{activePrescription.recommendedFrequency}</span>
                <span className="m-sub">distribución</span>
              </div>
              <div className="metric-box">
                <span className="m-lbl" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                  <span>Desarrollo Real</span>
                  <AppTooltip content="Comparativa entre tu perímetro actual y tu límite genético natural calculado por el modelo Casey Butt." position="top" width="240px">
                    <HelpCircle size={12} style={{ opacity: 0.6, cursor: 'help' }} />
                  </AppTooltip>
                </span>
                <span className="m-val">{activePrescription.currentCm} / {activePrescription.potentialCm} cm</span>
                <span className="m-sub">{activePrescription.percentOfMax}% del límite</span>
              </div>
            </div>
          </div>

          {/* Biomechanical Exercise Prescriptions */}
          <div className="exercises-section">
            <div className="exercises-section-title">
              <Layers size={16} className="text-amber-400" />
              <span>Ejercicios con Énfasis Biomecánico Recomendados</span>
            </div>

            <div className="exercise-cards-grid">
              {activePrescription.exercises.map((ex, idx) => (
                <div key={idx} className="exercise-card glass">
                  <div className="exercise-card-header">
                    <span className="ex-number">#{idx + 1}</span>
                    <h5 className="ex-name">{ex.name}</h5>
                  </div>
                  
                  <div className="ex-emphasis-tag">
                    <Sparkles size={12} />
                    <span>{ex.emphasis}</span>
                  </div>

                  <div className="ex-dosage-row">
                    <div className="dosage-item">
                      <span className="dosage-lbl">Dosis:</span>
                      <span className="dosage-val">{ex.setsPerWeek}</span>
                    </div>
                    <div className="dosage-item">
                      <span className="dosage-lbl">Rango:</span>
                      <span className="dosage-val">{ex.repRange}</span>
                    </div>
                  </div>

                  <p className="ex-cue">
                    <strong>Pauta de ejecución:</strong> {ex.tips}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* General Evidence-Based Training Rules Accordion */}
      <div className="prescription-rules-section">
        <button 
          type="button" 
          className="rules-toggle-btn"
          onClick={() => setShowAdvice(!showAdvice)}
        >
          <div className="rules-toggle-left">
            <Target size={16} className="text-amber-400" />
            <span>Principios Científicos de Aplicación de Hipertrofia</span>
          </div>
          {showAdvice ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {showAdvice && (
          <ul className="rules-list animate-fade-in">
            {prescriptionData.generalTrainingAdvice.map((advice, idx) => (
              <li key={idx} className="rule-item">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                <span>{advice}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
