import { useState } from 'react';
import { Target, Info, Activity } from 'lucide-react';
import type { BodyMeasurements, SkeletalFrame } from '../types/measurements';

interface Props {
  baseline?: SkeletalFrame;
  currentMeasurements?: BodyMeasurements;
  onSave: (baseline: SkeletalFrame) => void;
}

export const SkeletalFrameView = ({ baseline, currentMeasurements, onSave }: Props) => {
  const [height, setHeight] = useState<number>(currentMeasurements?.height || 177);
  const [frame, setFrame] = useState<SkeletalFrame>(() => {
    if (baseline) return baseline;

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

  // Authentic Casey Butt Formula Constants
  // Source: "Your Muscular Potential" (http://www.weightrainer.net/potential.html)
  const CASEY_BUTT_CONSTANTS = {
    chest: { wrist: 1.6817, ankle: 1.3759, height: 0.3314 },
    biceps: { wrist: 1.2033, height: 0.1236 },
    forearms: { wrist: 0.9626, height: 0.0989 },
    neck: { wrist: 1.1424, height: 0.1236 },
    thighs: { ankle: 1.3868, height: 0.1805 },
    calves: { ankle: 0.9298, height: 0.1210 }
  };

  const calculatePotential = () => {
    const { wrist, ankle } = frame;
    // Use local height state for calculation
    const heightCm = height;

    // Convert to Imperial (Inches) for authentic Casey Butt calculation
    const W = wrist / 2.54;
    const A = ankle / 2.54;
    const H = heightCm / 2.54;

    // Authentic Casey Butt Formulas (output in Inches)
    // Source: "Your Muscular Potential" - height factors corrected
    const chestIn = CASEY_BUTT_CONSTANTS.chest.wrist * W + CASEY_BUTT_CONSTANTS.chest.ankle * A + CASEY_BUTT_CONSTANTS.chest.height * H;

    // Upper Body (Wrist + Height)
    const bicepsIn = CASEY_BUTT_CONSTANTS.biceps.wrist * W + CASEY_BUTT_CONSTANTS.biceps.height * H;
    const forearmsIn = CASEY_BUTT_CONSTANTS.forearms.wrist * W + CASEY_BUTT_CONSTANTS.forearms.height * H;
    const neckIn = CASEY_BUTT_CONSTANTS.neck.wrist * W + CASEY_BUTT_CONSTANTS.neck.height * H;

    // Lower Body (Ankle + Height)
    const thighsIn = CASEY_BUTT_CONSTANTS.thighs.ankle * A + CASEY_BUTT_CONSTANTS.thighs.height * H;
    const calvesIn = CASEY_BUTT_CONSTANTS.calves.ankle * A + CASEY_BUTT_CONSTANTS.calves.height * H;

    // Convert back to CM for display
    return {
      chest: (chestIn * 2.54).toFixed(1),
      biceps: (bicepsIn * 2.54).toFixed(1),
      forearms: (forearmsIn * 2.54).toFixed(1),
      neck: (neckIn * 2.54).toFixed(1),
      thighs: (thighsIn * 2.54).toFixed(1),
      calves: (calvesIn * 2.54).toFixed(1),
    };
  };

  const calculateIEO = () => {
    const { wrist, ankle } = frame;
    const ieo = (wrist + ankle) / 2;
    let label = '';
    let isAdvantage = false;

    if (ieo < 18) {
      label = 'Pequeña';
    } else if (ieo < 20) {
      label = 'Mediana';
    } else if (ieo < 22) {
      label = 'Grande';
      isAdvantage = true;
    } else {
      label = 'Muy Grande';
      isAdvantage = true;
    }

    return { value: ieo.toFixed(1), label, isAdvantage, rawValue: ieo };
  };

  const potential = calculatePotential();
  const ieo = calculateIEO();

  const IEO_CATEGORIES = [
    { label: 'Pequeña', range: '< 18', min: 0, max: 18 },
    { label: 'Mediana', range: '18 – 19.9', min: 18, max: 19.99 },
    { label: 'Grande', range: '20 – 21.9', min: 20, max: 21.99, highlight: true },
    { label: 'Muy grande', range: '≥ 22', min: 22, max: 999, highlight: true },
  ];

  return (
    <div className="skeletal-frame-view animate-fade-in">
      <div className="view-header">
        <div className="title-group">
          <Target className="text-primary" size={24} />
          <h2>Estructura Ósea y Potencial Genético</h2>
        </div>
        <p className="subtitle">Basado en el modelo científico de Casey Butt</p>
      </div>

      <div className="frame-grid">
        <div className="left-column">
          <div className="card glass baseline-input">
            <div className="card-header">
              <h3>Mis Medidas Base (cm)</h3>
            </div>
            <div className="hud-column">
              <div className="hud-input-group">
                <div className="hud-label-row">
                  <label>Altura (cm)</label>
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
                  <label>Muñeca</label>
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
                  <label>Tobillo</label>
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
              <Activity size={18} className="mr-2" /> ACTUALIZAR MEDIDAS
            </button>
          </div>

          <div className="card glass ieo-card mt-6">
            <div className="card-header">
              <h3>Índice de Estructura (IEO)</h3>
            </div>
            <div className="ieo-display">
              <div className="ieo-value-row">
                <span className="ieo-number">{ieo.value}</span>
                <span className="ieo-label">{ieo.label}</span>
              </div>
              {ieo.isAdvantage && (
                <div className="advantage-badge">
                  ✨ Ventaja Genética
                </div>
              )}

              <div className="ieo-reference-table">
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

              <p className="ieo-desc mt-4">
                Tu IEO indica la robustez de tu esqueleto. Una estructura más grande proporciona mayor palanca y superficie de anclaje muscular.
              </p>
            </div>
          </div>
        </div>

        <div className="card glass potential-analysis">
          <div className="analysis-header">
            <h3>Límite Genético Estimado</h3>
            <div className="info-tag">
              <Info size={14} /> 10% Grasa Corporal
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
                chest: 'Pecho',
                biceps: 'Bíceps',
                forearms: 'Antebrazos',
                neck: 'Cuello',
                thighs: 'Muslos',
                calves: 'Gemelos'
              };

              const current = currentMeasurements ? (currentMeasurements as any)[muscleKey] : null;
              const currentVal = (typeof current === 'object' && current !== null) ? (current.left + current.right) / 2 : current;
              const progress = currentVal ? (currentVal / parseFloat(value)) * 100 : 0;

              return (
                <div key={muscle} className="potential-item">
                  <div className="item-info">
                    <span className="muscle-name capitalize">{displayNames[muscle] || muscle}:</span>
                    <span className="potential-val">Máx {value} cm</span>
                  </div>
                  <div className="progress-bar-container">
                    <div className="progress-bar" style={{ width: `${Math.min(progress, 100)}%` }}></div>
                    <span className="progress-pct">{progress.toFixed(0)}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="info-card glass mt-4">
        <div className="flex gap-4">
          <Activity className="text-primary shrink-0" size={24} />
          <div>
            <h4>¿Qué significa esto?</h4>
            <p className="text-sm text-secondary">
              Estas medidas representan el límite natural teórico para tu estructura ósea.
              Mecánicamente, huesos más gruesos pueden soportar y anclar más masa muscular.
              Llegar al 90-95% de estos valores es una hazaña de años de entrenamiento constante.
            </p>
          </div>
        </div>
      </div>

      <style>{`
        .skeletal-frame-view {
          padding: 1.5rem;
          max-width: 1100px;
          margin: 0 auto;
        }
        .frame-grid {
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 2rem;
          margin-top: 2rem;
          align-items: start;
        }
        .card {
          border-radius: 16px;
          padding: 1.5rem;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .card-header h3 {
          font-size: 0.8rem;
          color: var(--primary-color);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          border-bottom: 2px solid rgba(245, 158, 11, 0.2);
          padding-bottom: 0.5rem;
          margin-bottom: 1.5rem;
        }
        .hud-column {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .hud-input-group {
          background: rgba(13, 13, 15, 0.4);
          border: 1px solid rgba(245, 158, 11, 0.1);
          border-left: 4px solid #f59e0b;
          padding: 0.75rem 1rem;
          border-radius: 4px 12px 12px 4px;
          transition: all 0.3s ease;
          backdrop-filter: blur(5px);
        }
        .hud-input-group:hover {
          background: rgba(245, 158, 11, 0.05);
          border-color: #f59e0b;
          box-shadow: 0 0 15px rgba(245, 158, 11, 0.2);
        }
        .hud-label-row label {
          font-size: 0.65rem;
          font-weight: bold;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .hud-input-group input {
          background: transparent;
          border: none;
          border-bottom: 2px solid rgba(255, 255, 255, 0.1);
          color: white;
          width: 100%;
          font-size: 1.2rem;
          font-weight: 700;
          padding: 4px 0;
          outline: none;
        }
        .hud-input-group input:focus {
          border-bottom-color: var(--primary-color);
        }
        .input-hint {
          font-size: 0.65rem;
          color: var(--text-secondary);
          opacity: 0.6;
          margin-top: 4px;
        }
        .analysis-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }
        .potential-list {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .potential-item {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .item-info {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
        }
        .muscle-name {
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-secondary);
        }
        .potential-val {
          font-family: 'Inter', sans-serif;
          font-size: 1rem;
          color: var(--primary-color);
          font-weight: 800;
        }
        .progress-bar-container {
          height: 10px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 5px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          position: relative;
          overflow: hidden;
        }
        .progress-bar {
          height: 100%;
          background: linear-gradient(90deg, #f59e0b, #fbbf24);
          box-shadow: 0 0 15px rgba(245, 158, 11, 0.4);
          transition: width 1.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .progress-pct {
          position: absolute;
          right: 8px;
          top: -14px;
          font-size: 0.65rem;
          font-weight: bold;
          color: var(--primary-color);
          opacity: 0.8;
        }
        .info-card {
          margin-top: 2rem;
          padding: 1.5rem;
          border-radius: 16px;
          border: 1px dashed rgba(245, 158, 11, 0.2);
          background: rgba(245, 158, 11, 0.02);
        }
        
        .ieo-display {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        .ieo-value-row {
          display: flex;
          align-items: baseline;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }
        .ieo-number {
          font-size: 2.5rem;
          font-weight: 800;
          color: #fff;
          text-shadow: 0 0 20px rgba(245, 158, 11, 0.3);
        }
        .ieo-label {
          font-size: 1rem;
          color: var(--primary-color);
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .advantage-badge {
          background: rgba(245, 158, 11, 0.15);
          color: #f59e0b;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: bold;
          border: 1px solid rgba(245, 158, 11, 0.3);
          margin-bottom: 1.5rem;
        }
        .ieo-desc {
          font-size: 0.75rem;
          color: var(--text-secondary);
          line-height: 1.4;
        }
        
        /* IEO Reference Table Styles */
        .ieo-reference-table {
          width: 100%;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
          padding: 0.5rem;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .ieo-ref-row {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 0.75rem;
          border-radius: 4px;
          font-size: 0.8rem;
          color: var(--text-secondary);
          margin-bottom: 2px;
        }
        .ieo-ref-row.active {
          background: rgba(245, 158, 11, 0.15);
          color: #fff;
          font-weight: bold;
          border: 1px solid rgba(245, 158, 11, 0.3);
        }
        .ref-range {
          font-family: monospace;
          opacity: 0.8;
        }
        .ref-check {
          margin-left: 0.5rem;
        }
        
        @media (max-width: 900px) {
          .frame-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};
