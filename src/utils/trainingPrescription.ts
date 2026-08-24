import type { BodyMeasurements } from '../types/measurements';
import { computeComprehensiveAnalysis, type MuscleBenchmark } from './benchmarkAnalysis';

export interface ExerciseRecommendation {
  name: string;
  emphasis: string; // e.g. 'Posición Alargada / Stretch', 'Pico de Contracción', 'Compuesto Pesado'
  setsPerWeek: string; // e.g. '3 - 4 series'
  repRange: string; // e.g. '8 - 12 reps @ RIR 1-2'
  tips: string;
}

export interface MusclePrescription {
  key: string;
  muscleName: string;
  category: string;
  currentCm: number;
  potentialCm: number;
  percentOfMax: number;
  priorityLevel: 1 | 2 | 3; // 1 = Máxima Prioridad (Rezagado), 2 = Desarrollo Óptimo, 3 = Mantenimiento/Dominante
  priorityLabel: string;
  priorityColor: string;
  priorityBg: string;
  recommendedWeeklySets: number;
  recommendedFrequency: string; // e.g. '2 a 3 veces por semana'
  tacticalDiagnosis: string;
  exercises: ExerciseRecommendation[];
}

export interface ComprehensivePrescription {
  globalScore: number;
  primaryLaggingGroup: string;
  prescriptions: MusclePrescription[];
  generalTrainingAdvice: string[];
}

