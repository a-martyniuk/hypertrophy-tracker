import { describe, it, expect } from 'vitest';
import {
    calculateSkeletalPotential,
    calculateIEO,
    calculateFFMI,
    calculateBerkhanLimit,
    calculateHelmsGainRates
} from './skeletal';

describe('Skeletal & Physiological Model Utilities', () => {
    describe('calculateSkeletalPotential (Casey Butt Model)', () => {
        it('should calculate realistic maximum muscular potentials for standard male frame', () => {
            const pot = calculateSkeletalPotential(18, 23, 180, 'male');
            expect(pot.chest).toBeGreaterThan(115);
            expect(pot.biceps).toBeGreaterThan(42);
            expect(pot.biceps).toBeLessThan(55);
            expect(pot.thighs).toBeGreaterThan(60);
            expect(pot.calves).toBeGreaterThan(38);
        });

        it('should apply female modifiers accurately', () => {
            const potMale = calculateSkeletalPotential(16, 21, 165, 'male');
            const potFemale = calculateSkeletalPotential(16, 21, 165, 'female');

            expect(potFemale.biceps).toBeCloseTo(potMale.biceps * 0.70, 0);
            expect(potFemale.chest).toBeCloseTo(potMale.chest * 0.85, 0);
        });
    });

    describe('calculateIEO (Bone Structure Index)', () => {
        it('should classify bone structure into standard categories', () => {
            const smallMale = calculateIEO(15.5, 18.5, 'male'); // 17.0 < 18
            expect(smallMale.label).toBe('small');
            expect(smallMale.isAdvantage).toBe(false);

            const largeMale = calculateIEO(19.0, 24.0, 'male'); // 21.5 >= 20
            expect(largeMale.label).toBe('large');
            expect(largeMale.isAdvantage).toBe(true);

            const veryLargeMale = calculateIEO(20.5, 24.5, 'male'); // 22.5 >= 22
            expect(veryLargeMale.label).toBe('very_large');
            expect(veryLargeMale.isAdvantage).toBe(true);
        });
    });

    describe('calculateFFMI (Kouri et al. Formula)', () => {
        it('should calculate normalized FFMI correctly', () => {
            const result = calculateFFMI(80, 180, 10);
            expect(result).not.toBeNull();
            expect(result!.leanMassKg).toBe(72);
            expect(result!.normalizedFFMI).toBe(22.2);
            expect(result!.categoryKey).toBe('advanced');
        });

        it('should return null for invalid/zero weight or height', () => {
            expect(calculateFFMI(0, 180, 15)).toBeNull();
            expect(calculateFFMI(80, 0, 15)).toBeNull();
        });
    });

    describe('calculateBerkhanLimit (Martin Berkhan Model)', () => {
        it('should calculate max lean stage weight and body fat projections', () => {
            const res = calculateBerkhanLimit(180, 'male', 15);
            expect(res.maxWeightAtCompBf).toBe(80);
            expect(res.maxLeanWeightKg).toBe(76);
            expect(res.maxWeightAtCurrentBf).toBeCloseTo(89.4, 0);
        });
    });

    describe('calculateHelmsGainRates (Eric Helms Model)', () => {
        it('should return monthly and annual gain rates for athlete weight', () => {
            const rates = calculateHelmsGainRates(80);
            expect(rates.beginner.minKgMonth).toBeGreaterThan(0.5);
            expect(rates.advanced.maxKgMonth).toBeLessThan(0.5);
        });
    });
});
