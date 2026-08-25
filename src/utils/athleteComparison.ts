import type { BodyMeasurements } from '../types/measurements';
import { analyzeProportions } from './proportions';
import { calculateBerkhanLimit, calculateSkeletalPotential, calculateFFMI } from './skeletal';

export interface ComparisonProfile {
    id: string;
    name: string;
    title: string;
    era?: string;
    category?: 'golden' | 'mass' | 'hollywood' | 'lean' | 'modern' | 'female' | 'community';
    sex: 'male' | 'female';
    age?: number;
    height?: number;
    weight?: number;
    bodyFat?: number;
    date?: string;
    measurements: Partial<BodyMeasurements>;
    isCustom?: boolean;
}

export interface HeadToHeadMetric {
    key: string;
    category?: 'biometrics' | 'ratios' | 'perimeters';
    label: string;
    valA: number | string;
    valB: number | string;
    diff: number | string;
    percentDiff?: number;
    unit: string;
    higherIsBetter?: boolean; // true, false or undefined if neutral
    winner: 'A' | 'B' | 'TIE' | 'NEUTRAL';
    insight?: string;
}

export interface DualRadarPoint {
    aspect: string;
    scoreA: number;
    scoreB: number;
    ideal: number;
    valA: string;
    valB: string;
}

export interface BioSummaryChip {
    height: number;
    age: number;
    weight: number;
    bodyFat: number;
    leanMassKg: number;
    ffmi: number;
}

export interface ComparisonVerdict {
    winner: 'A' | 'B' | 'BALANCED';
    scoreA: number;
    scoreB: number;
    title: string;
    summary: string;
    strengthsA: string[];
    strengthsB: string[];
    geneticCeilingA: number; // % achieved
    geneticCeilingB: number; // % achieved
    vTaperA: number;
    vTaperB: number;
    triadScoreA: number;
    triadScoreB: number;
    bioA: BioSummaryChip;
    bioB: BioSummaryChip;
}

export interface FullAthleteComparison {
    athleteA: ComparisonProfile;
    athleteB: ComparisonProfile;
    metrics: HeadToHeadMetric[];
    radarData: DualRadarPoint[];
    verdict: ComparisonVerdict;
}

