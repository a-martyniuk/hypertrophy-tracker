import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { Sparkles, Compass, HelpCircle } from 'lucide-react';
import { Tooltip as AppTooltip } from '../Tooltip';
import type { BodyMeasurements } from '../../types/measurements';
import { computeComprehensiveAnalysis } from '../../utils/benchmarkAnalysis';
import './HarmonyRadarChart.css';

interface Props {
  currentMeasurements?: BodyMeasurements;
  sex?: 'male' | 'female';
}

export const HarmonyRadarChart: React.FC<Props> = ({ currentMeasurements, sex = 'male' }) => {
  const analysis = computeComprehensiveAnalysis(currentMeasurements, sex);

  if (!analysis || analysis.muscleBenchmarks.length === 0) {
    return null;
  }

  // Extract radar data
  const bmMap: Record<string, number> = {};
  analysis.muscleBenchmarks.forEach((bm) => {
    bmMap[bm.key] = bm.percentOfMax;
  });

  const chestScore = bmMap['pecho'] ?? 50;
  const armScore = bmMap['arm'] ?? 50;
  const forearmScore = bmMap['forearm'] ?? 50;
  const thighScore = bmMap['thigh'] ?? 50;
  const calfScore = bmMap['calf'] ?? 50;

  // V-Taper score: 100 is ideal Reeves/Golden ratio
  const chestVal = currentMeasurements?.pecho || 0;
  const waistVal = currentMeasurements?.waist || 0;
  const vRatio = waistVal > 0 ? chestVal / waistVal : 1.35;
  const vTaperScore = Math.min(100, Math.round((vRatio / 1.618) * 100));

  const radarData = [
    { subject: 'Torso / Pecho', value: chestScore, benchmark: 100, fullMark: 100 },
    { subject: 'Brazos', value: armScore, benchmark: 100, fullMark: 100 },
    { subject: 'Antebrazos', value: forearmScore, benchmark: 100, fullMark: 100 },
    { subject: 'V-Taper (Cintura)', value: vTaperScore, benchmark: 100, fullMark: 100 },
    { subject: 'Muslos', value: thighScore, benchmark: 100, fullMark: 100 },
    { subject: 'Gemelos', value: calfScore, benchmark: 100, fullMark: 100 }
  ];

  const overallHarmonyScore = Math.round(
    radarData.reduce((acc, item) => acc + item.value, 0) / radarData.length
  );

  return (
    <div className="harmony-radar-card glass animate-fade-in">
      <div className="radar-header">
        <div className="radar-header-left">
          <div className="radar-icon-box">
            <Compass size={20} className="text-amber-400" />
          </div>
          <div>
            <div className="radar-badge-row">
              <span className="radar-tag">Biometría 360°</span>
              <span className="harmony-score-pill">
                <Sparkles size={11} /> {overallHarmonyScore}/100 Armonía
              </span>
            </div>
            <h3 className="radar-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>Radar de Simetría & Proporción Áurea</span>
              <AppTooltip content="El Radar 360° evalúa el balance entre tus grupos musculares respecto a tu potencial genético natural (Modelo Casey Butt y Proporción Áurea de Reeves). El 100% representa el equilibrio estético óptimo." position="bottom" width="280px">
                <HelpCircle size={14} style={{ opacity: 0.7, cursor: 'help', color: 'var(--primary-color)' }} />
              </AppTooltip>
            </h3>
          </div>
        </div>
      </div>

      <div className="radar-chart-container">
        <ResponsiveContainer width="100%" height={260}>
          <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
            <PolarGrid stroke="rgba(255, 255, 255, 0.12)" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'monospace', fontWeight: 600 }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[40, 100]}
              tick={{ fill: '#64748b', fontSize: 9 }}
              stroke="rgba(255, 255, 255, 0.08)"
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="radar-tooltip glass">
                      <span className="tt-subject">{data.subject}</span>
                      <div className="tt-row">
                        <span className="tt-lbl">Tu Nivel:</span>
                        <span className="tt-val-user">{data.value}% del ideal</span>
                      </div>
                      <div className="tt-row">
                        <span className="tt-lbl">Benchmark Áureo:</span>
                        <span className="tt-val-bench">100%</span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            {/* Ideal Golden Standard Contour */}
            <Radar
              name="Canon Áureo (100%)"
              dataKey="benchmark"
              stroke="#f59e0b"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              fill="#f59e0b"
              fillOpacity={0.06}
            />
            {/* User Actual Contour */}
            <Radar
              name="Tu Físico Actual"
              dataKey="value"
              stroke="#38bdf8"
              strokeWidth={2.5}
              fill="#38bdf8"
              fillOpacity={0.35}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className="radar-legend-strip">
        <div className="legend-item">
          <span className="legend-color-box user-color" />
          <span>Tu Físico Actual ({overallHarmonyScore}%)</span>
        </div>
        <div className="legend-item">
          <span className="legend-color-box golden-color" />
          <span>Proporción Áurea / Steve Reeves (100%)</span>
        </div>
      </div>
    </div>
  );
};
