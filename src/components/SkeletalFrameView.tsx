import { useState } from 'react';
import { Target, Info, Activity } from 'lucide-react';
import type { BodyMeasurements, SkeletalFrame } from '../types/measurements';

interface Props {
  baseline?: SkeletalFrame;
  currentMeasurements?: BodyMeasurements;
  onSave: (baseline: SkeletalFrame) => void;
}

export const SkeletalFrameView = ({ baseline, currentMeasurements, onSave }: Props) => {
  const [frame, setFrame] = useState<SkeletalFrame>(baseline || {
    wrist: 17,
    ankle: 22,
    knee: 38
  });

  const calculatePotential = () => {
    const { wrist, ankle } = frame;
    // Casey Butt Formulas for maximum girths at ~10% body fat
    return {
      chest: (1.6817 * wrist + 0.5759 * ankle + 12.6422).toFixed(1),
      biceps: (1.2033 * wrist + 0.1230 * ankle + 6.07).toFixed(1),
      forearms: (0.9626 * wrist + 0.0833 * ankle + 5.34).toFixed(1),
      neck: (1.1424 * wrist + 0.3177 * ankle + 14.86).toFixed(1),
      thighs: (1.3868 * ankle + 0.3105 * wrist + 15.12).toFixed(1),
      calves: (0.9298 * ankle + 0.1210 * wrist + 12.58).toFixed(1),
    };
  };

  const potential = calculatePotential();

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
        <div className="card glass baseline-input">
          <div className="card-header">
            <h3>Mis Medidas Base (cm)</h3>
          </div>
          <div className="hud-column">
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
        @media (max-width: 900px) {
          .frame-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};
