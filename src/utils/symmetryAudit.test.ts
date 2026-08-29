import { describe, it, expect } from 'vitest';
import { calculateBilateralSymmetry } from './symmetryAudit';

describe('calculateBilateralSymmetry', () => {
    it('returns high score for symmetric measurements', () => {
        const result = calculateBilateralSymmetry({
            arm: { left: 44.5, right: 44.8 },
            forearm: { left: 34.5, right: 35.0 },
            thigh: { left: 66.5, right: 67.0 },
            calf: { left: 41.0, right: 41.0 }
        });

        expect(result.overallScore).toBeGreaterThanOrEqual(95);
        expect(result.overallStatus).toBe('excellent');
        expect(result.criticalAsymmetryCount).toBe(0);
        expect(result.limbs.length).toBe(4);
    });

    it('triggers critical alert if asymmetry exceeds 4.5%', () => {
        const result = calculateBilateralSymmetry({
            arm: { left: 45.0, right: 41.0 }, // ~8.8% diff
            thigh: { left: 65.0, right: 65.0 }
        });

        expect(result.criticalAsymmetryCount).toBeGreaterThan(0);
        const armLimb = result.limbs.find(l => l.key === 'arm');
        expect(armLimb?.status).toBe('critical_asymmetry');
        expect(armLimb?.recommendation).toContain('Asimetría >4.5% detectada');
    });
});
