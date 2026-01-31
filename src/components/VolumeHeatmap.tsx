import { useMemo } from 'react';
import type { BodyMeasurements, BilateralMeasurement } from '../types/measurements';
import maleVolume from '../assets/silhouette_volume_male.png';
import femaleVolume from '../assets/silhouette_volume_female.png';

interface Props {
    currentMeasurements?: BodyMeasurements;
    referenceMeasurements?: BodyMeasurements;
    sex?: 'male' | 'female';
    onMarkerClick?: (zone: string) => void;
}

// Helper to get value from bilateral or number
const getVal = (m: number | BilateralMeasurement | undefined, side?: 'left' | 'right'): number => {
    if (m === undefined) return 0;
    if (typeof m === 'number') return m;
    if (side && m[side] > 0) return m[side];
    return (m.left + m.right) / 2;
};

// Color Logic
const getZoneColor = (current: number, reference: number) => {
    if (!current || !reference) return 'transparent';

    const ratio = current / reference;

    if (ratio < 0.97) return 'rgba(59, 130, 246, 0.6)'; // Blue (Loss)
    if (ratio >= 0.97 && ratio <= 1.03) return 'rgba(107, 114, 128, 0.4)'; // Gray (Stable)
    if (ratio > 1.03 && ratio <= 1.08) return 'rgba(234, 179, 8, 0.5)'; // Yellow (Moderate Growth)
    return 'rgba(239, 68, 68, 0.5)'; // Red (Significant Growth)
};

