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

export interface MeasurementRecord {
    id: string;
    userId: string;
    date: string;
    time?: string;
    notes?: string;
    measurements: BodyMeasurements;
}

export interface UserProfile {
    id: string;
    name: string;
    sex: 'male' | 'female';
    birthDate?: string;
}
