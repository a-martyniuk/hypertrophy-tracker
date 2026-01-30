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

        {/* Clean Red Silhouette - Pass 3 Fixed Ratio (600x600) */}
        <image
          href={silhouetteImg}
          x="-200"
          y="-25"
          width="600"
          height="600"
          className="silhouette-image"
          filter="url(#glow)"
          style={{ opacity: 0.95 }}
        />

        {/* RE-CALIBRATED Emergency Coordinates (Pass 3 Stable Zoom) */}
        <g className="hud-overlays">
          {/* Neck */}
          <rect id="band-neck" x="80" y="50" width="40" height="8" fill="#1a1a1a" />
          <rect id="junction-neck" x="100" y="47" width="5" height="5" fill="#f59e0b" />

          {/* Shoulders (Espalda) */}
          <rect id="band-back" x="20" y="90" width="160" height="10" fill="#1a1a1a" />
          <rect id="junction-back" x="20" y="92" width="5" height="5" fill="#f59e0b" />

          {/* Pecho (Chest) */}
          <rect id="band-pecho" x="40" y="140" width="120" height="10" fill="#1a1a1a" />
          <rect id="junction-pecho" x="155" y="142" width="5" height="5" fill="#f59e0b" />

          {/* Arms (Brazo/Bicep) */}
          <rect id="band-arm-right" x="165" y="180" width="25" height="8" fill="#1a1a1a" />
          <rect id="junction-arm-right" x="185" y="180" width="5" height="5" fill="#f59e0b" />
          <rect id="band-arm-left" x="10" y="180" width="25" height="8" fill="#1a1a1a" />
          <rect id="junction-arm-left" x="10" y="180" width="5" height="5" fill="#f59e0b" />

          {/* Waist (Cintura) */}
          <rect id="band-waist" x="65" y="250" width="70" height="10" fill="#1a1a1a" />
          <rect id="junction-waist" x="65" y="252" width="5" height="5" fill="#f59e0b" />

          {/* Forearms (Antebrazo) */}
          <rect id="band-forearm-right" x="165" y="280" width="20" height="8" fill="#1a1a1a" />
          <rect id="junction-forearm-right" x="180" y="280" width="5" height="5" fill="#f59e0b" />
          <rect id="band-forearm-left" x="15" y="280" width="20" height="8" fill="#1a1a1a" />
          <rect id="junction-forearm-left" x="15" y="280" width="5" height="5" fill="#f59e0b" />

          {/* Hips (Caderas) */}
          <rect id="band-hips" x="55" y="320" width="90" height="11" fill="#1a1a1a" />
          <rect id="junction-hips" x="135" y="323" width="5" height="5" fill="#f59e0b" />

          {/* Wrists (Muñeca) */}
          <rect id="band-wrist-right" x="170" y="370" width="15" height="7" fill="#1a1a1a" />
          <rect id="junction-wrist-right" x="180" y="370" width="5" height="5" fill="#f59e0b" />
          <rect id="band-wrist-left" x="15" y="370" width="15" height="7" fill="#1a1a1a" />
          <rect id="junction-wrist-left" x="15" y="370" width="5" height="5" fill="#f59e0b" />

          {/* Thighs (Muslo) */}
          <rect id="band-thigh-right" x="105" y="430" width="55" height="11" fill="#1a1a1a" />
          <rect id="junction-thigh-right" x="155" y="433" width="5" height="5" fill="#f59e0b" />
          <rect id="band-thigh-left" x="40" y="430" width="55" height="11" fill="#1a1a1a" />
          <rect id="junction-thigh-left" x="40" y="433" width="55" height="5" fill="#f59e0b" />

          {/* Calf (Pantorrillas) */}
          <rect id="band-calf-right" x="108" y="500" width="40" height="9" fill="#1a1a1a" />
          <rect id="junction-calf-right" x="145" y="502" width="5" height="5" fill="#f59e0b" />
          <rect id="band-calf-left" x="52" y="500" width="40" height="9" fill="#1a1a1a" />
          <rect id="junction-calf-left" x="52" y="502" width="5" height="5" fill="#f59e0b" />

          {/* Ankle (Tobillos) */}
          <rect id="band-ankle-right" x="106" y="540" width="30" height="7" fill="#1a1a1a" />
          <rect id="junction-ankle-right" x="130" y="540" width="5" height="5" fill="#f59e0b" />
          <rect id="band-ankle-left" x="64" y="540" width="30" height="7" fill="#1a1a1a" />
          <rect id="junction-ankle-left" x="64" y="540" width="5" height="5" fill="#f59e0b" />
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
