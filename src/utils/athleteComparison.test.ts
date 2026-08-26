import { describe, it, expect } from 'vitest';
import { compareAthletes, CANONICAL_PRESETS } from './athleteComparison';

describe('Athlete Comparison & Tactical Versus Engine', () => {
    it('should correctly compare two canonical presets and produce verdict', () => {
        const steveReeves = CANONICAL_PRESETS.find(p => p.id === 'steve_reeves_1950')!;
        const frankZane = CANONICAL_PRESETS.find(p => p.id === 'frank_zane_1979')!;

        expect(steveReeves).toBeDefined();
        expect(frankZane).toBeDefined();

        const comparison = compareAthletes(steveReeves, frankZane);
        expect(comparison.metrics.length).toBeGreaterThan(15);
        expect(comparison.radarData.length).toBe(6);
        expect(comparison.verdict.winner).toBeDefined();

        // Check that height, age, weight are marked as NEUTRAL
        const heightMetric = comparison.metrics.find(m => m.key === 'height')!;
        const ageMetric = comparison.metrics.find(m => m.key === 'age')!;
        const weightMetric = comparison.metrics.find(m => m.key === 'weight')!;

        expect(heightMetric.winner).toBe('NEUTRAL');
        expect(ageMetric.winner).toBe('NEUTRAL');
        expect(weightMetric.winner).toBe('NEUTRAL');

        // Check that competitive points exist
        const armMetric = comparison.metrics.find(m => m.key === 'arm')!;
        expect(armMetric.winner).toBe('A'); // Reeves (46.5cm) vs Zane (44.5cm)
    });

    it('should contain all 18 historical figures and Hollywood legends categorized', () => {
        expect(CANONICAL_PRESETS.length).toBeGreaterThanOrEqual(18);
        const categories = new Set(CANONICAL_PRESETS.map(p => p.category));
        expect(categories.has('golden')).toBe(true);
        expect(categories.has('mass')).toBe(true);
        expect(categories.has('hollywood')).toBe(true);
        expect(categories.has('lean')).toBe(true);
        expect(categories.has('modern')).toBe(true);
        expect(categories.has('female')).toBe(true);
    });
});
