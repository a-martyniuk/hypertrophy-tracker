import type { GrowthGoal, MeasurementRecord, UserProfile } from '../types/measurements';

export interface GoalPrediction {
  goalId: string;
  measurementType: string;
  currentValue: number;
  targetValue: number;
  delta: number;
  unit: string;
  isReduction: boolean;
  monthlyRate: number; // e.g. 0.35 cm/month
  estimatedMonths: number;
  estimatedWeeks: number;
  projectedDate: Date;
  projectedDateFormatted: string;
  userTargetDate: Date;
  daysRemainingToUserTarget: number;
  feasibility: 'realistic' | 'ambitious' | 'very_aggressive' | 'completed';
  feasibilityLabel: string;
  feasibilityColor: string;
  feasibilityBg: string;
  coachingTip: string;
}

// Scientific monthly rate benchmarks (cm or kg per month in intermediate natural lifters)
const MONTHLY_RATES: Record<string, { gain: number; loss: number; unit: string }> = {
  weight: { gain: 0.8, loss: 1.8, unit: 'kg' },
  bodyFat: { gain: 0.5, loss: 1.0, unit: '%' },
  pecho: { gain: 0.55, loss: 0.7, unit: 'cm' },
  back: { gain: 0.55, loss: 0.7, unit: 'cm' },
  neck: { gain: 0.25, loss: 0.35, unit: 'cm' },
  waist: { gain: 0.4, loss: 1.2, unit: 'cm' },
  hips: { gain: 0.45, loss: 1.0, unit: 'cm' },
  biceps: { gain: 0.32, loss: 0.35, unit: 'cm' },
  chest: { gain: 0.55, loss: 0.7, unit: 'cm' },
  calves: { gain: 0.22, loss: 0.3, unit: 'cm' },
  forearm: { gain: 0.20, loss: 0.3, unit: 'cm' },
  'arm.left': { gain: 0.32, loss: 0.35, unit: 'cm' },
  'arm.right': { gain: 0.32, loss: 0.35, unit: 'cm' },
  'forearm.left': { gain: 0.20, loss: 0.3, unit: 'cm' },
  'forearm.right': { gain: 0.20, loss: 0.3, unit: 'cm' },
  'thigh.left': { gain: 0.5, loss: 0.75, unit: 'cm' },
  'thigh.right': { gain: 0.5, loss: 0.75, unit: 'cm' },
  'calf.left': { gain: 0.22, loss: 0.3, unit: 'cm' },
  'calf.right': { gain: 0.22, loss: 0.3, unit: 'cm' },
};

