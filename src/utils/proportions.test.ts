import { describe, it, expect } from 'vitest';
import { analyzeProportions } from './proportions';
import type { BodyMeasurements } from '../types/measurements';

describe('Proportions & Aesthetics Utilities', () => {
    it('should calculate Steve Reeves Triad symmetry and Adonis Index', () => {
        const mockMeasurements: BodyMeasurements = {
            weight: 80,
            height: 180,
            bodyFat: 10,
            neck: 40,
            pecho: 120,
            back: 115,
            waist: 75,
            hips: 95,
            arm: { left: 40, right: 40 },
            forearm: { left: 32, right: 32 },
            wrist: { left: 18, right: 18 },
            thigh: { left: 60, right: 60 },
            calf: { left: 40, right: 40 },
            ankle: { left: 23, right: 23 }
        };

        const result = analyzeProportions(mockMeasurements);
        expect(result).not.toBeNull();
        expect(result!.reevesTriad.armAvg).toBe(40);
        expect(result!.reevesTriad.neck).toBe(40);
        expect(result!.reevesTriad.calfAvg).toBe(40);
        expect(result!.reevesTriad.symmetryScore).toBe(100);

        expect(result!.adonisIndex.chestWaistRatio).toBe(1.6);
        expect(result!.adonisIndex.ratioScore).toBeGreaterThan(95);
    });

    it('should detect notable bilateral asymmetries', () => {
        const asymmetricMeasurements: BodyMeasurements = {
            weight: 80,
            height: 180,
            bodyFat: 10,
            neck: 40,
            pecho: 110,
            back: 100,
            waist: 80,
            hips: 95,
            arm: { left: 38, right: 40 }, // 2.0 cm difference
            forearm: { left: 32, right: 32 },
            wrist: { left: 18, right: 18 },
            thigh: { left: 60, right: 60 },
            calf: { left: 40, right: 40 },
            ankle: { left: 23, right: 23 }
        };

        const result = analyzeProportions(asymmetricMeasurements);
        const armAsymmetry = result!.asymmetries.find(a => a.group === 'arm');
        expect(armAsymmetry).toBeDefined();
        expect(armAsymmetry!.diff).toBe(2.0);
        expect(armAsymmetry!.severity).toBe('notable');
        expect(armAsymmetry!.largerSide).toBe('right');
    });

    it('should return null when no measurements are passed', () => {
        expect(analyzeProportions(undefined)).toBeNull();
    });
});
