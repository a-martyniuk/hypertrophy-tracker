import type { BodyMeasurements } from '../types/measurements';
import silhouetteImg from '../assets/clean_red_silhouette.png';

interface Props {
  measurements: BodyMeasurements;
}

export const DynamicSilhouette = ({ measurements }: Props) => {
  return (
    <div className="silhouette-container">
      <svg viewBox="0 0 200 550" className="body-svg animate-fade-in silhouette-svg" preserveAspectRatio="xMidYMid meet">
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

        {/* Invisible anchors for MeasurementForm connectors */}
        <g className="hud-overlays" style={{ opacity: 0 }}>
          {/* Neck */}
          <rect id="junction-neck" x="80" y="52" width="5" height="5" />

          {/* Shoulders */}
          <rect id="junction-back" x="28" y="80" width="5" height="5" />

          {/* Pecho */}
          <rect id="junction-pecho" x="142" y="112" width="5" height="5" />

          {/* Arms */}
          <rect id="junction-arm-right" x="172" y="152" width="5" height="5" />
          <rect id="junction-arm-left" x="22" y="152" width="5" height="5" />

          {/* Waist */}
          <rect id="junction-waist" x="60" y="210" width="5" height="5" />

          {/* Forearms */}
          <rect id="junction-forearm-right" x="180" y="255" width="5" height="5" />
          <rect id="junction-forearm-left" x="15" y="255" width="5" height="5" />

          {/* Hips */}
          <rect id="junction-hips" x="140" y="275" width="5" height="5" />

          {/* Wrists */}
          <rect id="junction-wrist-right" x="190" y="325" width="5" height="5" />
          <rect id="junction-wrist-left" x="5" y="325" width="5" height="5" />

          {/* Thighs */}
          <rect id="junction-thigh-right" x="158" y="395" width="5" height="5" />
          <rect id="junction-thigh-left" x="42" y="395" width="5" height="5" />

          {/* Calf */}
          <rect id="junction-calf-right" x="162" y="520" width="5" height="5" />
          <rect id="junction-calf-left" x="52" y="520" width="5" height="5" />

          {/* Ankle */}
          <rect id="junction-ankle-right" x="155" y="590" width="5" height="5" />
          <rect id="junction-ankle-left" x="65" y="590" width="5" height="5" />
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
          transition: var(--transition-smooth);
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
