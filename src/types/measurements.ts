export type Side = 'left' | 'right';

export interface BilateralMeasurement {
    left: number;
    right: number;
}

export interface BodyMeasurements {
    // Head and Torso
    neck: number;
    back: number;
    pecho: number;
    waist: number;
    hips: number;

    // Upper Extremities (Bilateral)
    arm: BilateralMeasurement;
    forearm: BilateralMeasurement;
    wrist: BilateralMeasurement;

    // Lower Extremities (Bilateral)
    thigh: BilateralMeasurement;
    calf: BilateralMeasurement;
    ankle: BilateralMeasurement;

    // Complementary
    weight: number;
    height?: number;
    bodyFat?: number;
}

export type PhotoAngle = 'front' | 'side' | 'back';

export interface BodyPhoto {
    id: string;
    url: string;
    angle: PhotoAngle;
    createdAt: string;
}

export type MeasurementCondition = 'fasted' | 'post_workout' | 'rest_day';

export interface RecordMetadata {
    condition: MeasurementCondition;
    sleepHours?: number;
    menstrualPhase?: string;
}

export interface MeasurementRecord {
    id: string;
    userId: string;
    date: string;
    time?: string;
    notes?: string;
    measurements: BodyMeasurements;
    metadata?: RecordMetadata;
    photos?: BodyPhoto[];
}

export type GoalStatus = 'active' | 'achieved' | 'failed';

export interface GrowthGoal {
    id: string;
    userId: string;
    measurementType: keyof BodyMeasurements |
    'weight' | 'bodyFat' |
    'arm.left' | 'arm.right' |
    'thigh.left' | 'thigh.right' |
    'calf.left' | 'calf.right' |
    'biceps' | 'chest' | 'calves'; // Legacy Aliases for AnalysisView compatibility
    targetValue: number;
    targetDate: string;
    status: GoalStatus;
    createdAt: string;
}

export interface SkeletalFrame {
    wrist: number;
    ankle: number;
    knee: number;
    elbow?: number;
}

export interface UserProfile {
    id: string;
    name: string;
    sex: 'male' | 'female';
    birthDate?: string;
    baseline?: SkeletalFrame;
}
