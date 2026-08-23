import type { BodyMeasurements } from '../types/measurements';
import maleSilhouette from '../assets/clean_red_silhouette.png';
import femaleSilhouette from '../assets/silhouette_female.png';

interface Props {
  measurements: BodyMeasurements;
  sex?: 'male' | 'female';
  onMarkerClick?: (markerId: string) => void;
}

export const DynamicSilhouette = ({ measurements, sex = 'male', onMarkerClick }: Props) => {
  const silhouetteImg = sex === 'female' ? femaleSilhouette : maleSilhouette;

  // Gender-aware anchor coordinates precisely aligned with the golden HUD silhouette
  const anchors = sex === 'female' ? {
    neck: { x: 80, y: 82 },
    back: { x: 42, y: 124 },
    pecho: { x: 130, y: 148 },
    armL: { x: 30, y: 172 },
    armR: { x: 170, y: 172 },
    waist: { x: 68, y: 218 },
    forearmL: { x: 20, y: 224 },
    forearmR: { x: 180, y: 224 },
    hips: { x: 134, y: 262 },
    wristL: { x: 12, y: 268 },
    wristR: { x: 188, y: 268 },
    thighL: { x: 70, y: 328 },
    thighR: { x: 130, y: 328 },
    calfL: { x: 70, y: 424 },
    calfR: { x: 130, y: 424 },
    ankleL: { x: 78, y: 490 },
    ankleR: { x: 122, y: 490 },
  } : {
    neck: { x: 82, y: 82 },
    back: { x: 40, y: 124 },
    pecho: { x: 132, y: 148 },
    armL: { x: 30, y: 172 },
    armR: { x: 170, y: 172 },
    forearmL: { x: 20, y: 224 },
    forearmR: { x: 180, y: 224 },
    waist: { x: 68, y: 218 },
    hips: { x: 134, y: 262 },
    wristL: { x: 12, y: 268 },
    wristR: { x: 188, y: 268 },
    thighL: { x: 70, y: 328 },
    thighR: { x: 130, y: 328 },
    calfL: { x: 70, y: 424 },
    calfR: { x: 130, y: 424 },
    ankleL: { x: 78, y: 490 },
    ankleR: { x: 122, y: 490 },
  };

  return (
    <div className="silhouette-container">
      <svg
        id="silhouette-svg-root"
        viewBox="0 0 200 600"
        className="body-svg animate-fade-in silhouette-svg"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* New 1:1 Silhouette with Integrated Markers */}
        <image
          href={silhouetteImg}
          x="0"
          y="0"
          width="200"
          height="550"
          className="silhouette-image"
          style={{ opacity: 0.95 }}
        />

        <g className="hud-interactive-markers">
          {Object.entries(anchors).map(([key, pos]) => {
            // Map keys to match junction IDs expected by MeasurementForm.tsx
            const junctionId = key
              .replace('armL', 'arm-left')
              .replace('armR', 'arm-right')
              .replace('forearmL', 'forearm-left')
              .replace('forearmR', 'forearm-right')
              .replace('wristL', 'wrist-left')
              .replace('wristR', 'wrist-right')
              .replace('thighL', 'thigh-left')
              .replace('thighR', 'thigh-right')
              .replace('calfL', 'calf-left')
              .replace('calfR', 'calf-right')
              .replace('ankleL', 'ankle-left')
              .replace('ankleR', 'ankle-right')
              .replace('pecho', 'pecho') // already matches
              .replace('neck', 'neck')   // already matches
              .replace('back', 'back')   // already matches
              .replace('waist', 'waist') // already matches
              .replace('hips', 'hips');   // already matches

            return (
              <rect
                key={key}
                id={`junction-${junctionId}`}
                x={pos.x - 2}
                y={pos.y - 2}
                width="4"
                height="4"
                className="hotspot"
                onClick={() => onMarkerClick?.(key)}
                filter="url(#glow)"
              >
                <title>{key.toUpperCase()}</title>
              </rect>
            );
          })}
        </g>
      </svg>

      <div className="asymmetry-alerts">
        {Math.abs(measurements.arm.left - measurements.arm.right) > 1 && (
          <div className="hud-badge warning">
            <span className="scanline"></span>
            <div className="hud-content">
              <span className="hud-label">ARM_ASYMMETRY</span>
              <span className="hud-value">{Math.abs(measurements.arm.left - measurements.arm.right).toFixed(1)}cm</span>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .silhouette-container {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        .silhouette-svg {
          filter: drop-shadow(0 0 10px rgba(226, 76, 75, 0.2));
          height: 100%;
          max-height: 550px;
        }
        .hotspot {
          fill: #f59e0b;
          fill-opacity: 0.3;
          stroke: #f59e0b;
          stroke-width: 0.5;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .hotspot:hover {
          fill-opacity: 0.8;
          r: 6;
          filter: drop-shadow(0 0 5px #f59e0b);
        }
        .asymmetry-alerts {
          position: absolute;
          bottom: 20px;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          width: 100%;
          align-items: center;
        }
        .hud-badge {
          position: relative;
          background: rgba(13, 13, 15, 0.8);
          border: 1px solid rgba(245, 158, 11, 0.3);
          padding: 4px 12px;
          font-family: 'Inter', sans-serif;
          min-width: 180px;
          border-left: 3px solid #f59e0b;
        }
        .hud-badge.warning {
          border-left-color: #f59e0b;
          background: rgba(245, 158, 11, 0.1);
        }
        .hud-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: relative;
        }
        .hud-label {
          font-size: 0.6rem;
          color: var(--text-secondary);
          letter-spacing: 1px;
        }
        .hud-value {
          font-size: 0.8rem;
          color: white;
          font-weight: bold;
        }
      `}</style>
    </div>
  );
};