// --- CANONICAL BENCHMARK PRESETS (Categorized) ---
export const CANONICAL_PRESETS: ComparisonProfile[] = [
    // 1. LEYENDAS DE ORO & ESTÉTICA CLÁSICA (Golden Era)
    {
        id: 'steve_reeves_1950',
        name: 'Steve Reeves',
        title: 'Canon Clásico de la Proporción Áurea (1950)',
        era: 'Golden Era 1950',
        category: 'golden',
        sex: 'male',
        age: 24,
        height: 185,
        weight: 97.0,
        bodyFat: 10.5,
        measurements: {
            height: 185,
            weight: 97.0,
            bodyFat: 10.5,
            neck: 46.5,
            pecho: 132.0,
            back: 132.0,
            waist: 73.5,
            hips: 99.0,
            arm: { left: 46.5, right: 46.5 },
            forearm: { left: 37.5, right: 37.5 },
            thigh: { left: 66.0, right: 66.0 },
            calf: { left: 46.5, right: 46.5 },
            wrist: { left: 18.5, right: 18.5 },
            ankle: { left: 23.5, right: 23.5 }
        }
    },
    {
        id: 'frank_zane_1979',
        name: 'Frank Zane',
        title: 'Estándar Estético & V-Taper Extremo (1979)',
        era: 'Mr. Olympia 1979',
        category: 'golden',
        sex: 'male',
        age: 37,
        height: 175,
        weight: 84.0,
        bodyFat: 7.8,
        measurements: {
            height: 175,
            weight: 84.0,
            bodyFat: 7.8,
            neck: 42.0,
            pecho: 127.0,
            back: 125.0,
            waist: 73.5,
            hips: 95.0,
            arm: { left: 45.5, right: 45.5 },
            forearm: { left: 34.0, right: 34.0 },
            thigh: { left: 66.0, right: 66.0 },
            calf: { left: 42.0, right: 42.0 },
            wrist: { left: 17.0, right: 17.0 },
            ankle: { left: 21.5, right: 21.5 }
        }
    },
    {
        id: 'serge_nubret_1975',
        name: 'Serge Nubret',
        title: 'La Pantera Negra — Máxima Amplitud Torácica (1975)',
        era: 'Golden Era 1975',
        category: 'golden',
        sex: 'male',
        age: 36,
        height: 183,
        weight: 96.0,
        bodyFat: 7.5,
        measurements: {
            height: 183,
            weight: 96.0,
            bodyFat: 7.5,
            neck: 44.5,
            pecho: 145.0,
            back: 140.0,
            waist: 71.0,
            hips: 96.0,
            arm: { left: 50.8, right: 50.8 },
            forearm: { left: 38.0, right: 38.0 },
            thigh: { left: 68.5, right: 68.5 },
            calf: { left: 46.0, right: 46.0 },
            wrist: { left: 18.0, right: 18.0 },
            ankle: { left: 23.0, right: 23.0 }
        }
    },
    {
        id: 'bob_paris_1984',
        name: 'Bob Paris',
        title: 'El Físico Más Armónico y Escultórico (1984)',
        era: 'Mr. Universe 1984',
        category: 'golden',
        sex: 'male',
        age: 25,
        height: 183,
        weight: 98.0,
        bodyFat: 6.5,
        measurements: {
            height: 183,
            weight: 98.0,
            bodyFat: 6.5,
            neck: 44.5,
            pecho: 132.0,
            back: 130.0,
            waist: 74.0,
            hips: 96.0,
            arm: { left: 48.0, right: 48.0 },
            forearm: { left: 37.0, right: 37.0 },
            thigh: { left: 67.0, right: 67.0 },
            calf: { left: 44.5, right: 44.5 },
            wrist: { left: 18.0, right: 18.0 },
            ankle: { left: 23.0, right: 23.0 }
        }
    },
    {
        id: 'john_grimek_1941',
        name: 'John Grimek',
        title: 'El Monarca Invicto — Proporción Pre-Química (1941)',
        era: 'Mr. America 1941',
        category: 'golden',
        sex: 'male',
        age: 31,
        height: 174,
        weight: 88.5,
        bodyFat: 9.5,
        measurements: {
            height: 174,
            weight: 88.5,
            bodyFat: 9.5,
            neck: 43.0,
            pecho: 122.0,
            back: 120.0,
            waist: 77.5,
            hips: 97.0,
            arm: { left: 44.5, right: 44.5 },
            forearm: { left: 35.5, right: 35.5 },
            thigh: { left: 63.5, right: 63.5 },
            calf: { left: 43.0, right: 43.0 },
            wrist: { left: 18.5, right: 18.5 },
            ankle: { left: 23.0, right: 23.0 }
        }
    },
    {
        id: 'eugen_sandow_1894',
        name: 'Eugen Sandow',
        title: 'El Padre del Culturismo & Escultura Griega (1894)',
        era: 'Pionero Clásico 1894',
        category: 'golden',
        sex: 'male',
        age: 27,
        height: 175,
        weight: 84.0,
        bodyFat: 9.0,
        measurements: {
            height: 175,
            weight: 84.0,
            bodyFat: 9.0,
            neck: 44.5,
            pecho: 122.0,
            back: 120.0,
            waist: 73.5,
            hips: 94.0,
            arm: { left: 44.5, right: 44.5 },
            forearm: { left: 35.5, right: 35.5 },
            thigh: { left: 61.0, right: 61.0 },
            calf: { left: 43.0, right: 43.0 },
            wrist: { left: 19.0, right: 19.0 },
            ankle: { left: 24.0, right: 24.0 }
        }
    },

    // 2. PODER, MASA & DENSIDAD (Heavyweight Titans)
    {
        id: 'arnold_schwarzenegger_1975',
        name: 'Arnold Schwarzenegger',
        title: 'El Roble Austríaco — Volumen & Torso Dominante (1975)',
        era: 'Mr. Olympia 1975',
        category: 'mass',
        sex: 'male',
        age: 28,
        height: 188,
        weight: 106.0,
        bodyFat: 9.0,
        measurements: {
            height: 188,
            weight: 106.0,
            bodyFat: 9.0,
            neck: 45.5,
            pecho: 145.0,
            back: 142.0,
            waist: 86.0,
            hips: 104.0,
            arm: { left: 54.0, right: 54.5 },
            forearm: { left: 41.0, right: 41.0 },
            thigh: { left: 72.0, right: 72.0 },
            calf: { left: 51.0, right: 51.0 },
            wrist: { left: 19.5, right: 19.5 },
            ankle: { left: 24.5, right: 24.5 }
        }
    },
    {
        id: 'reg_park_1958',
        name: 'Reg Park',
        title: 'Leyenda de Fuerza & Densidad Suprema (1958)',
        era: 'Mr. Universe 1958',
        category: 'mass',
        sex: 'male',
        age: 30,
        height: 185,
        weight: 103.0,
        bodyFat: 10.0,
        measurements: {
            height: 185,
            weight: 103.0,
            bodyFat: 10.0,
            neck: 46.0,
            pecho: 137.0,
            back: 135.0,
            waist: 81.0,
            hips: 101.0,
            arm: { left: 48.5, right: 48.5 },
            forearm: { left: 38.0, right: 38.0 },
            thigh: { left: 68.5, right: 68.5 },
            calf: { left: 44.5, right: 44.5 },
            wrist: { left: 19.5, right: 19.5 },
            ankle: { left: 25.0, right: 25.0 }
        }
    },
    {
        id: 'franco_columbu_1976',
        name: 'Franco Columbu',
        title: 'El Coloso Sardo — Máxima Densidad Relativa (1976)',
        era: 'Mr. Olympia 1976',
        category: 'mass',
        sex: 'male',
        age: 35,
        height: 165,
        weight: 84.0,
        bodyFat: 8.0,
        measurements: {
            height: 165,
            weight: 84.0,
            bodyFat: 8.0,
            neck: 44.0,
            pecho: 132.0,
            back: 130.0,
            waist: 76.0,
            hips: 96.0,
            arm: { left: 48.5, right: 48.5 },
            forearm: { left: 37.0, right: 37.0 },
            thigh: { left: 66.0, right: 66.0 },
            calf: { left: 44.5, right: 44.5 },
            wrist: { left: 17.5, right: 17.5 },
            ankle: { left: 22.0, right: 22.0 }
        }
    },
    {
        id: 'tom_platz_1981',
        name: 'Tom Platz',
        title: 'The Quadfather — Desarrollo de Piernas Histórico (1981)',
        era: 'Golden Era 1981',
        category: 'mass',
        sex: 'male',
        age: 26,
        height: 173,
        weight: 104.0,
        bodyFat: 7.0,
        measurements: {
            height: 173,
            weight: 104.0,
            bodyFat: 7.0,
            neck: 43.0,
            pecho: 127.0,
            back: 125.0,
            waist: 76.0,
            hips: 102.0,
            arm: { left: 47.0, right: 47.0 },
            forearm: { left: 37.0, right: 37.0 },
            thigh: { left: 76.0, right: 76.0 },
            calf: { left: 50.0, right: 50.0 },
            wrist: { left: 18.0, right: 18.0 },
            ankle: { left: 24.0, right: 24.0 }
        }
    },

    // 3. ÍCONOS DEL CINE & CELEBRIDADES (Hollywood Action Heroes)
    {
        id: 'sylvester_stallone_1985',
        name: 'Sylvester Stallone',
        title: 'Rambo II / Rocky IV — Definición & Vascularización (1985)',
        era: 'Hollywood 1985',
        category: 'hollywood',
        sex: 'male',
        age: 39,
        height: 177,
        weight: 79.0,
        bodyFat: 4.5,
        measurements: {
            height: 177,
            weight: 79.0,
            bodyFat: 4.5,
            neck: 40.5,
            pecho: 112.0,
            back: 110.0,
            waist: 71.0,
            hips: 90.0,
            arm: { left: 43.0, right: 43.0 },
            forearm: { left: 34.5, right: 34.5 },
            thigh: { left: 61.0, right: 61.0 },
            calf: { left: 39.5, right: 39.5 },
            wrist: { left: 17.5, right: 17.5 },
            ankle: { left: 22.0, right: 22.0 }
        }
    },
    {
        id: 'henry_cavill_2013',
        name: 'Henry Cavill',
        title: 'Superman: Man of Steel — Porte Clásico de Superhéroe (2013)',
        era: 'Hollywood 2013',
        category: 'hollywood',
        sex: 'male',
        age: 30,
        height: 185,
        weight: 92.0,
        bodyFat: 8.5,
        measurements: {
            height: 185,
            weight: 92.0,
            bodyFat: 8.5,
            neck: 43.0,
            pecho: 124.0,
            back: 122.0,
            waist: 81.0,
            hips: 98.0,
            arm: { left: 43.0, right: 43.0 },
            forearm: { left: 35.0, right: 35.0 },
            thigh: { left: 66.0, right: 66.0 },
            calf: { left: 42.0, right: 42.0 },
            wrist: { left: 18.5, right: 18.5 },
            ankle: { left: 23.5, right: 23.5 }
        }
    },
    {
        id: 'dwayne_johnson_2014',
        name: 'Dwayne "The Rock" Johnson',
        title: 'Hércules / Fast 6 — El Coloso de Hollywood (2014)',
        era: 'Hollywood 2014',
        category: 'hollywood',
        sex: 'male',
        age: 42,
        height: 193,
        weight: 118.0,
        bodyFat: 8.5,
        measurements: {
            height: 193,
            weight: 118.0,
            bodyFat: 8.5,
            neck: 48.0,
            pecho: 135.0,
            back: 132.0,
            waist: 89.0,
            hips: 108.0,
            arm: { left: 51.0, right: 51.0 },
            forearm: { left: 40.0, right: 40.0 },
            thigh: { left: 74.0, right: 74.0 },
            calf: { left: 46.0, right: 46.0 },
            wrist: { left: 20.0, right: 20.0 },
            ankle: { left: 26.0, right: 26.0 }
        }
    },
    {
        id: 'brad_pitt_1999',
        name: 'Brad Pitt',
        title: 'Fight Club (Tyler Durden) — Definición Magra & Corte (1999)',
        era: 'Hollywood 1999',
        category: 'hollywood',
        sex: 'male',
        age: 35,
        height: 180,
        weight: 70.0,
        bodyFat: 5.5,
        measurements: {
            height: 180,
            weight: 70.0,
            bodyFat: 5.5,
            neck: 38.5,
            pecho: 102.0,
            back: 100.0,
            waist: 74.0,
            hips: 88.0,
            arm: { left: 38.0, right: 38.0 },
            forearm: { left: 31.0, right: 31.0 },
            thigh: { left: 56.0, right: 56.0 },
            calf: { left: 37.5, right: 37.5 },
            wrist: { left: 17.0, right: 17.0 },
            ankle: { left: 21.5, right: 21.5 }
        }
    },
    {
        id: 'hugh_jackman_2013',
        name: 'Hugh Jackman',
        title: 'The Wolverine — Estética Madura & Vascularización (2013)',
        era: 'Hollywood 2013',
        category: 'hollywood',
        sex: 'male',
        age: 44,
        height: 188,
        weight: 89.0,
        bodyFat: 6.5,
        measurements: {
            height: 188,
            weight: 89.0,
            bodyFat: 6.5,
            neck: 42.0,
            pecho: 117.0,
            back: 115.0,
            waist: 81.0,
            hips: 96.0,
            arm: { left: 41.0, right: 41.0 },
            forearm: { left: 33.5, right: 33.5 },
            thigh: { left: 63.5, right: 63.5 },
            calf: { left: 41.0, right: 41.0 },
            wrist: { left: 18.0, right: 18.0 },
            ankle: { left: 23.0, right: 23.0 }
        }
    },
    {
        id: 'jcvd_1988',
        name: 'Jean-Claude Van Damme',
        title: 'Bloodsport / Contacto Sangriento — Flexibilidad & Atletismo (1988)',
        era: 'Hollywood 1988',
        category: 'hollywood',
        sex: 'male',
        age: 28,
        height: 177,
        weight: 82.0,
        bodyFat: 7.0,
        measurements: {
            height: 177,
            weight: 82.0,
            bodyFat: 7.0,
            neck: 42.0,
            pecho: 117.0,
            back: 115.0,
            waist: 73.5,
            hips: 92.0,
            arm: { left: 43.0, right: 43.0 },
            forearm: { left: 34.5, right: 34.5 },
            thigh: { left: 63.5, right: 63.5 },
            calf: { left: 40.5, right: 40.5 },
            wrist: { left: 17.5, right: 17.5 },
            ankle: { left: 22.0, right: 22.0 }
        }
    },

    // 4. DEFINICIÓN & CALISTENIA FUNCIONAL (Lean & Athletic)
    {
        id: 'bruce_lee_1973',
        name: 'Bruce Lee',
        title: 'Operación Dragón — Definición Funcional & Calistenia (1973)',
        era: 'Cine & Artes Marciales 1973',
        category: 'lean',
        sex: 'male',
        age: 32,
        height: 172,
        weight: 62.0,
        bodyFat: 4.8,
        measurements: {
            height: 172,
            weight: 62.0,
            bodyFat: 4.8,
            neck: 39.0,
            pecho: 112.0,
            back: 110.0,
            waist: 66.0,
            hips: 84.0,
            arm: { left: 37.0, right: 37.0 },
            forearm: { left: 31.5, right: 31.5 },
            thigh: { left: 56.0, right: 56.0 },
            calf: { left: 37.0, right: 37.0 },
            wrist: { left: 16.5, right: 16.5 },
            ankle: { left: 20.5, right: 20.5 }
        }
    },

    // 5. ERA MODERNA (Classic Physique)
    {
        id: 'chris_bumstead_2023',
        name: 'Chris Bumstead (CBum)',
        title: 'El Rey del Classic Physique Moderno (2023)',
        era: 'Classic Physique 2023',
        category: 'modern',
        sex: 'male',
        age: 28,
        height: 185,
        weight: 107.5,
        bodyFat: 6.0,
        measurements: {
            height: 185,
            weight: 107.5,
            bodyFat: 6.0,
            neck: 45.0,
            pecho: 132.0,
            back: 130.0,
            waist: 76.0,
            hips: 100.0,
            arm: { left: 50.8, right: 50.8 },
            forearm: { left: 38.5, right: 38.5 },
            thigh: { left: 73.5, right: 73.5 },
            calf: { left: 46.0, right: 46.0 },
            wrist: { left: 18.5, right: 18.5 },
            ankle: { left: 23.5, right: 23.5 }
        }
    },

    // 6. HEROÍNAS DEL CINE & FITNESS FEMENINO (Female Figures)
    {
        id: 'cory_everson_1985',
        name: 'Cory Everson',
        title: '6× Ms. Olympia — Canon Femenino de Oro (1985)',
        era: 'Ms. Olympia 1985',
        category: 'female',
        sex: 'female',
        age: 27,
        height: 175,
        weight: 68.0,
        bodyFat: 10.5,
        measurements: {
            height: 175,
            weight: 68.0,
            bodyFat: 10.5,
            neck: 34.0,
            pecho: 97.0,
            back: 95.0,
            waist: 61.0,
            hips: 91.0,
            arm: { left: 37.0, right: 37.0 },
            forearm: { left: 28.0, right: 28.0 },
            thigh: { left: 58.0, right: 58.0 },
            calf: { left: 38.0, right: 38.0 },
            wrist: { left: 15.5, right: 15.5 },
            ankle: { left: 20.0, right: 20.0 }
        }
    },
    {
        id: 'linda_hamilton_1991',
        name: 'Linda Hamilton',
        title: 'Terminator 2 (Sarah Connor) — Hombros Rocosos & Corte (1991)',
        era: 'Hollywood 1991',
        category: 'female',
        sex: 'female',
        age: 34,
        height: 168,
        weight: 55.0,
        bodyFat: 9.5,
        measurements: {
            height: 168,
            weight: 55.0,
            bodyFat: 9.5,
            neck: 32.0,
            pecho: 86.0,
            back: 85.0,
            waist: 61.0,
            hips: 86.0,
            arm: { left: 30.5, right: 30.5 },
            forearm: { left: 24.0, right: 24.0 },
            thigh: { left: 51.0, right: 51.0 },
            calf: { left: 33.0, right: 33.0 },
            wrist: { left: 15.0, right: 15.0 },
            ankle: { left: 19.5, right: 19.5 }
        }
    },
    {
        id: 'brooke_ence_2017',
        name: 'Brooke Ence',
        title: 'Wonder Woman (Amazona) / CrossFit Games — Densidad (2017)',
        era: 'Hollywood / CrossFit 2017',
        category: 'female',
        sex: 'female',
        age: 28,
        height: 170,
        weight: 68.0,
        bodyFat: 11.0,
        measurements: {
            height: 170,
            weight: 68.0,
            bodyFat: 11.0,
            neck: 34.5,
            pecho: 94.0,
            back: 94.0,
            waist: 66.0,
            hips: 94.0,
            arm: { left: 34.5, right: 34.5 },
            forearm: { left: 26.5, right: 26.5 },
            thigh: { left: 58.5, right: 58.5 },
            calf: { left: 37.0, right: 37.0 },
            wrist: { left: 16.0, right: 16.0 },
            ankle: { left: 21.0, right: 21.0 }
        }
    },
    {
        id: 'jessica_biel_2004',
        name: 'Jessica Biel',
        title: 'Blade: Trinity (Abigail Whistler) — Deltoides & Espalda (2004)',
        era: 'Hollywood 2004',
        category: 'female',
        sex: 'female',
        age: 22,
        height: 170,
        weight: 58.0,
        bodyFat: 12.5,
        measurements: {
            height: 170,
            weight: 58.0,
            bodyFat: 12.5,
            neck: 32.5,
            pecho: 89.0,
            back: 88.0,
            waist: 63.5,
            hips: 91.0,
            arm: { left: 31.0, right: 31.0 },
            forearm: { left: 24.5, right: 24.5 },
            thigh: { left: 53.0, right: 53.0 },
            calf: { left: 34.0, right: 34.0 },
            wrist: { left: 15.5, right: 15.5 },
            ankle: { left: 20.0, right: 20.0 }
        }
    },
    {
        id: 'gal_gadot_2017',
        name: 'Gal Gadot',
        title: 'Wonder Woman — Silueta Atlética de Superheroína (2017)',
        era: 'Hollywood 2017',
        category: 'female',
        sex: 'female',
        age: 32,
        height: 178,
        weight: 59.5,
        bodyFat: 14.5,
        measurements: {
            height: 178,
            weight: 59.5,
            bodyFat: 14.5,
            neck: 31.5,
            pecho: 86.0,
            back: 85.0,
            waist: 61.0,
            hips: 89.0,
            arm: { left: 28.0, right: 28.0 },
            forearm: { left: 23.0, right: 23.0 },
            thigh: { left: 52.0, right: 52.0 },
            calf: { left: 33.5, right: 33.5 },
            wrist: { left: 15.0, right: 15.0 },
            ankle: { left: 19.5, right: 19.5 }
        }
    },
    {
        id: 'natalie_portman_2022',
        name: 'Natalie Portman',
        title: 'Thor: Love and Thunder (The Mighty Thor) — Hipertrofia (2022)',
        era: 'Hollywood 2022',
        category: 'female',
        sex: 'female',
        age: 41,
        height: 160,
        weight: 52.5,
        bodyFat: 12.0,
        measurements: {
            height: 160,
            weight: 52.5,
            bodyFat: 12.0,
            neck: 31.5,
            pecho: 85.0,
            back: 84.0,
            waist: 60.0,
            hips: 86.0,
            arm: { left: 31.0, right: 31.0 },
            forearm: { left: 24.0, right: 24.0 },
            thigh: { left: 50.0, right: 50.0 },
            calf: { left: 33.0, right: 33.0 },
            wrist: { left: 14.5, right: 14.5 },
            ankle: { left: 19.0, right: 19.0 }
        }
    }
];

