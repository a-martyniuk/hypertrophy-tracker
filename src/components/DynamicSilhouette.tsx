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
  // Model is facing front (anterior view):
  // Screen Left (x < 130) = Athlete's Right (R / Tu lado derecho)
  // Screen Right (x > 130) = Athlete's Left (L / Tu lado izquierdo)
  const anchors = sex === 'female' ? {
    neck: { x: 130, y: 82 },
    back: { x: 60, y: 125 },
    pecho: { x: 150, y: 148 },
    armR: { x: 64, y: 175 },     // Brazo Derecho (Screen Left)
    armL: { x: 196, y: 175 },    // Brazo Izquierdo (Screen Right)
    waist: { x: 130, y: 240 },
    forearmR: { x: 49, y: 212 }, // Antebrazo Derecho (Screen Left)
    forearmL: { x: 211, y: 212 },// Antebrazo Izquierdo (Screen Right)
    hips: { x: 150, y: 280 },
    wristR: { x: 33, y: 252 },   // Muñeca Derecha (Screen Left)
    wristL: { x: 227, y: 252 },  // Muñeca Izquierda (Screen Right)
    thighR: { x: 97, y: 308 },   // Muslo Derecho (Screen Left)
    thighL: { x: 163, y: 308 },  // Muslo Izquierdo (Screen Right)
    calfR: { x: 96, y: 415 },    // Gemelo Derecho (Screen Left)
    calfL: { x: 164, y: 415 },   // Gemelo Izquierdo (Screen Right)
    ankleR: { x: 100, y: 485 },  // Tobillo Derecho (Screen Left)
    ankleL: { x: 160, y: 485 },  // Tobillo Izquierdo (Screen Right)
  } : {
    neck: { x: 130, y: 82 },
    back: { x: 60, y: 125 },
    pecho: { x: 150, y: 148 },
    armR: { x: 64, y: 175 },     // Brazo Derecho (Screen Left)
    armL: { x: 196, y: 175 },    // Brazo Izquierdo (Screen Right)
    forearmR: { x: 49, y: 212 }, // Antebrazo Derecho (Screen Left)
    forearmL: { x: 211, y: 212 },// Antebrazo Izquierdo (Screen Right)
    waist: { x: 130, y: 240 },
    hips: { x: 150, y: 280 },
    wristR: { x: 33, y: 252 },   // Muñeca Derecha (Screen Left)
    wristL: { x: 227, y: 252 },  // Muñeca Izquierda (Screen Right)
    thighR: { x: 97, y: 308 },   // Muslo Derecho (Screen Left)
    thighL: { x: 163, y: 308 },  // Muslo Izquierdo (Screen Right)
    calfR: { x: 96, y: 415 },    // Gemelo Derecho (Screen Left)
    calfL: { x: 164, y: 415 },   // Gemelo Izquierdo (Screen Right)
    ankleR: { x: 100, y: 485 },  // Tobillo Derecho (Screen Left)
    ankleL: { x: 160, y: 485 },  // Tobillo Izquierdo (Screen Right)
  };

  // Anthropometric tape measure guideline bands perfectly bounded by body silhouette edges
  const tapeBands = [
    { id: 'neck', y: 82, x1: 110, x2: 150, muscle: 'neck' },
    { id: 'back', y: 125, x1: 51, x2: 208, muscle: 'back' },
    { id: 'pecho', y: 148, x1: 76, x2: 184, muscle: 'pecho' },
    { id: 'armR', y: 175, x1: 48, x2: 80, muscle: 'arm' },
    { id: 'armL', y: 175, x1: 180, x2: 212, muscle: 'arm' },
    { id: 'waist', y: 240, x1: 88, x2: 172, muscle: 'waist' },
    { id: 'forearmR', y: 212, x1: 29, x2: 69, muscle: 'forearm' },
    { id: 'forearmL', y: 212, x1: 191, x2: 231, muscle: 'forearm' },
    { id: 'hips', y: 280, x1: 84, x2: 176, muscle: 'hips' },
    { id: 'wristR', y: 252, x1: 18, x2: 48, muscle: 'wrist' },
    { id: 'wristL', y: 252, x1: 212, x2: 242, muscle: 'wrist' },
    { id: 'thighR', y: 308, x1: 70, x2: 124, muscle: 'thigh' },
    { id: 'thighL', y: 308, x1: 136, x2: 190, muscle: 'thigh' },
    { id: 'calfR', y: 415, x1: 72, x2: 120, muscle: 'calf' },
    { id: 'calfL', y: 415, x1: 140, x2: 188, muscle: 'calf' },
    { id: 'ankleR', y: 485, x1: 84, x2: 116, muscle: 'ankle' },
    { id: 'ankleL', y: 485, x1: 144, x2: 176, muscle: 'ankle' },
  ];

  return (
    <div className="silhouette-container">
      <svg
        id="silhouette-svg-root"
        viewBox="0 0 260 572"
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

        {/* Anatomical Orientation HUD Overlay */}
        <g className="hud-orientation-labels" style={{ pointerEvents: 'none', userSelect: 'none' }}>
          {/* Top View Mode: Positioned completely above the silhouette head */}
          <rect x="55" y="-20" width="150" height="18" rx="4" fill="rgba(15, 23, 42, 0.9)" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="0.75" />
          <text x="130" y="-7.5" textAnchor="middle" fill="#94a3b8" fontSize="7.5" fontFamily="var(--font-mono)" fontWeight="700" letterSpacing="0.08em">
            VISTA ANTERIOR (DE FRENTE)
          </text>

          {/* Left Side of Drawing (Athlete's Right Arm) */}
          <rect x="6" y="8" width="58" height="24" rx="4" fill="rgba(245, 158, 11, 0.15)" stroke="rgba(245, 158, 11, 0.4)" strokeWidth="0.75" />
          <text x="35" y="19" textAnchor="middle" fill="#fbbf24" fontSize="8" fontFamily="var(--font-mono)" fontWeight="800">
            DER (R)
          </text>
          <text x="35" y="27.5" textAnchor="middle" fill="rgba(255, 255, 255, 0.7)" fontSize="5.8" fontFamily="var(--font-mono)">
            TU DERECHA
          </text>

          {/* Right Side of Drawing (Athlete's Left Arm) */}
          <rect x="196" y="8" width="58" height="24" rx="4" fill="rgba(56, 189, 248, 0.15)" stroke="rgba(56, 189, 248, 0.4)" strokeWidth="0.75" />
          <text x="225" y="19" textAnchor="middle" fill="#38bdf8" fontSize="8" fontFamily="var(--font-mono)" fontWeight="800">
            IZQ (L)
          </text>
          <text x="225" y="27.5" textAnchor="middle" fill="rgba(255, 255, 255, 0.7)" fontSize="5.8" fontFamily="var(--font-mono)">
            TU IZQUIERDA
          </text>

          {/* Bottom Perspective Footer */}
          <text x="130" y="542" textAnchor="middle" fill="rgba(245, 158, 11, 0.65)" fontSize="6.5" fontFamily="var(--font-mono)" fontWeight="700" letterSpacing="0.06em">
            PERSPECTIVA ANATÓMICA DEL ATLETA
          </text>
        </g>

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
              <g 
                key={band.id} 
                className={`tape-band-group ${isActive ? 'active' : ''}`}
                onClick={() => onMarkerClick?.(band.muscle)}
                style={{ cursor: 'pointer' }}
              >
                {/* Invisible large touch target for mobile fingertips */}
                <line
                  x1={band.x1 - 15}
                  y1={band.y}
                  x2={band.x2 + 15}
                  y2={band.y}
                  stroke="transparent"
                  strokeWidth="20"
                />
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
              .replace('armR', 'arm-right')
              .replace('armL', 'arm-left')
              .replace('forearmR', 'forearm-right')
              .replace('forearmL', 'forearm-left')
              .replace('wristR', 'wrist-right')
              .replace('wristL', 'wrist-left')
              .replace('thighR', 'thigh-right')
              .replace('thighL', 'thigh-left')
              .replace('calfR', 'calf-right')
              .replace('calfL', 'calf-left')
              .replace('ankleR', 'ankle-right')
              .replace('ankleL', 'ankle-left')
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
