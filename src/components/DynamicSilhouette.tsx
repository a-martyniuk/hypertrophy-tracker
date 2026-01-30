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

        {/* Clean Red Silhouette - Scaled to fit 200x550 logic */}
        <image
          href={silhouetteImg}
          x="-15"
          y="10"
          width="230"
          height="530"
          className="silhouette-image"
          filter="url(#glow)"
          style={{ opacity: 0.95 }}
        />

        {/* RE-CALIBRATED Emergency Coordinates (Visual 1:1 Fix) */}
        <g className="hud-overlays">
          {/* Neck - Center higher */}
          <rect id="band-neck" x="88" y="75" width="24" height="6" fill="#1a1a1a" />
          <rect id="junction-neck" x="100" y="71" width="5" height="5" fill="#f59e0b" />

          {/* Shoulders (Espalda) - Wider, lower */}
          <rect id="band-back" x="35" y="115" width="130" height="8" fill="#1a1a1a" />
          <rect id="junction-back" x="35" y="116.5" width="5" height="5" fill="#f59e0b" />

          {/* Pecho (Chest) */}
          <rect id="band-pecho" x="50" y="155" width="100" height="8" fill="#1a1a1a" />
          <rect id="junction-pecho" x="140" y="156.5" width="5" height="5" fill="#f59e0b" />

          {/* Arms (Brazo/Bicep) - Fixed inward shift */}
          <rect id="band-arm-right" x="162" y="195" width="18" height="7" fill="#1a1a1a" />
          <rect id="junction-arm-right" x="175" y="196" width="5" height="5" fill="#f59e0b" />
          <rect id="band-arm-left" x="20" y="195" width="18" height="7" fill="#1a1a1a" />
          <rect id="junction-arm-left" x="20" y="196" width="5" height="5" fill="#f59e0b" />

          {/* Waist (Cintura) - Narrow section */}
          <rect id="band-waist" x="66" y="240" width="68" height="8" fill="#1a1a1a" />
          <rect id="junction-waist" x="66" y="241.5" width="5" height="5" fill="#f59e0b" />

          {/* Forearms (Antebrazo) */}
          <rect id="band-forearm-right" x="162" y="265" width="16" height="6" fill="#1a1a1a" />
          <rect id="junction-forearm-right" x="173" y="265.5" width="5" height="5" fill="#f59e0b" />
          <rect id="band-forearm-left" x="22" y="265" width="16" height="6" fill="#1a1a1a" />
          <rect id="junction-forearm-left" x="22" y="265.5" width="5" height="5" fill="#f59e0b" />

          {/* Hips (Caderas) */}
          <rect id="band-hips" x="60" y="295" width="80" height="9" fill="#1a1a1a" />
          <rect id="junction-hips" x="135" y="297" width="5" height="5" fill="#f59e0b" />

          {/* Wrists (Muñeca) */}
          <rect id="band-wrist-right" x="165" y="325" width="12" height="5" fill="#1a1a1a" />
          <rect id="junction-wrist-right" x="165" y="325" width="5" height="5" fill="#f59e0b" />
          <rect id="band-wrist-left" x="23" y="325" width="12" height="5" fill="#1a1a1a" />
          <rect id="junction-wrist-left" x="30" y="325" width="5" height="5" fill="#f59e0b" />

          {/* Thighs (Muslo) */}
          <rect id="band-thigh-right" x="102" y="380" width="45" height="9" fill="#1a1a1a" />
          <rect id="junction-thigh-right" x="142" y="382" width="5" height="5" fill="#f59e0b" />
          <rect id="band-thigh-left" x="53" y="380" width="45" height="9" fill="#1a1a1a" />
          <rect id="junction-thigh-left" x="53" y="382" width="5" height="5" fill="#f59e0b" />

          {/* Calf (Pantorrillas) */}
          <rect id="band-calf-right" x="108" y="470" width="32" height="7" fill="#1a1a1a" />
          <rect id="junction-calf-right" x="135" y="471" width="5" height="5" fill="#f59e0b" />
          <rect id="band-calf-left" x="60" y="470" width="32" height="7" fill="#1a1a1a" />
          <rect id="junction-calf-left" x="60" y="471" width="5" height="5" fill="#f59e0b" />

          {/* Ankle (Tobillos) */}
          <rect id="band-ankle-right" x="106" y="525" width="22" height="5" fill="#1a1a1a" />
          <rect id="junction-ankle-right" x="123" y="525" width="5" height="5" fill="#f59e0b" />
          <rect id="band-ankle-left" x="72" y="525" width="22" height="5" fill="#1a1a1a" />
          <rect id="junction-ankle-left" x="72" y="525" width="5" height="5" fill="#f59e0b" />
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
