
export const ACTIVITY_FACTORS = {
    SEDENTARY: 1.2, // Poco o ningún ejercicio
    LIGHTLY_ACTIVE: 1.3, // Ejercicio ligero 1-3 días
    MODERATELY_ACTIVE: 1.4, // Ejercicio moderado 3-5 días
    VERY_ACTIVE: 1.5, // Ejercicio fuerte 6-7 días
}

export const MET_VALUES = {
    STRENGTH_LOW: 3.5,
    STRENGTH_MEDIUM: 5.0,
    STRENGTH_HIGH: 7.0, // Used as reference, but user specified 6-8
    CARDIO_LOW: 4.0,
    CARDIO_MEDIUM: 6.0, // 5-7
    CARDIO_HIGH: 10.0, // 8-12
}

export type TrainingIntensity = 'low' | 'medium' | 'high'
export type TrainingType = 'strength' | 'cardio' | 'mixed'
export type Sex = 'male' | 'female'

export function calculateBMR(weight: number, height: number, age: number, sex: Sex): number {
    // Mifflin-St Jeor
    // Men: (10 × weight) + (6.25 × height) − (5 × age) + 5
    // Women: (10 × weight) + (6.25 × height) − (5 × age) − 161
    const bmr = (10 * weight) + (6.25 * height) - (5 * age)
    return sex === 'male' ? bmr + 5 : bmr - 161
}

export function calculateBasalCalories(bmr: number, neatFactor: number): number {
    return Math.round(bmr * neatFactor)
}

export function calculateSessionCalories(
    weight: number,
    durationHours: number,
    intensity: TrainingIntensity,
    type: TrainingType
): number {
    let met = 0

    // Custom logic based on user request ranges
    if (type === 'strength') {
        if (intensity === 'low') met = 3.5
        if (intensity === 'medium') met = 5.0
        if (intensity === 'high') met = 7.0 // Average of 6-8
    } else if (type === 'cardio') {
        if (intensity === 'low') met = 4.0
        if (intensity === 'medium') met = 6.0 // Average of 5-7
        if (intensity === 'high') met = 10.0 // Average of 8-12
    } else {
        // Mixed - Averages
        if (intensity === 'low') met = 3.75
        if (intensity === 'medium') met = 5.5
        if (intensity === 'high') met = 8.5
    }

    return Math.round(weight * met * durationHours)
}

export function calculateDailyActiveCalories(
    sessionCalories: number,
    sessionsPerWeek: number
): number {
    return Math.round((sessionCalories * sessionsPerWeek) / 7)
}

export interface MacroSplit {
    protein: number
    fats: number
    carbs: number
}

export interface CaloricTargets {
    maintenance: number
    deficit: {
        mild: { calories: number, description: string } // 10%
        aggressive: { calories: number, description: string } // 20%
    }
    surplus: {
        lean: { calories: number, description: string } // 5%
        aggressive: { calories: number, description: string } // 15%
    }
}

export function calculateTargets(totalDailyCalories: number): CaloricTargets {
    return {
        maintenance: Math.round(totalDailyCalories),
        deficit: {
            mild: {
                calories: Math.round(totalDailyCalories * 0.90),
                description: 'Déficit sostenible (-10%)'
            },
            aggressive: {
                calories: Math.round(totalDailyCalories * 0.80),
                description: 'Definición rápida (-20%)'
            }
        },
        surplus: {
            lean: {
                calories: Math.round(totalDailyCalories * 1.05),
                description: 'Volumen limpio (+5%)'
            },
            aggressive: {
                calories: Math.round(totalDailyCalories * 1.15),
                description: 'Ganancia máxima (+15%)'
            }
        }
    }
}