const EXERCISE_DATABASE: Record<string, ExerciseRecommendation[]> = {
  pecho: [
    {
      name: 'Press Inclinado con Mancuernas (30°)',
      emphasis: 'Hipertrofia mediada por estiramiento (Haz Clavicular)',
      setsPerWeek: '3 - 4 series',
      repRange: '8 - 10 reps @ RIR 1',
      tips: 'Desciende en 3 segundos permitiendo un estiramiento profundo en la posición baja con los codos a 45-60°.'
    },
    {
      name: 'Cruces en Polea Baja a Alta (Cable Flyes)',
      emphasis: 'Tensión constante y contracción clavicular',
      setsPerWeek: '3 series',
      repRange: '12 - 15 reps @ RIR 0-1',
      tips: 'Alinea los cables con el plano de las fibras del pectoral superior; pausa 1s en la contracción.'
    },
    {
      name: 'Fondos en Paralelas con Lastre (Dips)',
      emphasis: 'Sobrecarga en máximo estiramiento (Pectoral Mayor)',
      setsPerWeek: '3 series',
      repRange: '6 - 10 reps @ RIR 1-2',
      tips: 'Inclina el torso 30° hacia adelante y ensancha los codos para maximizar el reclutamiento pectoral.'
    }
  ],
  arm: [
    {
      name: 'Curl Inclinado con Mancuernas (Incline DB Curl)',
      emphasis: 'Máximo estiramiento de la cabeza larga del bíceps',
      setsPerWeek: '3 - 4 series',
      repRange: '8 - 12 reps @ RIR 1',
      tips: 'Banco a 60°; mantén los codos detrás del torso durante todo el rango para estirar el bíceps al límite.'
    },
    {
      name: 'Extensiones de Tríceps sobre la Cabeza en Polea (Overhead Cable Extension)',
      emphasis: 'Hipertrofia en posición alargada de la cabeza larga del tríceps',
      setsPerWeek: '4 series',
      repRange: '10 - 12 reps @ RIR 1',
      tips: 'Permite que la polea estire completamente el tríceps detrás del cuello antes de extender los codos.'
    },
    {
      name: 'Curl Predicador / Scott con Barra Z o Polea',
      emphasis: 'Pico de torque en la primera mitad del recorrido',
      setsPerWeek: '3 series',
      repRange: '10 - 12 reps @ RIR 0',
      tips: 'Controla el descenso en la fase excéntrica y no bloquees los codos en la posición inferior.'
    }
  ],
  forearm: [
    {
      name: 'Curl Invertido con Barra o Polea (Reverse Curl)',
      emphasis: 'Desarrollo del Braquiorradial y extensor radial',
      setsPerWeek: '3 - 4 series',
      repRange: '12 - 15 reps @ RIR 1',
      tips: 'Agarre prono estricto; eleva con los antebrazos sin balancear los codos.'
    },
    {
      name: 'Flexiones de Muñeca en Banco con Mancuernas / Barra',
      emphasis: 'Masa de los flexores del antebrazo',
      setsPerWeek: '3 series',
      repRange: '15 - 20 reps @ RIR 0-1',
      tips: 'Deja rodar la barra hasta los dedos para un rango completo de flexión y estiramiento.'
    }
  ],
  thigh: [
    {
      name: 'Sentadilla Hack / Prensa Inclinada con Pies Bajos',
      emphasis: 'Sobrecarga de cuádriceps en máxima flexión de rodilla',
      setsPerWeek: '3 - 4 series',
      repRange: '6 - 10 reps @ RIR 1-2',
      tips: 'Permite que las rodillas viajen hacia adelante pasando la punta de los pies para estirar los vastos.'
    },
    {
      name: 'Extensiones de Pierna en Máquina (Leg Extensions)',
      emphasis: 'Aislamiento y sobrecarga del Recto Femoral en acortamiento',
      setsPerWeek: '3 - 4 series',
      repRange: '10 - 15 reps @ RIR 0 (Pausa 1s arriba)',
      tips: 'Inclina el respaldo hacia atrás para estirar el recto femoral en la articulación de la cadera.'
    },
    {
      name: 'Peso Muerto Rumano con Déficit (Deficit RDL)',
      emphasis: 'Hipertrofia mediada por estiramiento en Isquiosurales y Glúteos',
      setsPerWeek: '3 - 4 series',
      repRange: '8 - 10 reps @ RIR 1',
      tips: 'Lleva la cadera hacia atrás hasta que los isquiosurales alcancen su máximo estiramiento sin flexionar la columna.'
    }
  ],
  calf: [
    {
      name: 'Elevaciones de Talones de Pie en Máquina (Standing Calf Raises)',
      emphasis: 'Hipertrofia del Gastrocnemio en rodilla extendida',
      setsPerWeek: '4 - 5 series',
      repRange: '10 - 12 reps @ RIR 0',
      tips: 'PAUSA OBLIGATORIA de 3 segundos en la posición inferior para disipar la elasticidad del tendón de Aquiles.'
    },
    {
      name: 'Elevaciones de Talones Sentado en Máquina (Seated Calf Raises)',
      emphasis: 'Aislamiento del Sóleo (rodilla flexionada a 90°)',
      setsPerWeek: '3 - 4 series',
      repRange: '12 - 15 reps @ RIR 1',
      tips: 'Rango de movimiento completo; siente el estiramiento profundo en cada repetición.'
    }
  ],
  neck: [
    {
      name: 'Flexiones de Cuello con Disco / Arnés (Neck Flexion)',
      emphasis: 'Esternocleidomastoideo y flexores anteriores',
      setsPerWeek: '3 series',
      repRange: '15 - 20 reps @ RIR 2',
      tips: 'Movimientos lentos y controlados con peso moderado, apoyando la cabeza al borde del banco.'
    },
    {
      name: 'Extensiones de Cuello con Arnés / Disco (Neck Extension)',
      emphasis: 'Trapecio superior y esplenio de la cabeza',
      setsPerWeek: '3 series',
      repRange: '15 - 20 reps @ RIR 2',
      tips: 'Excelente para engrosar el cuello y mejorar la presencia estética en conjunto con los hombros.'
    }
  ]
};