export const predictGoalTimeline = (
  goal: GrowthGoal,
  latestRecord?: MeasurementRecord,
  profile?: UserProfile | null
): GoalPrediction => {
  const m = latestRecord?.measurements;
  let currentVal = 0;

  if (goal.measurementType === 'weight') {
    currentVal = m?.weight || 0;
  } else if (goal.measurementType === 'bodyFat') {
    currentVal = m?.bodyFat || 0;
  } else if (goal.measurementType === 'biceps' || (goal.measurementType as string) === 'arm') {
    currentVal = Math.max(m?.arm?.right || 0, m?.arm?.left || 0);
  } else if ((goal.measurementType as string) === 'forearm') {
    currentVal = Math.max(m?.forearm?.right || 0, m?.forearm?.left || 0);
  } else if (goal.measurementType === 'chest') {
    currentVal = m?.pecho || 0;
  } else if (goal.measurementType === 'calves') {
    currentVal = Math.max(m?.calf?.right || 0, m?.calf?.left || 0);
  } else if (goal.measurementType.startsWith('arm.')) {
    const side = goal.measurementType.split('.')[1] as 'left' | 'right';
    currentVal = typeof m?.arm === 'object' ? (m.arm[side] || 0) : (m?.arm || 0);
  } else if (goal.measurementType.startsWith('forearm.')) {
    const side = goal.measurementType.split('.')[1] as 'left' | 'right';
    currentVal = typeof m?.forearm === 'object' ? (m.forearm[side] || 0) : (m?.forearm || 0);
  } else if (goal.measurementType.startsWith('thigh.')) {
    const side = goal.measurementType.split('.')[1] as 'left' | 'right';
    currentVal = typeof m?.thigh === 'object' ? (m.thigh[side] || 0) : (m?.thigh || 0);
  } else if (goal.measurementType.startsWith('calf.')) {
    const side = goal.measurementType.split('.')[1] as 'left' | 'right';
    currentVal = typeof m?.calf === 'object' ? (m.calf[side] || 0) : (m?.calf || 0);
  } else {
    // Single number
    const key = goal.measurementType as keyof typeof m;
    currentVal = (typeof m?.[key] === 'number' ? (m[key] as number) : 0);
  }

  const delta = Math.abs(goal.targetValue - currentVal);
  const isReduction = goal.targetValue < currentVal;
  const rates = MONTHLY_RATES[goal.measurementType] || { gain: 0.35, loss: 0.8, unit: 'cm' };
  const sexMod = (profile?.sex === 'female' && !isReduction && goal.measurementType !== 'weight' && goal.measurementType !== 'bodyFat') ? 0.75 : 1.0;
  const monthlyRate = parseFloat(((isReduction ? rates.loss : rates.gain) * sexMod).toFixed(2));

  if (delta === 0 || (isReduction ? currentVal <= goal.targetValue : currentVal >= goal.targetValue)) {
    return {
      goalId: goal.id,
      measurementType: goal.measurementType,
      currentValue: currentVal,
      targetValue: goal.targetValue,
      delta: 0,
      unit: rates.unit,
      isReduction,
      monthlyRate,
      estimatedMonths: 0,
      estimatedWeeks: 0,
      projectedDate: new Date(),
      projectedDateFormatted: '¡Objetivo Alcanzado!',
      userTargetDate: new Date(goal.targetDate),
      daysRemainingToUserTarget: 0,
      feasibility: 'completed',
      feasibilityLabel: 'Alcanzado 🏆',
      feasibilityColor: '#10b981',
      feasibilityBg: 'rgba(16, 185, 129, 0.15)',
      coachingTip: '¡Has completado esta meta antropométrica! Es momento de fijar un nuevo hito de sobrecarga.'
    };
  }

  const estimatedMonths = Math.max(0.2, parseFloat((delta / monthlyRate).toFixed(1)));
  const estimatedWeeks = Math.max(1, Math.round(estimatedMonths * 4.33));
  const msToAdd = estimatedMonths * 30.44 * 24 * 60 * 60 * 1000;
  const projectedDate = new Date(Date.now() + msToAdd);

  const userTargetDate = new Date(goal.targetDate);
  const diffDaysUser = Math.round((userTargetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const diffDaysProjected = Math.round(msToAdd / (1000 * 60 * 60 * 24));

  // Feasibility comparison
  let feasibility: GoalPrediction['feasibility'] = 'realistic';
  let feasibilityLabel = 'Ritmo Realista y Sostenible';
  let feasibilityColor = '#10b981';
  let feasibilityBg = 'rgba(16, 185, 129, 0.15)';
  let coachingTip = `A una tasa natural de ~${monthlyRate} ${rates.unit}/mes, este objetivo se alcanzará de forma limpia sin acumulación excesiva de grasa.`;

  const ratio = diffDaysUser / Math.max(1, diffDaysProjected);

  if (ratio < 0.55) {
    feasibility = 'very_aggressive';
    feasibilityLabel = 'Muy Agresivo (Riesgo de Frustración)';
    feasibilityColor = '#ef4444';
    feasibilityBg = 'rgba(239, 68, 68, 0.15)';
    coachingTip = `Tu fecha límite exige ganar +${(delta / (diffDaysUser / 30.44)).toFixed(2)} ${rates.unit}/mes, superando el límite fisiológico natural. Te recomendamos extender el plazo a ~${estimatedMonths} meses.`;
  } else if (ratio < 0.85) {
    feasibility = 'ambitious';
    feasibilityLabel = 'Ambicioso (Exige Adherencia Estricta)';
    feasibilityColor = '#f59e0b';
    feasibilityBg = 'rgba(245, 158, 11, 0.15)';
    coachingTip = `Plazo ajustado pero alcanzable con superávit calórico controlado (+300 kcal) y sobrecarga progresiva estricta.`;
  }

  const projectedDateFormatted = projectedDate.toLocaleDateString('es-ES', {
    month: 'short',
    year: 'numeric'
  });

  return {
    goalId: goal.id,
    measurementType: goal.measurementType,
    currentValue: currentVal,
    targetValue: goal.targetValue,
    delta: parseFloat(delta.toFixed(1)),
    unit: rates.unit,
    isReduction,
    monthlyRate,
    estimatedMonths,
    estimatedWeeks,
    projectedDate,
    projectedDateFormatted,
    userTargetDate,
    daysRemainingToUserTarget: diffDaysUser,
    feasibility,
    feasibilityLabel,
    feasibilityColor,
    feasibilityBg,
    coachingTip
  };
};
