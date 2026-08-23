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

  // Gender-aware anchor coordinates precisely calibrated with physical muscle contact
  const anchors = sex === 'female' ? {
    neck: { x: 130, y: 85 },
    back: { x: 58, y: 125 },
    pecho: { x: 155, y: 148 },
    armL: { x: 48, y: 175 },
    armR: { x: 212, y: 175 },
    waist: { x: 96, y: 220 },
    forearmL: { x: 38, y: 228 },
    forearmR: { x: 222, y: 228 },
    hips: { x: 165, y: 260 },
    wristL: { x: 24, y: 275 },
    wristR: { x: 236, y: 275 },
    thighL: { x: 100, y: 310 },
    thighR: { x: 160, y: 310 },
    calfL: { x: 96, y: 405 },
    calfR: { x: 164, y: 405 },
    ankleL: { x: 108, y: 475 },
    ankleR: { x: 152, y: 475 },
  } : {
    neck: { x: 130, y: 85 },
    back: { x: 58, y: 125 },
    pecho: { x: 155, y: 148 },
    armL: { x: 48, y: 175 },
    armR: { x: 212, y: 175 },
    forearmL: { x: 38, y: 228 },
    forearmR: { x: 222, y: 228 },
    waist: { x: 96, y: 220 },
    hips: { x: 165, y: 260 },
    wristL: { x: 24, y: 275 },
    wristR: { x: 236, y: 275 },
    thighL: { x: 100, y: 310 },
    thighR: { x: 160, y: 310 },
    calfL: { x: 96, y: 405 },
    calfR: { x: 164, y: 405 },
    ankleL: { x: 108, y: 475 },
    ankleR: { x: 152, y: 475 },
  };

  // Anthropometric tape measure guideline bands (Bandas de colocación de cinta métrica)
  const tapeBands = [
    { id: 'neck', y: 85, x1: 114, x2: 146, label: 'CUELLO' },
    { id: 'pecho', y: 148, x1: 76, x2: 184, label: 'PECHO' },
    { id: 'armL', y: 175, x1: 34, x2: 62, label: 'BRAZO_IZQ' },
    { id: 'armR', y: 175, x1: 198, x2: 226, label: 'BRAZO_DER' },
    { id: 'waist', y: 220, x1: 92, x2: 168, label: 'CINTURA' },
    { id: 'forearmL', y: 228, x1: 26, x2: 50, label: 'ANTEBRAZO_IZQ' },
    { id: 'forearmR', y: 228, x1: 210, x2: 234, label: 'ANTEBRAZO_DER' },
    { id: 'hips', y: 260, x1: 82, x2: 178, label: 'CADERA' },
    { id: 'wristL', y: 275, x1: 16, x2: 32, label: 'MUÑECA_IZQ' },
    { id: 'wristR', y: 275, x1: 228, x2: 244, label: 'MUÑECA_DER' },
    { id: 'thighL', y: 310, x1: 76, x2: 124, label: 'MUSLO_IZQ' },
    { id: 'thighR', y: 310, x1: 136, x2: 184, label: 'MUSLO_DER' },
    { id: 'calfL', y: 405, x1: 74, x2: 118, label: 'GEMELO_IZQ' },
    { id: 'calfR', y: 405, x1: 142, x2: 186, label: 'GEMELO_DER' },
    { id: 'ankleL', y: 475, x1: 94, x2: 122, label: 'TOBILLO_IZQ' },
    { id: 'ankleR', y: 475, x1: 138, x2: 166, label: 'TOBILLO_DER' },
  ];

  return (
    <div className="silhouette-container">
      <svg
        id="silhouette-svg-root"
        viewBox="0 0 260 550"
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
          <filter id="tapeGlow">
            <feGaussianBlur stdDeviation="1" result="tapeBlur" />
            <feMerge>
              <feMergeNode in="tapeBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Anatomical Silhouette Graphic */}
        <image
          href={silhouetteImg}
          x="0"
          y="0"
          width="260"
          height="550"
          className="silhouette-image"
          style={{ opacity: 0.95 }}
        />

        {/* Anthropometric Tape Measure Guidelines (Bandas Flotantes de Cinta Métrica) */}
        <g className="hud-tape-bands">
          {tapeBands.map((band) => (
            <g key={band.id} className="tape-band-group">
              {/* Dashed Golden Tape Line */}
              <line
                x1={band.x1}
                y1={band.y}
                x2={band.x2}
                y2={band.y}
                className="tape-line"
                filter="url(#tapeGlow)"
              />
              {/* Left End Caliper Tick */}
              <line
                x1={band.x1}
                y1={band.y - 3}
                x2={band.x1}
                y2={band.y + 3}
                className="tape-tick"
              />
              {/* Right End Caliper Tick */}
              <line
                x1={band.x2}
                y1={band.y - 3}
                x2={band.x2}
                y2={band.y + 3}
                className="tape-tick"
              />
            </g>
          ))}
        </g>

        {/* Interactive Junction Markers */}
        <g className="hud-interactive-markers">
          {Object.entries(anchors).map(([key, pos]) => {
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
              .replace('pecho', 'pecho')
              .replace('neck', 'neck')
              .replace('back', 'back')
              .replace('waist', 'waist')
              .replace('hips', 'hips');

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
          filter: drop-shadow(0 0 15px rgba(245, 158, 11, 0.15));
          height: 100%;
          max-height: 550px;
        }
        .tape-line {
          stroke: #f59e0b;
          stroke-width: 1.5px;
          stroke-dasharray: 4 2;
          stroke-linecap: round;
          opacity: 0.75;
          transition: all 0.3s ease;
        }
        .tape-tick {
          stroke: #fbbf24;
          stroke-width: 1.5px;
          opacity: 0.9;
        }
        .tape-band-group:hover .tape-line {
          stroke: #ffffff;
          opacity: 1;
          stroke-width: 2px;
          filter: drop-shadow(0 0 6px #f59e0b);
        }
        .hotspot {
          fill: #f59e0b;
          fill-opacity: 0.4;
          stroke: #f59e0b;
          stroke-width: 0.5;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .hotspot:hover {
          fill-opacity: 0.9;
          r: 6;
          filter: drop-shadow(0 0 8px #f59e0b);
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
          background: rgba(13, 13, 15, 0.85);
          border: 1px solid rgba(245, 158, 11, 0.3);
          padding: 4px 12px;
          font-family: 'Inter', sans-serif;
          min-width: 180px;
          border-left: 3px solid #f59e0b;
          border-radius: 6px;
        }
        .hud-badge.warning {
          border-left-color: #f59e0b;
          background: rgba(245, 158, 11, 0.12);
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
