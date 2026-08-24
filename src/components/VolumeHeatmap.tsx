import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { BodyMeasurements, BilateralMeasurement } from '../types/measurements';
import maleSilhouette from '../assets/clean_red_silhouette.png';
import femaleSilhouette from '../assets/silhouette_female.png';
import { Sparkles, ArrowRight } from 'lucide-react';
import './VolumeHeatmap.css';

interface Props {
  currentMeasurements?: BodyMeasurements;
  referenceMeasurements?: BodyMeasurements;
  sex?: 'male' | 'female';
  onMarkerClick?: (zone: string) => void;
}

// Helper to get number from bilateral or number
const getVal = (m: number | BilateralMeasurement | undefined, side?: 'left' | 'right'): number => {
  if (m === undefined) return 0;
  if (typeof m === 'number') return m;
  if (side && m[side] > 0) return m[side];
  return (m.left + m.right) / 2;
};

export const VolumeHeatmap: React.FC<Props> = ({
  currentMeasurements,
  referenceMeasurements,
  sex = 'male',
  onMarkerClick
}) => {
  const { t } = useTranslation();
  const [hoveredZone, setHoveredZone] = useState<any | null>(null);
  const [pinnedZone, setPinnedZone] = useState<any | null>(null);

  const silhouetteImg = sex === 'female' ? femaleSilhouette : maleSilhouette;

  // Growth status calculation
  const getGrowthStats = (current: number, reference: number) => {
    if (!current || !reference) {
      return {
        ratio: 1,
        pctChange: 0,
        delta: 0,
        color: '#f59e0b',
        glowColor: 'rgba(245, 158, 11, 0.2)',
        bgGlow: 'rgba(245, 158, 11, 0.08)',
        statusLabel: 'Medida Base',
        type: 'neutral'
      };
    }

    const delta = parseFloat((current - reference).toFixed(1));
    const pctChange = parseFloat((((current - reference) / reference) * 100).toFixed(1));

    if (pctChange > 2.5) {
      return {
        ratio: current / reference,
        pctChange,
        delta,
        color: '#10b981', // Neon Emerald
        glowColor: 'rgba(16, 185, 129, 0.65)',
        bgGlow: 'rgba(16, 185, 129, 0.25)',
        statusLabel: 'Hipertrofia Acelerada (>2.5%)',
        type: 'hypertrophy'
      };
    }
    if (pctChange >= 0.8) {
      return {
        ratio: current / reference,
        pctChange,
        delta,
        color: '#fbbf24', // Golden Amber
        glowColor: 'rgba(251, 191, 36, 0.55)',
        bgGlow: 'rgba(251, 191, 36, 0.2)',
        statusLabel: 'Crecimiento Óptimo (>1%)',
        type: 'growth'
      };
    }
    if (pctChange >= -0.8 && pctChange < 0.8) {
      return {
        ratio: current / reference,
        pctChange,
        delta,
        color: '#94a3b8', // Silver Neutral
        glowColor: 'rgba(148, 163, 184, 0.3)',
        bgGlow: 'rgba(148, 163, 184, 0.1)',
        statusLabel: 'Estable (±1%)',
        type: 'stable'
      };
    }
    return {
      ratio: current / reference,
      pctChange,
      delta,
      color: '#38bdf8', // Glacier Blue
      glowColor: 'rgba(56, 189, 248, 0.6)',
      bgGlow: 'rgba(56, 189, 248, 0.25)',
      statusLabel: 'Reducción (< -1%)',
      type: 'loss'
    };
  };

  // Anatomical zones & calibrated tape band coordinates (260x550 space)
  const zones = useMemo(() => {
    return [
      {
        id: 'neck',
        name: t('common.form.neck'),
        current: getVal(currentMeasurements?.neck),
        reference: getVal(referenceMeasurements?.neck),
        band: { x1: 104, x2: 156, y: 82 },
        polygon: "M 100,66 L 100,74 L 95,82 L 90,98 L 170,98 L 170,86 L 155,82 L 148,74 L 160,66 Z",
        chipPos: { side: 'left', y: 82 }
      },
      {
        id: 'pecho',
        name: t('common.form.chest'),
        current: getVal(currentMeasurements?.pecho),
        reference: getVal(referenceMeasurements?.pecho),
        band: { x1: 60, x2: 200, y: 148 },
        polygon: "M 65,98 L 65,154 L 195,154 L 195,98 Z",
        chipPos: { side: 'left', y: 148 }
      },
      {
        id: 'arm-left',
        name: `${t('common.form.arm')} (Izq)`,
        current: getVal(currentMeasurements?.arm, 'left'),
        reference: getVal(referenceMeasurements?.arm, 'left'),
        band: { x1: 48, x2: 80, y: 175 },
        polygon: "M 35,110 L 28,145 L 20,175 L 55,175 L 65,110 Z",
        chipPos: { side: 'left', y: 175 }
      },
      {
        id: 'arm-right',
        name: `${t('common.form.arm')} (Der)`,
        current: getVal(currentMeasurements?.arm, 'right'),
        reference: getVal(referenceMeasurements?.arm, 'right'),
        band: { x1: 180, x2: 212, y: 175 },
        polygon: "M 195,110 L 205,175 L 240,175 L 232,145 L 225,110 Z",
        chipPos: { side: 'right', y: 175 }
      },
      {
        id: 'forearm-left',
        name: `${t('common.form.forearm')} (Izq)`,
        current: getVal(currentMeasurements?.forearm, 'left'),
        reference: getVal(referenceMeasurements?.forearm, 'left'),
        band: { x1: 34, x2: 64, y: 212 },
        polygon: "M 20,175 L 10,212 L 40,212 L 55,175 Z",
        chipPos: { side: 'left', y: 212 }
      },
      {
        id: 'forearm-right',
        name: `${t('common.form.forearm')} (Der)`,
        current: getVal(currentMeasurements?.forearm, 'right'),
        reference: getVal(referenceMeasurements?.forearm, 'right'),
        band: { x1: 196, x2: 226, y: 212 },
        polygon: "M 205,175 L 220,212 L 250,212 L 240,175 Z",
        chipPos: { side: 'right', y: 212 }
      },
      {
        id: 'waist',
        name: t('common.form.waist'),
        current: getVal(currentMeasurements?.waist),
        reference: getVal(referenceMeasurements?.waist),
        band: { x1: 88, x2: 172, y: 240 },
        polygon: "M 78,154 L 78,240 L 182,240 L 182,154 Z",
        chipPos: { side: 'left', y: 240 }
      },
      {
        id: 'hips',
        name: t('common.form.hips'),
        current: getVal(currentMeasurements?.hips),
        reference: getVal(referenceMeasurements?.hips),
        band: { x1: 72, x2: 188, y: 280 },
        polygon: "M 74,240 L 68,285 L 192,285 L 186,240 Z",
        chipPos: { side: 'right', y: 280 }
      },
      {
        id: 'thigh-left',
        name: `${t('common.form.thigh')} (Izq)`,
        current: getVal(currentMeasurements?.thigh, 'left'),
        reference: getVal(referenceMeasurements?.thigh, 'left'),
        band: { x1: 74, x2: 120, y: 308 },
        polygon: "M 68,285 L 62,357 L 122,357 L 128,285 Z",
        chipPos: { side: 'left', y: 308 }
      },
      {
        id: 'thigh-right',
        name: `${t('common.form.thigh')} (Der)`,
        current: getVal(currentMeasurements?.thigh, 'right'),
        reference: getVal(referenceMeasurements?.thigh, 'right'),
        band: { x1: 140, x2: 186, y: 308 },
        polygon: "M 132,285 L 138,357 L 198,357 L 192,285 Z",
        chipPos: { side: 'right', y: 308 }
      },
      {
        id: 'calf-left',
        name: `${t('common.form.calf')} (Izq)`,
        current: getVal(currentMeasurements?.calf, 'left'),
        reference: getVal(referenceMeasurements?.calf, 'left'),
        band: { x1: 78, x2: 114, y: 415 },
        polygon: "M 62,357 L 72,467 L 110,467 L 122,357 Z",
        chipPos: { side: 'left', y: 415 }
      },
      {
        id: 'calf-right',
        name: `${t('common.form.calf')} (Der)`,
        current: getVal(currentMeasurements?.calf, 'right'),
        reference: getVal(referenceMeasurements?.calf, 'right'),
        band: { x1: 146, x2: 182, y: 415 },
        polygon: "M 138,357 L 150,467 L 188,467 L 198,357 Z",
        chipPos: { side: 'right', y: 415 }
      }
    ].map(z => ({
      ...z,
      stats: getGrowthStats(z.current, z.reference)
    }));
  }, [currentMeasurements, referenceMeasurements, sex, t]);

  const activeZone = pinnedZone || hoveredZone;

  return (
    <div className="volume-heatmap-root">
      <div className="volume-stage-wrapper">
        <svg
          viewBox="0 0 260 550"
          className="volume-hud-svg"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Glow filters for heatmap and neon calipers */}
            <filter id="hudHeatGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="hudTapeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="1.8" result="tapeBlur" />
              <feMerge>
                <feMergeNode in="tapeBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* 1. Base Dark Golden Anatomical Silhouette */}
          <image
            href={silhouetteImg}
            x="0"
            y="0"
            width="260"
            height="550"
            className="base-silhouette-image"
          />

          {/* 2. Anatomical Heatmap Layer (Glowing Contoured Muscle Groups) */}
          <g className="hud-muscle-heatmaps">
            {zones.map((zone) => {
              const isHovered = activeZone?.id === zone.id;
              return (
                <path
                  key={`heat-${zone.id}`}
                  d={zone.polygon}
                  fill={zone.stats.bgGlow}
                  stroke={isHovered ? zone.stats.color : 'transparent'}
                  strokeWidth={isHovered ? 2 : 0}
                  filter={isHovered ? 'url(#hudHeatGlow)' : undefined}
                  className="muscle-polygon-heat"
                  onMouseEnter={() => setHoveredZone(zone)}
                  onMouseLeave={() => setHoveredZone(null)}
                  onClick={() => {
                    setPinnedZone(zone);
                    onMarkerClick?.(zone.id);
                  }}
                  style={{ cursor: 'pointer' }}
                />
              );
            })}
          </g>

          {/* 3. Anthropometric Tape Bands (Cinta Métrica Calibrada con Resplandor Neón) */}
          <g className="hud-tape-bands">
            {zones.map((zone) => {
              const isHovered = activeZone?.id === zone.id;
              const { band, stats } = zone;
              return (
                <g
                  key={`band-${zone.id}`}
                  className={`hud-band-group ${isHovered ? 'hovered' : ''}`}
                  onMouseEnter={() => setHoveredZone(zone)}
                  onMouseLeave={() => setHoveredZone(null)}
                  onClick={() => {
                    setPinnedZone(zone);
                    onMarkerClick?.(zone.id);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Invisible Touch Hitbox */}
                  <line
                    x1={band.x1 - 15}
                    y1={band.y}
                    x2={band.x2 + 15}
                    y2={band.y}
                    stroke="transparent"
                    strokeWidth="24"
                  />
                  {/* Glowing Tape Band Line */}
                  <line
                    x1={band.x1}
                    y1={band.y}
                    x2={band.x2}
                    y2={band.y}
                    stroke={stats.color}
                    strokeWidth={isHovered ? '3.5' : '1.8'}
                    strokeDasharray={isHovered ? '5 2' : '4 2'}
                    filter="url(#hudTapeGlow)"
                    style={{ transition: 'all 0.25s ease' }}
                  />
                  {/* Left Caliper Tick */}
                  <line
                    x1={band.x1}
                    y1={band.y - (isHovered ? 5 : 3)}
                    x2={band.x1}
                    y2={band.y + (isHovered ? 5 : 3)}
                    stroke={stats.color}
                    strokeWidth={isHovered ? '2.5' : '1.5'}
                  />
                  {/* Right Caliper Tick */}
                  <line
                    x1={band.x2}
                    y1={band.y - (isHovered ? 5 : 3)}
                    x2={band.x2}
                    y2={band.y + (isHovered ? 5 : 3)}
                    stroke={stats.color}
                    strokeWidth={isHovered ? '2.5' : '1.5'}
                  />
                </g>
              );
            })}
          </g>
        </svg>

        {/* Floating Tactical Tooltip Popover */}
        {activeZone && (
          <div 
            className="hud-zone-tooltip glass animate-scale-up"
            onClick={() => onMarkerClick?.(activeZone.id)}
          >
            <div className="tooltip-top-row">
              <div className="tooltip-title">
                <Sparkles size={13} style={{ color: activeZone.stats.color }} />
                <span>{activeZone.name}</span>
              </div>
              <span
                className="tooltip-badge"
                style={{
                  color: activeZone.stats.color,
                  backgroundColor: activeZone.stats.bgGlow,
                  borderColor: `${activeZone.stats.color}50`
                }}
              >
                {activeZone.stats.statusLabel}
              </span>
            </div>

            <div className="tooltip-values-row">
              <div className="val-block">
                <span className="val-lbl">Actual</span>
                <span className="val-num">{activeZone.current > 0 ? `${activeZone.current} cm` : '--'}</span>
              </div>
              <div className="val-block">
                <span className="val-lbl">Anterior</span>
                <span className="val-num text-muted">{activeZone.reference > 0 ? `${activeZone.reference} cm` : '--'}</span>
              </div>
              <div className="val-block">
                <span className="val-lbl">Variación</span>
                <span 
                  className="val-delta"
                  style={{ color: activeZone.stats.color }}
                >
                  {activeZone.stats.delta > 0 ? `▲ +${activeZone.stats.delta}` : activeZone.stats.delta < 0 ? `▼ ${activeZone.stats.delta}` : '='} cm
                  <small style={{ fontSize: '0.65rem', marginLeft: '3px' }}>({activeZone.stats.pctChange > 0 ? `+${activeZone.stats.pctChange}` : activeZone.stats.pctChange}%)</small>
                </span>
              </div>
            </div>

            <div className="tooltip-action-hint">
              <span>Toca para ver auditoría y benchmark</span>
              <ArrowRight size={12} />
            </div>
          </div>
        )}
      </div>

      {/* Modern Heatmap Legend Strip */}
      <div className="heatmap-legend-strip glass">
        <div className="legend-chip">
          <span className="legend-dot" style={{ background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
          <span>Hipertrofia (&gt;+2.5%)</span>
        </div>
        <div className="legend-chip">
          <span className="legend-dot" style={{ background: '#fbbf24', boxShadow: '0 0 8px #fbbf24' }} />
          <span>Crecimiento (&gt;+1%)</span>
        </div>
        <div className="legend-chip">
          <span className="legend-dot" style={{ background: '#94a3b8' }} />
          <span>Estable (±1%)</span>
        </div>
        <div className="legend-chip">
          <span className="legend-dot" style={{ background: '#38bdf8', boxShadow: '0 0 8px #38bdf8' }} />
          <span>Reducción (&lt;-1%)</span>
        </div>
      </div>
    </div>
  );
};
