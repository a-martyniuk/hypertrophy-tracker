import { describe, it, expect } from 'vitest';
import { encodeCompactSnapshot, decodeCompactSnapshot, decodeAthleteData } from './shareEncoder';
import type { MeasurementRecord } from '../types/measurements';

describe('shareEncoder - Compact Snapshot', () => {
    const sampleRecord: MeasurementRecord = {
        id: 'rec-1',
        userId: 'u-1',
        date: '2026-08-27',
        measurements: {
            height: 191,
            weight: 104,
            bodyFat: 20,
            age: 38,
            neck: 43,
            pecho: 115,
            back: 133,
            waist: 97,
            hips: 96,
            arm: { left: 44.5, right: 45 },
            forearm: { left: 33, right: 33 },
            thigh: { left: 65, right: 66 },
            calf: { left: 41, right: 41 },
            wrist: { left: 18, right: 18 },
            ankle: { left: 22.5, right: 22.5 }
        }
    };

    it('encodes compact snapshot into short delimited string', () => {
        const compact = encodeCompactSnapshot('Alexis Martyniuk', sampleRecord, 'male');
        expect(compact).toContain('Alexis_Martyniuk*0*2026-08-27*');
        expect(compact.length).toBeLessThan(120);
    });

    it('decodes compact snapshot accurately', () => {
        const compact = encodeCompactSnapshot('Alexis Martyniuk', sampleRecord, 'male');
        const decoded = decodeCompactSnapshot(compact);

        expect(decoded).not.toBeNull();
        expect(decoded?.name).toBe('Alexis Martyniuk');
        expect(decoded?.sex).toBe('male');
        expect(decoded?.measurements.height).toBe(191);
        expect(decoded?.measurements.weight).toBe(104);
        expect(decoded?.measurements.pecho).toBe(115);
        expect(decoded?.measurements.arm.left).toBe(44.5);
        expect(decoded?.measurements.arm.right).toBe(45);
        expect(decoded?.records?.length).toBe(1);
    });

    it('decodeAthleteData transparently parses compact strings', () => {
        const compact = encodeCompactSnapshot('Alexis Martyniuk', sampleRecord, 'male');
        const decoded = decodeAthleteData(compact);

        expect(decoded).not.toBeNull();
        expect(decoded?.name).toBe('Alexis Martyniuk');
        expect(decoded?.measurements.weight).toBe(104);
    });

    it('decodes user exact compact string', () => {
        const userStr = 'Alexis_Martyniuk*0*2026-08-27*191_103.3_20_43_115_133_97_96_44.5_45_33_33_65_66_41_41_18_18_22.5_22_38';
        const decoded = decodeAthleteData(userStr);

        expect(decoded).not.toBeNull();
        expect(decoded?.name).toBe('Alexis Martyniuk');
        expect(decoded?.measurements.weight).toBe(103.3);
        expect(decoded?.measurements.height).toBe(191);
        expect(decoded?.measurements.arm.left).toBe(44.5);
    });

    it('decodes URI-encoded compact string with %2A asterisk representation', () => {
        const userStrEncoded = 'Alexis_Martyniuk%2A0%2A2026-08-27%2A191_103.3_20_43_115_133_97_96_44.5_45_33_33_65_66_41_41_18_18_22.5_22_38';
        const decoded = decodeAthleteData(userStrEncoded);

        expect(decoded).not.toBeNull();
        expect(decoded?.name).toBe('Alexis Martyniuk');
        expect(decoded?.measurements.weight).toBe(103.3);
        expect(decoded?.measurements.pecho).toBe(115);
    });
});
