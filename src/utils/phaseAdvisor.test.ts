import { describe, it, expect } from 'vitest';
import { calculatePhaseRecommendation } from './phaseAdvisor';

describe('calculatePhaseRecommendation', () => {
    it('recommends cut/deficit when body fat is high (>17% in men)', () => {
        const result = calculatePhaseRecommendation(100, 180, 22, 'male', 28);
        expect(result.phase).toBe('cut');
        expect(result.recommendedCaloricDelta).toBeLessThan(0);
        expect(result.badgeColor).toBe('red');
        expect(result.proteinGramsPerKg).toBeGreaterThanOrEqual(2.2);
    });

    it('recommends surplus/bulk when body fat is low (<12% in men)', () => {
        const result = calculatePhaseRecommendation(75, 180, 10, 'male', 25, 21);
        expect(result.phase).toBe('bulk');
        expect(result.recommendedCaloricDelta).toBeGreaterThan(0);
        expect(result.badgeColor).toBe('green');
    });

    it('recommends recomp/maintenance when in sweet spot (12-16% in men)', () => {
        const result = calculatePhaseRecommendation(80, 180, 14, 'male', 27);
        expect(result.phase).toBe('recomp');
        expect(result.badgeColor).toBe('blue');
    });
});
