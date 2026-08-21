import type { BodyMeasurements, MeasurementRecord } from '../types/measurements';

export interface SharedAthletePayload {
    name: string;
    sex: 'male' | 'female';
    date: string;
    measurements: BodyMeasurements;
    notes?: string;
}

/**
 * Encodes athlete telemetry into an ultra-compact, URL-safe Base64 string.
 * Reduces QR code matrix density by >80% for instant mobile camera scanning.
 */
export const encodeAthleteData = (
    name: string,
    record: MeasurementRecord,
    sex: 'male' | 'female' = 'male'
): string => {
    const m = record.measurements || ({} as BodyMeasurements);
    const dateStr = record.date ? record.date.split('T')[0] : new Date().toISOString().split('T')[0];

    // Compact positional schema (v1)
    const compact = [
        1, // Version flag
        name || 'Atleta',
        sex === 'female' ? 1 : 0,
        dateStr,
        m.height || 0,
        m.weight || 0,
        m.bodyFat || 0,
        m.neck || 0,
        m.pecho || 0,
        m.back || 0,
        m.waist || 0,
        m.hips || 0,
        m.arm?.left || 0,
        m.arm?.right || 0,
        m.forearm?.left || 0,
        m.forearm?.right || 0,
        m.thigh?.left || 0,
        m.thigh?.right || 0,
        m.calf?.left || 0,
        m.calf?.right || 0,
        m.wrist?.left || 0,
        m.wrist?.right || 0,
        m.ankle?.left || 0,
        m.ankle?.right || 0,
        record.notes || ''
    ];

    try {
        const jsonStr = JSON.stringify(compact);
        return btoa(unescape(encodeURIComponent(jsonStr)))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
    } catch (err) {
        console.error('Error encoding athlete payload:', err);
        return '';
    }
};

/**
 * Decodes compact or legacy athlete telemetry payload safely.
 */
export const decodeAthleteData = (encodedStr: string): SharedAthletePayload | null => {
    if (!encodedStr) return null;

    try {
        let base64 = decodeURIComponent(encodedStr).replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4) base64 += '=';

        let jsonStr = '';
        try {
            jsonStr = decodeURIComponent(escape(atob(base64)));
        } catch {
            jsonStr = atob(base64);
        }

        const parsed = JSON.parse(jsonStr);

        // Compact array format (v1)
        if (Array.isArray(parsed) && parsed[0] === 1) {
            const [
                _ver, name, sexFlag, dateStr,
                height, weight, bodyFat, neck, pecho, back, waist, hips,
                armL, armR, foreL, foreR, thighL, thighR, calfL, calfR,
                wristL, wristR, ankleL, ankleR, notes
            ] = parsed;

            return {
                name: String(name || 'Atleta'),
                sex: sexFlag === 1 ? 'female' : 'male',
                date: `${dateStr}T00:00:00.000Z`,
                measurements: {
                    height: Number(height) || undefined,
                    weight: Number(weight) || 0,
                    bodyFat: Number(bodyFat) || undefined,
                    neck: Number(neck) || undefined,
                    pecho: Number(pecho) || undefined,
                    back: Number(back) || undefined,
                    waist: Number(waist) || 0,
                    hips: Number(hips) || undefined,
                    arm: { left: Number(armL) || 0, right: Number(armR) || 0 },
                    forearm: { left: Number(foreL) || 0, right: Number(foreR) || 0 },
                    thigh: { left: Number(thighL) || 0, right: Number(thighR) || 0 },
                    calf: { left: Number(calfL) || 0, right: Number(calfR) || 0 },
                    wrist: { left: Number(wristL) || 0, right: Number(wristR) || 0 },
                    ankle: { left: Number(ankleL) || 0, right: Number(ankleR) || 0 }
                },
                notes: notes ? String(notes) : undefined
            };
        }

        // Backwards compatibility with raw JSON objects
        if (parsed && typeof parsed === 'object') {
            return parsed as SharedAthletePayload;
        }

        return null;
    } catch (err) {
        console.error('Error decoding athlete payload:', err);
        return null;
    }
};
