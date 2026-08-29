import { describe, it, expect } from 'vitest';
import { calculateGeneticTrajectory } from './geneticTrajectory';

describe('calculateGeneticTrajectory', () => {
    it('calculates trajectory correctly for intermediate male athlete', () => {
        const result = calculateGeneticTrajectory(104, 191, 18.5, 'male', 3);
        expect(result.currentLeanMassKg).toBeGreaterThan(80);
        expect(result.maxNaturalLeanMassKg).toBeGreaterThan(80);
        expect(result.currentPotentialPercent).toBeGreaterThan(80);
        expect(result.milestones.length).toBe(5);
        expect(result.milestones.some(m => m.percent === 100)).toBe(true);
    });

    it('identifies beginner vs elite correctly', () => {
        const beginner = calculateGeneticTrajectory(70, 180, 20, 'male', 0.5);
        expect(beginner.trainingExperienceLevel).toBe('beginner');
        expect(beginner.monthlyGainRateKg).toBeGreaterThanOrEqual(0.8);

        const advanced = calculateGeneticTrajectory(85, 178, 8, 'male', 7);
        expect(advanced.trainingExperienceLevel).toBe('elite');
        expect(advanced.monthlyGainRateKg).toBeLessThanOrEqual(0.15);
    });
});
