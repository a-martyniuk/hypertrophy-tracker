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

        {/* Clean Red Silhouette - Scaled and Repositioned */}
        <image
          href={silhouetteImg}
          x="-35"
          y="-15"
          width="270"
          height="590"
          className="silhouette-image"
          filter="url(#glow)"
          style={{ opacity: 0.95 }}
        />

        {/* RE-CALIBRATED Emergency Coordinates (Visual 1:1 Fix) */}
        <g className="hud-overlays">
          {/* Neck */}
          <rect id="band-neck" x="85" y="65" width="30" height="6" fill="#1a1a1a" />
          <rect id="junction-neck" x="100" y="61" width="5" height="5" fill="#f59e0b" />

          {/* Shoulders (Espalda) */}
          <rect id="band-back" x="25" y="105" width="150" height="8" fill="#1a1a1a" />
          <rect id="junction-back" x="25" y="106.5" width="5" height="5" fill="#f59e0b" />

          {/* Pecho (Chest) */}
          <rect id="band-pecho" x="45" y="145" width="110" height="8" fill="#1a1a1a" />
          <rect id="junction-pecho" x="145" y="146.5" width="5" height="5" fill="#f59e0b" />

          {/* Arms (Brazo/Bicep) */}
          <rect id="band-arm-right" x="165" y="185" width="22" height="7" fill="#1a1a1a" />
          <rect id="junction-arm-right" x="180" y="186" width="5" height="5" fill="#f59e0b" />
          <rect id="band-arm-left" x="13" y="185" width="22" height="7" fill="#1a1a1a" />
          <rect id="junction-arm-left" x="13" y="186" width="5" height="5" fill="#f59e0b" />

          {/* Waist (Cintura) */}
          <rect id="band-waist" x="62" y="235" width="76" height="8" fill="#1a1a1a" />
          <rect id="junction-waist" x="62" y="236.5" width="5" height="5" fill="#f59e0b" />

          {/* Forearms (Antebrazo) */}
          <rect id="band-forearm-right" x="168" y="260" width="18" height="6" fill="#1a1a1a" />
          <rect id="junction-forearm-right" x="180" y="260.5" width="5" height="5" fill="#f59e0b" />
          <rect id="band-forearm-left" x="14" y="260" width="18" height="6" fill="#1a1a1a" />
          <rect id="junction-forearm-left" x="14" y="260.5" width="5" height="5" fill="#f59e0b" />

          {/* Hips (Caderas) */}
          <rect id="band-hips" x="55" y="295" width="90" height="9" fill="#1a1a1a" />
          <rect id="junction-hips" x="140" y="297" width="5" height="5" fill="#f59e0b" />

          {/* Wrists (Muñeca) */}
          <rect id="band-wrist-right" x="170" y="325" width="14" height="5" fill="#1a1a1a" />
          <rect id="junction-wrist-right" x="175" y="325" width="5" height="5" fill="#f59e0b" />
          <rect id="band-wrist-left" x="16" y="325" width="14" height="5" fill="#1a1a1a" />
          <rect id="junction-wrist-left" x="20" y="325" width="5" height="5" fill="#f59e0b" />

          {/* Thighs (Muslo) */}
          <rect id="band-thigh-right" x="105" y="380" width="55" height="9" fill="#1a1a1a" />
          <rect id="junction-thigh-right" x="150" y="382" width="5" height="5" fill="#f59e0b" />
          <rect id="band-thigh-left" x="40" y="380" width="55" height="9" fill="#1a1a1a" />
          <rect id="junction-thigh-left" x="40" y="382" width="5" height="5" fill="#f59e0b" />

          {/* Calf (Pantorrillas) */}
          <rect id="band-calf-right" x="108" y="470" width="40" height="7" fill="#1a1a1a" />
          <rect id="junction-calf-right" x="140" y="471" width="5" height="5" fill="#f59e0b" />
          <rect id="band-calf-left" x="52" y="470" width="40" height="7" fill="#1a1a1a" />
          <rect id="junction-calf-left" x="52" y="471" width="5" height="5" fill="#f59e0b" />

          {/* Ankle (Tobillos) */}
          <rect id="band-ankle-right" x="106" y="525" width="25" height="5" fill="#1a1a1a" />
          <rect id="junction-ankle-right" x="123" y="525" width="5" height="5" fill="#f59e0b" />
          <rect id="band-ankle-left" x="69" y="525" width="25" height="5" fill="#1a1a1a" />
          <rect id="junction-ankle-left" x="69" y="525" width="5" height="5" fill="#f59e0b" />
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
