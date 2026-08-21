import type { BodyMeasurements, MeasurementRecord } from '../types/measurements';

export interface SharedAthletePayload {
    name: string;
    sex: 'male' | 'female';
    date: string;
    measurements: BodyMeasurements;
    notes?: string;
    records?: MeasurementRecord[];
}

/**
 * Encodes athlete telemetry history into an ultra-compact, URL-safe Base64 string.
 * Supports multi-record chronological history (v2) with minimal payload size.
 */
export const encodeAthleteData = (
    name: string,
    latestRecord: MeasurementRecord,
    sex: 'male' | 'female' = 'male',
    records: MeasurementRecord[] = []
): string => {
    // Collect all records, guaranteeing at least latestRecord is present
    const allRecords = records.length > 0 ? [...records] : [latestRecord];
    const sorted = allRecords.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Keep up to 25 latest records for compact payload and QR code
    const limited = sorted.slice(-25);

    const serializedRecords = limited.map((r) => {
        const m = r.measurements || ({} as BodyMeasurements);
        const dateStr = r.date ? r.date.split('T')[0] : new Date().toISOString().split('T')[0];
        return [
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
            r.notes || ''
        ];
    });

    // Version 2 schema: [2, name, sexFlag (0=male, 1=female), recordsArray]
    const payload = [
        2,
        name || 'Atleta',
        sex === 'female' ? 1 : 0,
        serializedRecords
    ];

    try {
        const jsonStr = JSON.stringify(payload);
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
 * Decodes athlete telemetry payload, reconstructing full history if available.
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

        // Version 2: Multi-record chronological array format
        if (Array.isArray(parsed) && parsed[0] === 2) {
            const [_ver, name, sexFlag, rawRecords] = parsed;
            const sex: 'male' | 'female' = sexFlag === 1 ? 'female' : 'male';

            const records: MeasurementRecord[] = (rawRecords as any[]).map((arr, idx) => {
                const [
                    dateStr, height, weight, bodyFat, neck, pecho, back, waist, hips,
                    armL, armR, foreL, foreR, thighL, thighR, calfL, calfR,
                    wristL, wristR, ankleL, ankleR, notes
                ] = arr;

                return {
                    id: `shared-rec-${idx}`,
                    userId: 'shared',
                    date: `${dateStr}T00:00:00.000Z`,
                    measurements: {
                        height: Number(height) || undefined,
                        weight: Number(weight) || 0,
                        bodyFat: Number(bodyFat) || undefined,
                        neck: Number(neck) || 0,
                        pecho: Number(pecho) || 0,
                        back: Number(back) || 0,
                        waist: Number(waist) || 0,
                        hips: Number(hips) || 0,
                        arm: { left: Number(armL) || 0, right: Number(armR) || 0 },
                        forearm: { left: Number(foreL) || 0, right: Number(foreR) || 0 },
                        thigh: { left: Number(thighL) || 0, right: Number(thighR) || 0 },
                        calf: { left: Number(calfL) || 0, right: Number(calfR) || 0 },
                        wrist: { left: Number(wristL) || 0, right: Number(wristR) || 0 },
                        ankle: { left: Number(ankleL) || 0, right: Number(ankleR) || 0 }
                    },
                    notes: notes ? String(notes) : undefined
                };
            });

            const latest = records[records.length - 1] || records[0];

            return {
                name: String(name || 'Atleta'),
                sex,
                date: latest.date,
                measurements: latest.measurements,
                notes: latest.notes,
                records
            };
        }

        // Version 1: Single record array format
        if (Array.isArray(parsed) && parsed[0] === 1) {
            const [
                _ver, name, sexFlag, dateStr,
                height, weight, bodyFat, neck, pecho, back, waist, hips,
                armL, armR, foreL, foreR, thighL, thighR, calfL, calfR,
                wristL, wristR, ankleL, ankleR, notes
            ] = parsed;

            const singleRecord: MeasurementRecord = {
                id: 'shared-rec-0',
                userId: 'shared',
                date: `${dateStr}T00:00:00.000Z`,
                measurements: {
                    height: Number(height) || undefined,
                    weight: Number(weight) || 0,
                    bodyFat: Number(bodyFat) || undefined,
                    neck: Number(neck) || 0,
                    pecho: Number(pecho) || 0,
                    back: Number(back) || 0,
                    waist: Number(waist) || 0,
                    hips: Number(hips) || 0,
                    arm: { left: Number(armL) || 0, right: Number(armR) || 0 },
                    forearm: { left: Number(foreL) || 0, right: Number(foreR) || 0 },
                    thigh: { left: Number(thighL) || 0, right: Number(thighR) || 0 },
                    calf: { left: Number(calfL) || 0, right: Number(calfR) || 0 },
                    wrist: { left: Number(wristL) || 0, right: Number(wristR) || 0 },
                    ankle: { left: Number(ankleL) || 0, right: Number(ankleR) || 0 }
                },
                notes: notes ? String(notes) : undefined
            };

            return {
                name: String(name || 'Atleta'),
                sex: sexFlag === 1 ? 'female' : 'male',
                date: singleRecord.date,
                measurements: singleRecord.measurements,
                notes: singleRecord.notes,
                records: [singleRecord]
            };
        }

        // Legacy format
        if (parsed && typeof parsed === 'object') {
            const p = parsed as any;
            const singleRecord: MeasurementRecord = {
                id: 'shared-rec-legacy',
                userId: 'shared',
                date: p.date || new Date().toISOString(),
                measurements: p.measurements
            };
            return {
                name: p.name || 'Atleta',
                sex: p.sex || 'male',
                date: singleRecord.date,
                measurements: singleRecord.measurements,
                notes: p.notes,
                records: [singleRecord]
            };
        }

        return null;
    } catch (err) {
        console.error('Error decoding athlete payload:', err);
        return null;
    }
};