const getAvg = (val?: { left: number; right: number } | number): number => {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    const l = val.left || 0;
    const r = val.right || 0;
    return (l > 0 && r > 0) ? (l + r) / 2 : (l || r || 0);
};

export const compareAthletes = (
    profileA: ComparisonProfile,
    profileB: ComparisonProfile
): FullAthleteComparison => {
    const mA = profileA.measurements || {};
    const mB = profileB.measurements || {};

    const heightA = profileA.height || mA.height || 178;
    const heightB = profileB.height || mB.height || 178;
    const ageA = profileA.age || 28;
    const ageB = profileB.age || 26;
    const weightA = profileA.weight || mA.weight || 80;
    const weightB = profileB.weight || mB.weight || 80;
    const bfA = profileA.bodyFat ?? mA.bodyFat ?? 12.0;
    const bfB = profileB.bodyFat ?? mB.bodyFat ?? 12.0;

    const armA = getAvg(mA.arm);
    const armB = getAvg(mB.arm);
    const foreA = getAvg(mA.forearm);
    const foreB = getAvg(mB.forearm);
    const thighA = getAvg(mA.thigh);
    const thighB = getAvg(mB.thigh);
    const calfA = getAvg(mA.calf);
    const calfB = getAvg(mB.calf);
    const wristA = getAvg(mA.wrist) || 17.5;
    const wristB = getAvg(mB.wrist) || 17.5;
    const ankleA = getAvg(mA.ankle) || 22.5;
    const ankleB = getAvg(mB.ankle) || 22.5;

    const chestA = mA.pecho || 0;
    const chestB = mB.pecho || 0;
    const waistA = mA.waist || 0;
    const waistB = mB.waist || 0;
    const neckA = mA.neck || 0;
    const neckB = mB.neck || 0;

    // Body Composition & FFMI Calculations
    const ffmiResA = calculateFFMI(weightA, heightA, bfA);
    const ffmiResB = calculateFFMI(weightB, heightB, bfB);

    const leanMassA = ffmiResA?.leanMassKg || parseFloat((weightA * (1 - bfA / 100)).toFixed(1));
    const leanMassB = ffmiResB?.leanMassKg || parseFloat((weightB * (1 - bfB / 100)).toFixed(1));
    const ffmiA = ffmiResA?.normalizedFFMI || 22.0;
    const ffmiB = ffmiResB?.normalizedFFMI || 22.0;

    // Ratios
    const vTaperA = waistA > 0 ? parseFloat((chestA / waistA).toFixed(2)) : 0;
    const vTaperB = waistB > 0 ? parseFloat((chestB / waistB).toFixed(2)) : 0;

    const whtrA = heightA > 0 ? parseFloat((waistA / heightA).toFixed(2)) : 0;
    const whtrB = heightB > 0 ? parseFloat((waistB / heightB).toFixed(2)) : 0;

    const armDensityA = wristA > 0 ? parseFloat((armA / wristA).toFixed(2)) : 0;
    const armDensityB = wristB > 0 ? parseFloat((armB / wristB).toFixed(2)) : 0;

    // Proportions Analysis
    const propA = analyzeProportions(mA as BodyMeasurements);
    const propB = analyzeProportions(mB as BodyMeasurements);

    const triadScoreA = propA?.reevesTriad.symmetryScore || 0;
    const triadScoreB = propB?.reevesTriad.symmetryScore || 0;

    // Berkhan / Skeletal Limits
    const berkhanA = calculateBerkhanLimit(heightA, profileA.sex || 'male', bfA);
    const berkhanB = calculateBerkhanLimit(heightB, profileB.sex || 'male', bfB);

    const ceilingPctA = (berkhanA && berkhanA.maxWeightAtCurrentBf > 0 && weightA > 0)
        ? Math.min(100, Math.round((weightA / berkhanA.maxWeightAtCurrentBf) * 100))
        : 0;

    const ceilingPctB = (berkhanB && berkhanB.maxWeightAtCurrentBf > 0 && weightB > 0)
        ? Math.min(100, Math.round((weightB / berkhanB.maxWeightAtCurrentBf) * 100))
        : 0;

    // Skeletal Potential Chest / Biceps target check
    const skelA = calculateSkeletalPotential(wristA, ankleA, heightA, profileA.sex || 'male');
    const skelB = calculateSkeletalPotential(wristB, ankleB, heightB, profileB.sex || 'male');

    // Comprehensive Metrics List categorized
    const metrics: HeadToHeadMetric[] = [
        // --- 1. BIOMETRIC CORE & COMPOSITION ---
        {
            key: 'height',
            category: 'biometrics',
            label: 'Estatura / Altura',
            valA: heightA,
            valB: heightB,
            diff: parseFloat((heightA - heightB).toFixed(1)),
            percentDiff: heightB > 0 ? parseFloat((((heightA - heightB) / heightB) * 100).toFixed(1)) : 0,
            unit: 'cm',
            higherIsBetter: true,
            winner: heightA > heightB ? 'A' : heightA < heightB ? 'B' : 'TIE',
            insight: 'Estatura total. Mayor altura requiere mayor volumen total para misma densidad visual.'
        },
        {
            key: 'age',
            category: 'biometrics',
            label: 'Edad Cronológica',
            valA: ageA,
            valB: ageB,
            diff: ageA - ageB,
            percentDiff: ageB > 0 ? parseFloat((((ageA - ageB) / ageB) * 100).toFixed(1)) : 0,
            unit: 'años',
            higherIsBetter: false, // In training, younger has hormonal edge, older has training age
            winner: ageA < ageB ? 'A' : ageA > ageB ? 'B' : 'TIE',
            insight: 'Edad al momento del registro biométrico.'
        },
        {
            key: 'weight',
            category: 'biometrics',
            label: 'Peso Corporal Total',
            valA: weightA,
            valB: weightB,
            diff: parseFloat((weightA - weightB).toFixed(1)),
            percentDiff: weightB > 0 ? parseFloat((((weightA - weightB) / weightB) * 100).toFixed(1)) : 0,
            unit: 'kg',
            higherIsBetter: true,
            winner: weightA > weightB ? 'A' : weightA < weightB ? 'B' : 'TIE',
            insight: 'Masa corporal total en báscula.'
        },
        {
            key: 'leanMass',
            category: 'biometrics',
            label: 'Masa Libre de Grasa (Masa Magra)',
            valA: leanMassA,
            valB: leanMassB,
            diff: parseFloat((leanMassA - leanMassB).toFixed(1)),
            percentDiff: leanMassB > 0 ? parseFloat((((leanMassA - leanMassB) / leanMassB) * 100).toFixed(1)) : 0,
            unit: 'kg',
            higherIsBetter: true,
            winner: leanMassA > leanMassB ? 'A' : leanMassA < leanMassB ? 'B' : 'TIE',
            insight: 'Masa muscular y contráctil real sin tejido adiposo.'
        },
        {
            key: 'ffmi',
            category: 'biometrics',
            label: 'FFMI Normalizado (Kouri et al.)',
            valA: ffmiA,
            valB: ffmiB,
            diff: parseFloat((ffmiA - ffmiB).toFixed(1)),
            percentDiff: ffmiB > 0 ? parseFloat((((ffmiA - ffmiB) / ffmiB) * 100).toFixed(1)) : 0,
            unit: 'pts',
            higherIsBetter: true,
            winner: ffmiA > ffmiB ? 'A' : ffmiA < ffmiB ? 'B' : 'TIE',
            insight: 'Índice de masa libre de grasa ajustado a 1.80m de altura (Límite natural ~25.0).'
        },
        {
            key: 'bodyFat',
            category: 'biometrics',
            label: 'Grasa Corporal Estimada',
            valA: bfA,
            valB: bfB,
            diff: parseFloat((bfA - bfB).toFixed(1)),
            percentDiff: bfB > 0 ? parseFloat((((bfA - bfB) / bfB) * 100).toFixed(1)) : 0,
            unit: '%',
            higherIsBetter: false,
            winner: bfA < bfB && bfA > 0 ? 'A' : bfA > bfB ? 'B' : 'TIE',
            insight: 'Menor porcentaje revela mayor definición y separación muscular.'
        },

        // --- 2. RATIOS ÁUREOS & CANON ESTÉTICO ---
        {
            key: 'vTaper',
            category: 'ratios',
            label: 'Ratio V-Taper (Pecho / Cintura)',
            valA: vTaperA,
            valB: vTaperB,
            diff: parseFloat((vTaperA - vTaperB).toFixed(2)),
            percentDiff: vTaperB > 0 ? parseFloat((((vTaperA - vTaperB) / vTaperB) * 100).toFixed(1)) : 0,
            unit: 'x',
            higherIsBetter: true,
            winner: vTaperA > vTaperB ? 'A' : vTaperA < vTaperB ? 'B' : 'TIE',
            insight: 'Conicidad clásica del torso frente a cintura (Ideal clásico: 1.618x).'
        },
        {
            key: 'whtr',
            category: 'ratios',
            label: 'Ratio Cintura / Altura (WHtR)',
            valA: whtrA,
            valB: whtrB,
            diff: parseFloat((whtrA - whtrB).toFixed(2)),
            percentDiff: whtrB > 0 ? parseFloat((((whtrA - whtrB) / whtrB) * 100).toFixed(1)) : 0,
            unit: 'x',
            higherIsBetter: false,
            winner: whtrA < whtrB && whtrA > 0 ? 'A' : whtrA > whtrB ? 'B' : 'TIE',
            insight: 'Esbeltez del talle en relación a la estatura (< 0.45 óptimo estético).'
        },
        {
            key: 'triad',
            category: 'ratios',
            label: 'Simetría Tríada Steve Reeves (1:1:1)',
            valA: triadScoreA,
            valB: triadScoreB,
            diff: parseFloat((triadScoreA - triadScoreB).toFixed(0)),
            percentDiff: triadScoreB > 0 ? parseFloat((((triadScoreA - triadScoreB) / triadScoreB) * 100).toFixed(1)) : 0,
            unit: '%',
            higherIsBetter: true,
            winner: triadScoreA > triadScoreB ? 'A' : triadScoreA < triadScoreB ? 'B' : 'TIE',
            insight: 'Equilibrio de volumen idéntico entre Brazo, Cuello y Gemelo.'
        },
        {
            key: 'geneticLimit',
            category: 'ratios',
            label: '% Techo Magro Estimado (Casey Butt)',
            valA: ceilingPctA,
            valB: ceilingPctB,
            diff: parseFloat((ceilingPctA - ceilingPctB).toFixed(0)),
            percentDiff: ceilingPctB > 0 ? parseFloat((((ceilingPctA - ceilingPctB) / ceilingPctB) * 100).toFixed(1)) : 0,
            unit: '%',
            higherIsBetter: true,
            winner: ceilingPctA > ceilingPctB ? 'A' : ceilingPctA < ceilingPctB ? 'B' : 'TIE',
            insight: 'Desarrollo muscular alcanzado respecto al límite óseo natural.'
        },
        {
            key: 'armDensity',
            category: 'ratios',
            label: 'Densidad Brazo / Muñeca',
            valA: armDensityA,
            valB: armDensityB,
            diff: parseFloat((armDensityA - armDensityB).toFixed(2)),
            percentDiff: armDensityB > 0 ? parseFloat((((armDensityA - armDensityB) / armDensityB) * 100).toFixed(1)) : 0,
            unit: 'x',
            higherIsBetter: true,
            winner: armDensityA > armDensityB ? 'A' : armDensityA < armDensityB ? 'B' : 'TIE',
            insight: 'Volumen del brazo en proporción al grosor articular de la muñeca (2.5x ideal).'
        },

        // --- 3. PERÍMETROS MUSCULARES DIRECTOS ---
        {
            key: 'pecho',
            category: 'perimeters',
            label: 'Perímetro Torácico (Pecho)',
            valA: chestA,
            valB: chestB,
            diff: parseFloat((chestA - chestB).toFixed(1)),
            percentDiff: chestB > 0 ? parseFloat((((chestA - chestB) / chestB) * 100).toFixed(1)) : 0,
            unit: 'cm',
            higherIsBetter: true,
            winner: chestA > chestB ? 'A' : chestA < chestB ? 'B' : 'TIE'
        },
        {
            key: 'neck',
            category: 'perimeters',
            label: 'Cuello',
            valA: neckA,
            valB: neckB,
            diff: parseFloat((neckA - neckB).toFixed(1)),
            percentDiff: neckB > 0 ? parseFloat((((neckA - neckB) / neckB) * 100).toFixed(1)) : 0,
            unit: 'cm',
            higherIsBetter: true,
            winner: neckA > neckB ? 'A' : neckA < neckB ? 'B' : 'TIE'
        },
        {
            key: 'waist',
            category: 'perimeters',
            label: 'Perímetro de Cintura',
            valA: waistA,
            valB: waistB,
            diff: parseFloat((waistA - waistB).toFixed(1)),
            percentDiff: waistB > 0 ? parseFloat((((waistA - waistB) / waistB) * 100).toFixed(1)) : 0,
            unit: 'cm',
            higherIsBetter: false,
            winner: waistA < waistB && waistA > 0 ? 'A' : waistA > waistB ? 'B' : 'TIE',
            insight: 'Cintura más compacta crea mayor ilusión óptica de amplitud.'
        },
        {
            key: 'arm',
            category: 'perimeters',
            label: 'Brazo / Bíceps Promedio',
            valA: armA,
            valB: armB,
            diff: parseFloat((armA - armB).toFixed(1)),
            percentDiff: armB > 0 ? parseFloat((((armA - armB) / armB) * 100).toFixed(1)) : 0,
            unit: 'cm',
            higherIsBetter: true,
            winner: armA > armB ? 'A' : armA < armB ? 'B' : 'TIE'
        },
        {
            key: 'forearm',
            category: 'perimeters',
            label: 'Antebrazos',
            valA: foreA,
            valB: foreB,
            diff: parseFloat((foreA - foreB).toFixed(1)),
            percentDiff: foreB > 0 ? parseFloat((((foreA - foreB) / foreB) * 100).toFixed(1)) : 0,
            unit: 'cm',
            higherIsBetter: true,
            winner: foreA > foreB ? 'A' : foreA < foreB ? 'B' : 'TIE'
        },
        {
            key: 'thigh',
            category: 'perimeters',
            label: 'Muslos / Cuádriceps',
            valA: thighA,
            valB: thighB,
            diff: parseFloat((thighA - thighB).toFixed(1)),
            percentDiff: thighB > 0 ? parseFloat((((thighA - thighB) / thighB) * 100).toFixed(1)) : 0,
            unit: 'cm',
            higherIsBetter: true,
            winner: thighA > thighB ? 'A' : thighA < thighB ? 'B' : 'TIE'
        },
        {
            key: 'calf',
            category: 'perimeters',
            label: 'Gemelos / Pantorrillas',
            valA: calfA,
            valB: calfB,
            diff: parseFloat((calfA - calfB).toFixed(1)),
            percentDiff: calfB > 0 ? parseFloat((((calfA - calfB) / calfB) * 100).toFixed(1)) : 0,
            unit: 'cm',
            higherIsBetter: true,
            winner: calfA > calfB ? 'A' : calfA < calfB ? 'B' : 'TIE'
        },
        {
            key: 'bones',
            category: 'perimeters',
            label: 'Estructura Ósea (Muñeca / Tobillo)',
            valA: `${wristA} / ${ankleA}`,
            valB: `${wristB} / ${ankleB}`,
            diff: `${parseFloat((wristA - wristB).toFixed(1))} / ${parseFloat((ankleA - ankleB).toFixed(1))}`,
            unit: 'cm',
            winner: 'NEUTRAL',
            insight: 'Base articular ósea que determina el potencial hipertrófico natural.'
        }
    ];

    // Dual Radar Data (6 Standard Biomechanical Axes)
    const targetChestA = skelA?.chest || 120;
    const targetChestB = skelB?.chest || 120;
    const targetArmA = skelA?.biceps || 44;
    const targetArmB = skelB?.biceps || 44;

    const radarData: DualRadarPoint[] = [
        {
            aspect: 'Torso / Pecho',
            scoreA: Math.min(100, Math.round((chestA / targetChestA) * 100)),
            scoreB: Math.min(100, Math.round((chestB / targetChestB) * 100)),
            ideal: 100,
            valA: `${chestA} cm`,
            valB: `${chestB} cm`
        },
        {
            aspect: 'V-Taper',
            scoreA: Math.min(100, Math.round((vTaperA / 1.618) * 100)),
            scoreB: Math.min(100, Math.round((vTaperB / 1.618) * 100)),
            ideal: 100,
            valA: `${vTaperA}x`,
            valB: `${vTaperB}x`
        },
        {
            aspect: 'Brazos',
            scoreA: Math.min(100, Math.round((armA / targetArmA) * 100)),
            scoreB: Math.min(100, Math.round((armB / targetArmB) * 100)),
            ideal: 100,
            valA: `${armA} cm`,
            valB: `${armB} cm`
        },
        {
            aspect: 'Antebrazos',
            scoreA: Math.min(100, Math.round((foreA / (skelA?.forearms || 35)) * 100)),
            scoreB: Math.min(100, Math.round((foreB / (skelB?.forearms || 35)) * 100)),
            ideal: 100,
            valA: `${foreA} cm`,
            valB: `${foreB} cm`
        },
        {
            aspect: 'Muslos',
            scoreA: Math.min(100, Math.round((thighA / (skelA?.thighs || 65)) * 100)),
            scoreB: Math.min(100, Math.round((thighB / (skelB?.thighs || 65)) * 100)),
            ideal: 100,
            valA: `${thighA} cm`,
            valB: `${thighB} cm`
        },
        {
            aspect: 'Gemelos',
            scoreA: Math.min(100, Math.round((calfA / (skelA?.calves || 42)) * 100)),
            scoreB: Math.min(100, Math.round((calfB / (skelB?.calves || 42)) * 100)),
            ideal: 100,
            valA: `${calfA} cm`,
            valB: `${calfB} cm`
        }
    ];

    // Score tally (excluding NEUTRAL)
    let scoreA = 0;
    let scoreB = 0;
    const strengthsA: string[] = [];
    const strengthsB: string[] = [];

    metrics.forEach((m) => {
        if (m.winner === 'A') {
            scoreA += 1;
            strengthsA.push(m.label);
        } else if (m.winner === 'B') {
            scoreB += 1;
            strengthsB.push(m.label);
        }
    });

    let winner: 'A' | 'B' | 'BALANCED' = 'BALANCED';
    if (scoreA > scoreB) winner = 'A';
    else if (scoreB > scoreA) winner = 'B';

    let verdictTitle = '';
    let verdictSummary = '';

    if (winner === 'A') {
        verdictTitle = `${profileA.name} lidera el Duelo Táctico (${scoreA} vs ${scoreB})`;
        verdictSummary = `${profileA.name} muestra superioridad destacada en ${strengthsA.slice(0, 3).join(', ')}. Mantén el enfoque biomecánico para consolidar la ventaja.`;
    } else if (winner === 'B') {
        verdictTitle = `${profileB.name} lidera la Comparativa (${scoreB} vs ${scoreA})`;
        verdictSummary = `${profileB.name} presenta ventaja en ${strengthsB.slice(0, 3).join(', ')}. Enfoque prioritario en ${strengthsB.slice(0, 2).join(' y ')} para cerrar la brecha estética.`;
    } else {
        verdictTitle = 'Duelo Biomecánico Equilibrado (Empate Técnico)';
        verdictSummary = 'Ambos físicos demuestran un nivel parejo de desarrollo y proporciones equivalentes con fortalezas complementarias.';
    }

    const bioA: BioSummaryChip = {
        height: heightA,
        age: ageA,
        weight: weightA,
        bodyFat: bfA,
        leanMassKg: leanMassA,
        ffmi: ffmiA
    };

    const bioB: BioSummaryChip = {
        height: heightB,
        age: ageB,
        weight: weightB,
        bodyFat: bfB,
        leanMassKg: leanMassB,
        ffmi: ffmiB
    };

    const verdict: ComparisonVerdict = {
        winner,
        scoreA,
        scoreB,
        title: verdictTitle,
        summary: verdictSummary,
        strengthsA,
        strengthsB,
        geneticCeilingA: ceilingPctA,
        geneticCeilingB: ceilingPctB,
        vTaperA,
        vTaperB,
        triadScoreA,
        triadScoreB,
        bioA,
        bioB
    };

    return {
        athleteA: profileA,
        athleteB: profileB,
        metrics,
        radarData,
        verdict
    };
};