export const generateTrainingPrescriptions = (
  measurements?: BodyMeasurements,
  sex: 'male' | 'female' = 'male'
): ComprehensivePrescription => {
  const analysis = computeComprehensiveAnalysis(measurements, sex);

  if (!analysis || analysis.muscleBenchmarks.length === 0) {
    return {
      globalScore: 0,
      primaryLaggingGroup: 'Sin datos',
      prescriptions: [],
      generalTrainingAdvice: [
        'Registra tus medidas antropométricas completas para desbloquear tu prescripción de hipertrofia personalizada.'
      ]
    };
  }

  const benchmarks = analysis.muscleBenchmarks;
  const avgPercent = Math.round(
    benchmarks.reduce((acc, b) => acc + b.percentOfMax, 0) / benchmarks.length
  );

  // Map each benchmark to a prescription
  const prescriptions: MusclePrescription[] = benchmarks.map((bm: MuscleBenchmark) => {
    const diffFromAvg = bm.percentOfMax - avgPercent;
    let priorityLevel: 1 | 2 | 3 = 2;
    let priorityLabel = 'Desarrollo Equilibrado';
    let priorityColor = '#38bdf8';
    let priorityBg = 'rgba(56, 189, 248, 0.15)';
    let recommendedWeeklySets = 12;
    let recommendedFrequency = '2 veces por semana';
    let tacticalDiagnosis = '';

    if (bm.percentOfMax < 85 || diffFromAvg <= -6) {
      priorityLevel = 1;
      priorityLabel = 'PRIORIDAD 1: Rezagado';
      priorityColor = '#ef4444';
      priorityBg = 'rgba(239, 68, 68, 0.15)';
      recommendedWeeklySets = 16;
      recommendedFrequency = '2 a 3 veces por semana (Frecuencia Alta)';
      tacticalDiagnosis = `Este grupo muscular se encuentra al ${bm.percentOfMax}% de su techo genético (${Math.abs(diffFromAvg).toFixed(1)}% por debajo de tu promedio corporal). Requiere sobrecarga prioritaria al inicio de tus sesiones.`;
    } else if (bm.percentOfMax >= 93 || diffFromAvg >= 6) {
      priorityLevel = 3;
      priorityLabel = 'PRIORIDAD 3: Dominante / Mantenimiento';
      priorityColor = '#10b981';
      priorityBg = 'rgba(16, 185, 129, 0.15)';
      recommendedWeeklySets = 8;
      recommendedFrequency = '1 a 2 veces por semana';
      tacticalDiagnosis = `Excelente desarrollo (${bm.percentOfMax}% de tu límite genético). Puedes destinar volumen a otros grupos rezagados mientras mantienes este nivel con 6-8 series intensas.`;
    } else {
      priorityLevel = 2;
      priorityLabel = 'PRIORIDAD 2: Óptimo';
      priorityColor = '#fbbf24';
      priorityBg = 'rgba(251, 191, 36, 0.15)';
      recommendedWeeklySets = 12;
      recommendedFrequency = '2 veces por semana';
      tacticalDiagnosis = `Desarrollo armónico en fase intermedia (${bm.percentOfMax}% del techo). Mantén un volumen progresivo con 10-14 series semanales.`;
    }

    const exercises = EXERCISE_DATABASE[bm.key] || [
      {
        name: `Sobrecarga Progresiva en ${bm.label}`,
        emphasis: 'Hipertrofia en Rango Completo',
        setsPerWeek: `${recommendedWeeklySets} series`,
        repRange: '8 - 12 reps @ RIR 1-2',
        tips: 'Prioriza ejercicios donde el músculo experimente tensión continua en máximo estiramiento.'
      }
    ];

    return {
      key: bm.key,
      muscleName: bm.label,
      category: bm.levelLabel || 'General',
      currentCm: bm.current,
      potentialCm: bm.potentialMax,
      percentOfMax: bm.percentOfMax,
      priorityLevel,
      priorityLabel,
      priorityColor,
      priorityBg,
      recommendedWeeklySets,
      recommendedFrequency,
      tacticalDiagnosis,
      exercises
    };
  });

  // Sort by priority level ascending (Level 1 first)
  prescriptions.sort((a, b) => a.priorityLevel - b.priorityLevel || a.percentOfMax - b.percentOfMax);

  const primaryLag = prescriptions.find(p => p.priorityLevel === 1)?.muscleName || 'Ninguno (Físico Balanceado)';

  const generalTrainingAdvice = [
    'Enfoca tus primeras 3-4 series semanales del entrenamiento en el grupo de Prioridad 1 cuando tu sistema nervioso esté fresco.',
    'Aplica hipertrofia mediada por estiramiento: detén el peso 1 segundo en la posición más estirada del ejercicio para maximizar la mecanotransducción.',
    'Asegura un RIR (Reps in Reserve) de 1 a 2 en ejercicios compuestos pesados y RIR 0 a 1 en máquinas y poleas de aislamiento.'
  ];

  return {
    globalScore: avgPercent,
    primaryLaggingGroup: primaryLag,
    prescriptions,
    generalTrainingAdvice
  };
};