export const VolumeHeatmap = ({ currentMeasurements, referenceMeasurements, sex = 'male', onMarkerClick }: Props) => {
    const silhouetteImg = sex === 'female' ? femaleVolume : maleVolume;

    // Polygon Paths (Normalized for 200x600 viewbox)
    // Adjusted for standard anatomical positions on a vertical silhouette
    const zones = useMemo(() => {
        // These paths are approximations. 
        // In a real production app, we would trace the exact SVG paths over the specific images.
        // Here we define polygons that roughly cover the muscle groups.

        // Joint logic for female/male differentiation if positions differ significantly
        // For V1 we use a generic set that fits "standard" silhouettes fairly well
        const isFemale = sex === 'female';

        return [
            {
                id: 'pecho',
                label: 'Pecho',
                path: isFemale
                    ? "M 70,130 C 70,130 100,165 130,130 L 130,155 C 115,170 85,170 70,155 Z" // Female bust approximate
                    : "M 65,125 L 135,125 L 130,160 L 70,160 Z", // Male Pecs
                value: getVal(currentMeasurements?.pecho),
                ref: getVal(referenceMeasurements?.pecho)
            },
            {
                id: 'waist',
                label: 'Abdomen', // Mapping Waist to abdomen area
                path: "M 75,165 L 125,165 L 120,210 L 80,210 Z",
                value: getVal(currentMeasurements?.waist),
                ref: getVal(referenceMeasurements?.waist)
            },
            {
                id: 'hips', // Glutes/Hips
                label: 'Cadera',
                path: "M 60,215 L 140,215 L 145,250 L 55,250 Z",
                value: getVal(currentMeasurements?.hips),
                ref: getVal(referenceMeasurements?.hips)
            },
            // Arms (Biceps/Triceps)
            {
                id: 'arm-left',
                label: 'Bíceps Izq',
                side: 'left',
                path: "M 25,135 L 55,145 L 45,190 L 15,180 Z",
                value: getVal(currentMeasurements?.arm, 'left'),
                ref: getVal(referenceMeasurements?.arm, 'left')
            },
            {
                id: 'arm-right',
                label: 'Bíceps Der',
                side: 'right',
                path: "M 145,145 L 175,135 L 185,180 L 155,190 Z",
                value: getVal(currentMeasurements?.arm, 'right'),
                ref: getVal(referenceMeasurements?.arm, 'right')
            },
            // Forearms
            {
                id: 'forearm-left',
                label: 'Antebrazo Izq',
                side: 'left',
                path: "M 15,185 L 45,195 L 35,240 L 5,230 Z",
                value: getVal(currentMeasurements?.forearm, 'left'),
                ref: getVal(referenceMeasurements?.forearm, 'left')
            },
            {
                id: 'forearm-right',
                label: 'Antebrazo Der',
                side: 'right',
                path: "M 155,195 L 185,185 L 195,230 L 165,240 Z",
                value: getVal(currentMeasurements?.forearm, 'right'),
                ref: getVal(referenceMeasurements?.forearm, 'right')
            },
            // Thighs
            {
                id: 'thigh-left',
                label: 'Muslo Izq',
                side: 'left',
                path: "M 55,255 L 95,255 L 90,360 L 50,350 Z",
                value: getVal(currentMeasurements?.thigh, 'left'),
                ref: getVal(referenceMeasurements?.thigh, 'left')
            },
            {
                id: 'thigh-right',
                label: 'Muslo Der',
                side: 'right',
                path: "M 105,255 L 145,255 L 150,350 L 110,360 Z",
                value: getVal(currentMeasurements?.thigh, 'right'),
                ref: getVal(referenceMeasurements?.thigh, 'right')
            },
            // Calves
            {
                id: 'calf-left',
                label: 'Gemelo Izq',
                side: 'left',
                path: "M 50,380 L 90,380 L 85,460 L 55,460 Z",
                value: getVal(currentMeasurements?.calf, 'left'),
                ref: getVal(referenceMeasurements?.calf, 'left')
            },
            {
                id: 'calf-right',
                label: 'Gemelo Der',
                side: 'right',
                path: "M 110,380 L 150,380 L 145,460 L 115,460 Z",
                value: getVal(currentMeasurements?.calf, 'right'),
                ref: getVal(referenceMeasurements?.calf, 'right')
            },
        ];
    }, [currentMeasurements, referenceMeasurements, sex]);

    return (
        <div className="volume-heatmap-container">
            <svg
                viewBox="0 0 200 600"
                className="volume-svg animate-fade-in"
                preserveAspectRatio="xMidYMid meet"
            >
                <defs>
                    <filter id="grayscale">
                        <feColorMatrix type="matrix" values="0.3333 0.3333 0.3333 0 0 0.3333 0.3333 0.3333 0 0 0.3333 0.3333 0.3333 0 0 0 0 0 1 0" />
                    </filter>
                </defs>

                {/* Base Silhouette (Grayscale for better contrast with heatmap) */}
                <image
                    href={silhouetteImg}
                    x="0"
                    y="0"
                    width="200"
                    height="550"
                    style={{
                        opacity: 0.8,
                        filter: 'url(#grayscale)'
                    }}
                />

                {/* Heatmap Layer */}
                <g className="heatmap-overlays" style={{ mixBlendMode: 'multiply' }}>
                    {zones.map((zone) => {
                        const color = getZoneColor(zone.value, zone.ref);
                        return (
                            <path
                                key={zone.id}
                                d={zone.path}
                                fill={color}
                                stroke="transparent"
                                style={{
                                    transition: 'all 0.5s ease',
                                    cursor: onMarkerClick ? 'pointer' : 'default'
                                }}
                                onClick={() => onMarkerClick?.(zone.id)}
                            >
                                <title>{`${zone.label}: ${zone.value}cm (Ref: ${zone.ref}cm)`}</title>
                            </path>
                        )
                    })}
                </g>

                {/* Interactive Hotspots (Invisible but clickable for better UX) */}
                <g className="interaction-layer">
                    {zones.map((zone) => (
                        <path
                            key={`hit-${zone.id}`}
                            d={zone.path}
                            fill="transparent"
                            stroke="rgba(255,255,255,0.1)"
                            strokeWidth="1"
                            className="zone-hitbox"
                            onClick={() => onMarkerClick?.(zone.id)}
                        />
                    ))}
                </g>
            </svg>

            <div className="heatmap-legend">
                <div className="legend-item">
                    <span className="dot" style={{ background: '#3b82f6' }}></span>
                    <span>Pérdida (&#60;97%)</span>
                </div>
                <div className="legend-item">
                    <span className="dot" style={{ background: '#6b7280' }}></span>
                    <span>Estable (±3%)</span>
                </div>
                <div className="legend-item">
                    <span className="dot" style={{ background: '#eab308' }}></span>
                    <span>Crecimiento (3-8%)</span>
                </div>
                <div className="legend-item">
                    <span className="dot" style={{ background: '#ef4444' }}></span>
                    <span>Hipertrofia (&#62;8%)</span>
                </div>
            </div>

            <style>{`
        .volume-heatmap-container {
            position: relative;
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .volume-svg {
            height: 100%;
            max-height: 550px;
            filter: drop-shadow(0 0 20px rgba(0,0,0,0.5));
        }
        .zone-hitbox {
            transition: stroke 0.2s;
            cursor: pointer;
        }
        .zone-hitbox:hover {
            stroke: rgba(255,255,255,0.5);
            stroke-width: 2;
        }
        .heatmap-legend {
            margin-top: 1rem;
            display: flex;
            gap: 1rem;
            flex-wrap: wrap;
            justify-content: center;
            background: rgba(0,0,0,0.3);
            padding: 0.5rem 1rem;
            border-radius: 12px;
            border: 1px solid rgba(255,255,255,0.05);
        }
        .legend-item {
            display: flex;
            align-items: center;
            gap: 0.4rem;
            font-size: 0.7rem;
            color: var(--text-secondary);
        }
        .legend-item .dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
        }
      `}</style>
        </div>
    );
};
