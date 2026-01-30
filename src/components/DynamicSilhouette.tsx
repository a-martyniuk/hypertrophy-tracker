import type { BodyMeasurements } from '../types/measurements';
import silhouetteImg from '../assets/clean_red_silhouette.png';

interface Props {
  measurements: BodyMeasurements;
}

export const DynamicSilhouette = ({ measurements }: Props) => {
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

        {/* Invisible anchors for Precise Pass 6 Alignment */}
        <g className="hud-anchors">
          {/* Neck (Center) */}
          <rect id="junction-neck" x="78" y="86" width="4" height="4" fill="transparent" />

          {/* Shoulders (Left) */}
          <rect id="junction-back" x="27" y="122" width="4" height="4" fill="transparent" />

          {/* Pecho (Right) */}
          <rect id="junction-pecho" x="146" y="151" width="4" height="4" fill="transparent" />

          {/* Arms */}
          <rect id="junction-arm-left" x="20" y="171" width="4" height="4" fill="transparent" />
          <rect id="junction-arm-right" x="175" y="171" width="4" height="4" fill="transparent" />

          {/* Forearms */}
          <rect id="junction-forearm-left" x="10" y="211" width="4" height="4" fill="transparent" />
          <rect id="junction-forearm-right" x="184" y="211" width="4" height="4" fill="transparent" />

          {/* Waist (Center) */}
          <rect id="junction-waist" x="59" y="230" width="4" height="4" fill="transparent" />

          {/* Hips (Right-ish) */}
          <rect id="junction-hips" x="142" y="268" width="4" height="4" fill="transparent" />

          {/* Wrists */}
          <rect id="junction-wrist-left" x="3" y="257" width="4" height="4" fill="transparent" />
          <rect id="junction-wrist-right" x="193" y="257" width="4" height="4" fill="transparent" />

          {/* Thighs */}
          <rect id="junction-thigh-left" x="46" y="333" width="4" height="4" fill="transparent" />
          <rect id="junction-thigh-right" x="160" y="333" width="4" height="4" fill="transparent" />

          {/* Calf */}
          <rect id="junction-calf-left" x="57" y="431" width="4" height="4" fill="transparent" />
          <rect id="junction-calf-right" x="166" y="431" width="4" height="4" fill="transparent" />

          {/* Ankle */}
          <rect id="junction-ankle-left" x="64" y="491" width="4" height="4" fill="transparent" />
          <rect id="junction-ankle-right" x="165" y="491" width="4" height="4" fill="transparent" />
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
