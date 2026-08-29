import { calculateBMR, calculateBasalCalories } from './metabolism';

export type NutritionPhase = 'cut' | 'bulk' | 'recomp' | 'maintenance';

export interface PhaseRecommendationResult {
    phase: NutritionPhase;
    phaseTitle: string;
    phaseSubtitle: string;
    badgeColor: 'red' | 'green' | 'blue' | 'amber';
    recommendedCaloricDelta: number; // e.g. +250 or -400
    targetCalories: number;
    tdee: number;
    targetBodyFatRange: string;
    estimatedDurationWeeks: number;
    proteinGramsPerKg: number;
    proteinGramsTotal: number;
    carbsGramsTotal: number;
    fatsGramsTotal: number;
    rationale: string;
    keyDirectives: string[];
}

/**
 * Recommends optimal training and nutritional phase based on Body Fat %, FFMI, and metabolic rate.
 */
export const calculatePhaseRecommendation = (
    weight: number,
    height: number,
    bodyFat: number,
    sex: 'male' | 'female' = 'male',
    age: number = 28,
    ffmiValue?: number,
    activityLevel: number = 1.4 // Moderately active default
): PhaseRecommendationResult => {
    const safeWeight = weight > 0 ? weight : (sex === 'female' ? 60 : 75);
    const safeHeight = height > 0 ? height : (sex === 'female' ? 165 : 178);
    const safeBf = Math.max(3, Math.min(50, bodyFat || (sex === 'female' ? 22 : 15)));
    const safeAge = Math.max(14, Math.min(100, age || 28));

    const bmr = calculateBMR(safeWeight, safeHeight, safeAge, sex);
    const tdee = calculateBasalCalories(bmr, activityLevel);

    const isFemale = sex === 'female';
    const cutThreshold = isFemale ? 25.0 : 17.0;
    const bulkThreshold = isFemale ? 20.0 : 12.0;
    const highFfmiLimit = isFemale ? 20.0 : 23.0;

    const currentFfmi = ffmiValue || ((safeWeight * (1 - safeBf / 100)) / Math.pow(safeHeight / 100, 2));

    let phase: NutritionPhase = 'recomp';
    let phaseTitle = '';
    let phaseSubtitle = '';
    let badgeColor: 'red' | 'green' | 'blue' | 'amber' = 'amber';
    let recommendedCaloricDelta = 0;
    let targetBodyFatRange = '';
    let estimatedDurationWeeks = 8;
    let proteinGramsPerKg = 2.0;
    let rationale = '';
    let keyDirectives: string[] = [];

    if (safeBf > cutThreshold) {
        // High body fat -> Prioritize Deficit / Mini-Cut
        phase = 'cut';
        phaseTitle = 'Definición Táctica / Mini-Cut';
        phaseSubtitle = 'Reducción de adiposidad para optimizar sensibilidad a la insulina y estética';
        badgeColor = 'red';
        recommendedCaloricDelta = -450;
        targetBodyFatRange = isFemale ? '19% - 22%' : '10% - 13%';
        
        const fatLossKgNeeded = safeWeight * ((safeBf - (isFemale ? 21 : 12)) / 100);
        estimatedDurationWeeks = Math.max(4, Math.ceil(fatLossKgNeeded / 0.5));
        proteinGramsPerKg = 2.3; // Higher protein in deficit to preserve muscle
        
        rationale = `Con un ${safeBf}% de grasa corporal, un déficit controlado mejorará tu ratio P (partición de nutrientes), aumentará la visibilidad muscular y preparará el terreno para futuros superávits limpios.`;
        keyDirectives = [
            'Déficit calórico moderado (-450 kcal/día) protegiendo masa magra.',
            'Consumir 2.2 a 2.4 g/kg de proteína de alto valor biológico.',
            'Mantener cargas pesadas (RPE 7-9) sin reducir la intensidad de fuerza.',
            'Paso diario activo (NEAT): 8,000 - 10,000 pasos al día.'
        ];
    } else if (safeBf < bulkThreshold && currentFfmi < highFfmiLimit) {
        // Lean athlete with high growth potential -> Hypertrophy Surplus
        phase = 'bulk';
        phaseTitle = 'Superávit Limpio (Lean Bulk)';
        phaseSubtitle = 'Máxima síntesis proteica con mínimo almacenamiento graso';
        badgeColor = 'green';
        recommendedCaloricDelta = 250;
        targetBodyFatRange = isFemale ? '18% - 22%' : '10% - 14%';
        estimatedDurationWeeks = 16;
        proteinGramsPerKg = 1.9;

        rationale = `Excelente punto de partida (${safeBf}% de grasa y FFMI ${currentFfmi.toFixed(1)}). Tu cuerpo se encuentra en un entorno anabólico óptimo para construir tejido muscular con mínimo depósito adiposo.`;
        keyDirectives = [
            'Superávit controlado (+250 kcal/día) con objetivo de ganar ~0.8 a 1.2 kg al mes.',
            'Priorizar carbohidratos complejos peri-entrenamiento (arroz, avena, papas).',
            'Sobrecarga progresiva: subir repeticiones o peso cada 1-2 microciclos.',
            'Monitoreo semanal de cintura: si sube >1 cm en 2 semanas, ajustar calorías.'
        ];
    } else {
        // Optimal sweet spot -> Recomposition / Controlled Hypertrophy
        phase = 'recomp';
        phaseTitle = 'Recomposición & Consolidación';
        phaseSubtitle = 'Construcción muscular selectiva en la zona áurea de grasa corporal';
        badgeColor = 'blue';
        recommendedCaloricDelta = 100;
        targetBodyFatRange = isFemale ? '20% - 23%' : '12% - 15%';
        estimatedDurationWeeks = 12;
        proteinGramsPerKg = 2.0;

        rationale = `Te encuentras en la zona ideal (${safeBf}% de grasa corporal). Puedes enfocarte en hipertrofia de grupos rezagados mientras mantienes un porcentaje estético todo el año.`;
        keyDirectives = [
            'Calorías en normocalórica o ligero superávit (+100 kcal/día).',
            '2.0 g/kg de proteína distribuidos en 3-4 tomas diarias.',
            'Énfasis en simetría áurea (Hombros / V-Taper / Brazos).',
            'Ciclar carbohidratos: más en días de entrenamiento pesado, menos en descanso.'
        ];
    }

    const targetCalories = Math.round(tdee + recommendedCaloricDelta);
    const proteinGramsTotal = Math.round(safeWeight * proteinGramsPerKg);
    const proteinCalories = proteinGramsTotal * 4;

    // Fat: 0.8g to 1.0g per kg
    const fatGramsPerKg = phase === 'cut' ? 0.75 : 0.9;
    const fatsGramsTotal = Math.round(safeWeight * fatGramsPerKg);
    const fatCalories = fatsGramsTotal * 9;

    // Remaining calories to carbs
    const remainingCalories = Math.max(200, targetCalories - proteinCalories - fatCalories);
    const carbsGramsTotal = Math.round(remainingCalories / 4);

    return {
        phase,
        phaseTitle,
        phaseSubtitle,
        badgeColor,
        recommendedCaloricDelta,
        targetCalories,
        tdee,
        targetBodyFatRange,
        estimatedDurationWeeks,
        proteinGramsPerKg,
        proteinGramsTotal,
        carbsGramsTotal,
        fatsGramsTotal,
        rationale,
        keyDirectives
    };
};
