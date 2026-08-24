import type { BodyMeasurements } from '../types/measurements';
import maleSilhouette from '../assets/clean_red_silhouette.png';
import femaleSilhouette from '../assets/silhouette_female.png';

interface Props {
  measurements: BodyMeasurements;
  sex?: 'male' | 'female';
  activeMuscle?: string | null;
  onMarkerClick?: (markerId: string) => void;
}

export const DynamicSilhouette = ({
  measurements,
  sex = 'male',
  activeMuscle,
  onMarkerClick
}: Props) => {
  const silhouetteImg = sex === 'female' ? femaleSilhouette : maleSilhouette;

  // Exact anatomical anchors calibrated directly against pixel contour data
  const anchors = sex === 'female' ? {
    neck: { x: 130, y: 82 },
    back: { x: 60, y: 125 },
    pecho: { x: 150, y: 148 },
    armL: { x: 67, y: 175 },
    armR: { x: 191, y: 175 },
    waist: { x: 130, y: 240 },
    forearmL: { x: 49, y: 212 },
    forearmR: { x: 211, y: 212 },
    hips: { x: 150, y: 280 },
    wristL: { x: 33, y: 252 },
    wristR: { x: 227, y: 252 },
    thighL: { x: 98, y: 335 },
    thighR: { x: 162, y: 335 },
    calfL: { x: 96, y: 415 },
    calfR: { x: 164, y: 415 },
    ankleL: { x: 100, y: 485 },
    ankleR: { x: 160, y: 485 },
  } : {
    neck: { x: 130, y: 82 },
    back: { x: 60, y: 125 },
    pecho: { x: 150, y: 148 },
    armL: { x: 67, y: 175 },
    armR: { x: 191, y: 175 },
    forearmL: { x: 49, y: 212 },
    forearmR: { x: 211, y: 212 },
    waist: { x: 130, y: 240 },
    hips: { x: 150, y: 280 },
    wristL: { x: 33, y: 252 },
    wristR: { x: 227, y: 252 },
    thighL: { x: 98, y: 335 },
    thighR: { x: 162, y: 335 },
    calfL: { x: 96, y: 415 },
    calfR: { x: 164, y: 415 },
    ankleL: { x: 100, y: 485 },
    ankleR: { x: 160, y: 485 },
  };

  // Anthropometric tape measure guideline bands perfectly bounded by body silhouette edges
  const tapeBands = [
    { id: 'neck', y: 82, x1: 110, x2: 150, muscle: 'neck' },
    { id: 'back', y: 125, x1: 51, x2: 208, muscle: 'back' },
    { id: 'pecho', y: 148, x1: 76, x2: 184, muscle: 'pecho' },
    { id: 'armL', y: 175, x1: 42, x2: 92, muscle: 'arm' },
    { id: 'armR', y: 175, x1: 166, x2: 216, muscle: 'arm' },
    { id: 'waist', y: 240, x1: 98, x2: 162, muscle: 'waist' },
    { id: 'forearmL', y: 212, x1: 29, x2: 69, muscle: 'forearm' },
    { id: 'forearmR', y: 212, x1: 191, x2: 231, muscle: 'forearm' },
    { id: 'hips', y: 280, x1: 84, x2: 176, muscle: 'hips' },
    { id: 'wristL', y: 252, x1: 18, x2: 48, muscle: 'wrist' },
    { id: 'wristR', y: 252, x1: 212, x2: 242, muscle: 'wrist' },
    { id: 'thighL', y: 335, x1: 74, x2: 122, muscle: 'thigh' },
    { id: 'thighR', y: 335, x1: 138, x2: 186, muscle: 'thigh' },
    { id: 'calfL', y: 415, x1: 72, x2: 120, muscle: 'calf' },
    { id: 'calfR', y: 415, x1: 140, x2: 188, muscle: 'calf' },
    { id: 'ankleL', y: 485, x1: 84, x2: 116, muscle: 'ankle' },
    { id: 'ankleR', y: 485, x1: 144, x2: 176, muscle: 'ankle' },
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
          <filter id="activeTapeGlow">
            <feGaussianBlur stdDeviation="2.5" result="activeGlow" />
            <feMerge>
              <feMergeNode in="activeGlow" />
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
          {tapeBands.map((band) => {
            const isActive = activeMuscle === band.muscle;
            return (
              <g key={band.id} className={`tape-band-group ${isActive ? 'active' : ''}`}>
                {/* Dashed Tape Guideline */}
                <line
                  x1={band.x1}
                  y1={band.y}
                  x2={band.x2}
                  y2={band.y}
                  className={`tape-line ${isActive ? 'active' : ''}`}
                  stroke={isActive ? '#38bdf8' : '#f59e0b'}
                  strokeWidth={isActive ? '2.5' : '1.5'}
                  strokeDasharray={isActive ? '5 2' : '4 2'}
                  filter={isActive ? 'url(#activeTapeGlow)' : 'url(#tapeGlow)'}
                />
                {/* Left End Caliper Tick */}
                <line
                  x1={band.x1}
                  y1={band.y - (isActive ? 4 : 3)}
                  x2={band.x1}
                  y2={band.y + (isActive ? 4 : 3)}
                  className={`tape-tick ${isActive ? 'active' : ''}`}
                  stroke={isActive ? '#38bdf8' : '#fbbf24'}
                  strokeWidth={isActive ? '2' : '1.5'}
                />
                {/* Right End Caliper Tick */}
                <line
                  x1={band.x2}
                  y1={band.y - (isActive ? 4 : 3)}
                  x2={band.x2}
                  y2={band.y + (isActive ? 4 : 3)}
                  className={`tape-tick ${isActive ? 'active' : ''}`}
                  stroke={isActive ? '#38bdf8' : '#fbbf24'}
                  strokeWidth={isActive ? '2' : '1.5'}
                />
              </g>
            );
          })}
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

            const baseKey = key.replace(/[LR]$/, '');
            const isActive = activeMuscle && (activeMuscle === baseKey || (baseKey === 'arm' && activeMuscle === 'arm') || (baseKey === 'forearm' && activeMuscle === 'forearm') || (baseKey === 'wrist' && activeMuscle === 'wrist') || (baseKey === 'thigh' && activeMuscle === 'thigh') || (baseKey === 'calf' && activeMuscle === 'calf') || (baseKey === 'ankle' && activeMuscle === 'ankle'));

            return (
              <rect
                key={key}
                id={`junction-${junctionId}`}
                x={pos.x - (isActive ? 3 : 2)}
                y={pos.y - (isActive ? 3 : 2)}
                width={isActive ? 6 : 4}
                height={isActive ? 6 : 4}
                className={`hotspot ${isActive ? 'active' : ''}`}
                fill={isActive ? '#38bdf8' : '#f59e0b'}
                stroke={isActive ? '#ffffff' : '#f59e0b'}
                strokeWidth={isActive ? 1 : 0.5}
                onClick={() => onMarkerClick?.(key)}
                filter={isActive ? 'url(#activeTapeGlow)' : 'url(#glow)'}
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
          stroke-linecap: round;
          opacity: 0.75;
          transition: all 0.25s ease;
        }
        .tape-line.active {
          opacity: 1;
          filter: drop-shadow(0 0 8px #38bdf8);
        }
        .tape-tick {
          transition: all 0.25s ease;
        }
        .tape-tick.active {
          opacity: 1;
          filter: drop-shadow(0 0 6px #38bdf8);
        }
        .tape-band-group:hover .tape-line {
          stroke: #38bdf8;
          opacity: 1;
          stroke-width: 2.2px;
          filter: drop-shadow(0 0 8px #38bdf8);
        }
        .hotspot {
          fill-opacity: 0.5;
          cursor: pointer;
          transition: all 0.25s ease;
        }
        .hotspot.active {
          fill-opacity: 1;
          filter: drop-shadow(0 0 10px #38bdf8);
        }
        .hotspot:hover {
          fill-opacity: 0.9;
          filter: drop-shadow(0 0 8px #38bdf8);
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
