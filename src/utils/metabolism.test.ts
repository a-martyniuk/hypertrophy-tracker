import { describe, it, expect } from 'vitest';
import { calculateBMR, calculateSessionCalories, calculateTargets } from './metabolism';

describe('Metabolism Utilities', () => {
    describe('calculateBMR', () => {
        it('should calculate correct BMR for men (Mifflin-St Jeor)', () => {
            // Male: 10*80 + 6.25*180 - 5*25 + 5 = 800 + 1125 - 125 + 5 = 1805
            const bmr = calculateBMR(80, 180, 25, 'male');
            expect(bmr).toBe(1805);
        });

        it('should calculate correct BMR for women (Mifflin-St Jeor)', () => {
            // Female: 10*60 + 6.25*165 - 5*30 - 161 = 600 + 1031.25 - 150 - 161 = 1320.25 -> ~1320
            const bmr = calculateBMR(60, 165, 30, 'female');
            expect(Math.floor(bmr)).toBe(1320);
        });
    });

    describe('calculateSessionCalories', () => {
        it('should calculate strength training calories correctly', () => {
            // 80kg * 5.0 (medium intensity) * 1 hour = 400
            const cals = calculateSessionCalories(80, 1, 'medium', 'strength');
            expect(cals).toBe(400);
        });

        it('should calculate cardio calories correctly', () => {
            // 70kg * 6.0 (medium) * 0.5 hours = 210
            const cals = calculateSessionCalories(70, 0.5, 'medium', 'cardio');
            expect(cals).toBe(210);
        });
    });

    describe('calculateTargets', () => {
        it('should generate correct surplus and deficit targets', () => {
            const maintenance = 2500;
            const targets = calculateTargets(maintenance);

            expect(targets.maintenance).toBe(2500);
            expect(targets.deficit.mild.calories).toBe(Math.round(2500 * 0.9));
            expect(targets.surplus.lean.calories).toBe(Math.round(2500 * 1.05));
        });
    });
});
