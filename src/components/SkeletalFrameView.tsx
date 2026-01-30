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
          <h3>Mis Medidas Base (cm)</h3>
          <div className="form-group">
            <label>Muñeca</label>
            <input
              type="number"
              step="0.1"
              value={frame.wrist}
              onChange={e => setFrame({ ...frame, wrist: parseFloat(e.target.value) })}
            />
            <p className="input-hint">Mide justo encima del hueso de la muñeca.</p>
          </div>
          <div className="form-group">
            <label>Tobillo</label>
            <input
              type="number"
              step="0.1"
              value={frame.ankle}
              onChange={e => setFrame({ ...frame, ankle: parseFloat(e.target.value) })}
            />
            <p className="input-hint">Mide en la parte más estrecha sobre el hueso.</p>
          </div>
          <button className="btn-primary w-full mt-4" onClick={() => onSave(frame)}>
            Actualizar Medidas Base
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
          max-width: 1000px;
          margin: 0 auto;
        }
        .frame-grid {
          display: grid;
          grid-template-columns: 1fr 1.5fr;
          gap: 1.5rem;
          margin-top: 1.5rem;
        }
        .analysis-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        .info-tag {
          display: flex;
          align-items: center;
          gap: 4px;
          background: rgba(245, 158, 11, 0.1);
          color: var(--primary-color);
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 0.75rem;
          border: 1px solid rgba(245, 158, 11, 0.2);
        }
        .potential-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .potential-item {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .item-info {
          display: flex;
          justify-content: space-between;
          font-size: 0.9rem;
        }
        .muscle-name {
          color: var(--text-secondary);
        }
        .potential-val {
          color: var(--primary-color);
          font-weight: bold;
        }
        .progress-bar-container {
          height: 8px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .progress-bar {
          height: 100%;
          background: linear-gradient(90deg, var(--primary-color), #fbbf24);
          box-shadow: 0 0 10px var(--primary-glow);
          transition: width 1s ease-out;
        }
        .progress-pct {
          position: absolute;
          right: 5px;
          top: -12px;
          font-size: 0.6rem;
          color: var(--text-secondary);
        }
        .input-hint {
          font-size: 0.7rem;
          color: var(--text-secondary);
          margin-top: 4px;
        }
        @media (max-width: 768px) {
          .frame-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};
