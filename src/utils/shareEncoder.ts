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
 * Resolves canonical public base URL for sharing.
 * In production, always points to the dedicated standalone domain https://hypertrophyracker.alexismartyniuk.com.ar/
 */
export const getPublicShareBaseUrl = (): string => {
    if (typeof window !== 'undefined') {
        const host = window.location.host;
        if (host.includes('alexismartyniuk.com.ar')) {
            return 'https://hypertrophyracker.alexismartyniuk.com.ar/';
        }
        const baseHref = window.location.href.split('#')[0].split('?')[0];
        const cleanBase = baseHref.replace(/\/index\.html$/, '').replace(/\/+$/, '');
        return cleanBase ? `${cleanBase}/` : 'https://hypertrophyracker.alexismartyniuk.com.ar/';
    }
    return 'https://hypertrophyracker.alexismartyniuk.com.ar/';
};

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
            r.notes || '',
            m.age || 0
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
        let base64 = '';
        if (typeof TextEncoder !== 'undefined') {
            const bytes = new TextEncoder().encode(jsonStr);
            const binString = Array.from(bytes, (b) => String.fromCharCode(b)).join('');
            base64 = btoa(binString);
        } else {
            base64 = btoa(unescape(encodeURIComponent(jsonStr)));
        }
        return base64
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');
    } catch (err) {
        console.error('Error encoding athlete payload:', err);
        return '';
    }
};

/**
 * Encodes a single measurement snapshot into an ultra-compact URL string (~80-100 characters).
 * 100% self-contained without needing any database or third-party service.
 * Format: name*sexFlag*date*h_w_bf_neck_pecho_back_waist_hips_armL_armR_fArmL_fArmR_thighL_thighR_calfL_calfR_wristL_wristR_ankleL_ankleR_age
 */
export const encodeCompactSnapshot = (
    name: string,
    record: MeasurementRecord,
    sex: 'male' | 'female' = 'male'
): string => {
    const m = record.measurements || ({} as BodyMeasurements);
    const cleanName = (name || 'Atleta').replace(/[*~_]/g, ' ').trim().replace(/\s+/g, '_');
    const sexFlag = sex === 'female' ? 1 : 0;
    const dateStr = record.date ? record.date.split('T')[0] : new Date().toISOString().split('T')[0];

    const nums = [
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
        m.age || 0
    ].join('_');

    return `${cleanName}*${sexFlag}*${dateStr}*${nums}`;
};

export const decodeCompactSnapshot = (str: string): SharedAthletePayload | null => {
    if (!str) return null;
    let decodedStr = str.trim();
    try {
        decodedStr = decodeURIComponent(decodedStr);
    } catch {}
    if (decodedStr.includes('%2A') || decodedStr.includes('%2a')) {
        try {
            decodedStr = decodeURIComponent(decodedStr);
        } catch {}
    }
    if (!decodedStr.includes('*')) return null;

    const parts = decodedStr.split('*');
    if (parts.length < 3) return null;

    const name = (parts[0] || 'Atleta').replace(/_/g, ' ').trim();
    const sex: 'male' | 'female' = parts[1] === '1' ? 'female' : 'male';

    let rawEntries: string[] = [];
    if (parts.length === 4) {
        // Single snapshot: parts[2]=date, parts[3]=nums
        rawEntries = [`${parts[2]}~${parts[3]}`];
    } else if (parts.length === 3) {
        // parts[2]=date~nums or date~nums|date~nums
        rawEntries = parts[2].split('|');
    } else {
        // More than 4 parts (name*sex*date*nums*extra)
        rawEntries = [`${parts[2]}~${parts[3]}`];
    }

    const records: MeasurementRecord[] = rawEntries.map((item, idx) => {
        let dateStr = new Date().toISOString().split('T')[0];
        let numsStr = item;
        if (item.includes('~')) {
            const [d, n] = item.split('~');
            dateStr = d;
            numsStr = n;
        }
        const nums = numsStr.split('_').map(Number);
        const [
            height = 175, weight = 75, bodyFat = 15,
            neck = 0, pecho = 0, back = 0, waist = 0, hips = 0,
            armL = 0, armR = 0, foreL = 0, foreR = 0,
            thighL = 0, thighR = 0, calfL = 0, calfR = 0,
            wristL = 0, wristR = 0, ankleL = 0, ankleR = 0,
            age = 0
        ] = nums;

        return {
            id: `shared-compact-rec-${idx}`,
            userId: 'shared',
            date: dateStr.length === 10 ? `${dateStr}T12:00:00.000Z` : dateStr,
            measurements: {
                height: height > 0 ? height : undefined,
                weight: weight > 0 ? weight : 0,
                bodyFat: bodyFat > 0 ? bodyFat : undefined,
                age: age > 0 ? age : undefined,
                neck: neck > 0 ? neck : 0,
                pecho: pecho > 0 ? pecho : 0,
                back: back > 0 ? back : 0,
                waist: waist > 0 ? waist : 0,
                hips: hips > 0 ? hips : 0,
                arm: { left: armL, right: armR },
                forearm: { left: foreL, right: foreR },
                thigh: { left: thighL, right: thighR },
                calf: { left: calfL, right: calfR },
                wrist: { left: wristL, right: wristR },
                ankle: { left: ankleL, right: ankleR }
            }
        };
    });

    const latest = records[records.length - 1] || records[0];

    return {
        name,
        sex,
        date: latest.date,
        measurements: latest.measurements,
        records
    };
};

/**
 * Decodes athlete telemetry payload, reconstructing full history if available.
 */
export const decodeAthleteData = (encodedStr: string): SharedAthletePayload | null => {
    if (!encodedStr) return null;

    let cleanStr = encodedStr.trim();
    try {
        cleanStr = decodeURIComponent(cleanStr);
    } catch {}

    // Check for ultra-compact delimited format first
    if (cleanStr.includes('*') || cleanStr.includes('%2A') || cleanStr.includes('%2a')) {
        const compact = decodeCompactSnapshot(cleanStr);
        if (compact) return compact;
    }

    try {
        let base64 = decodeURIComponent(encodedStr).replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4) base64 += '=';

        let jsonStr = '';
        try {
            if (typeof TextDecoder !== 'undefined') {
                const binString = atob(base64);
                const bytes = Uint8Array.from(binString, (m) => m.charCodeAt(0));
                jsonStr = new TextDecoder().decode(bytes);
            } else {
                jsonStr = decodeURIComponent(escape(atob(base64)));
            }
        } catch {
            try {
                jsonStr = decodeURIComponent(escape(atob(base64)));
            } catch {
                jsonStr = atob(base64);
            }
        }

        const parsed = JSON.parse(jsonStr);

        // Version 2: Multi-record chronological array format
        if (Array.isArray(parsed) && parsed[0] === 2) {
            const [, name, sexFlag, rawRecords] = parsed;
            const sex: 'male' | 'female' = sexFlag === 1 ? 'female' : 'male';

            const records: MeasurementRecord[] = (rawRecords as unknown[][]).map((arr, idx) => {
                const [
                    dateStr, height, weight, bodyFat, neck, pecho, back, waist, hips,
                    armL, armR, foreL, foreR, thighL, thighR, calfL, calfR,
                    wristL, wristR, ankleL, ankleR, notes, age
                ] = arr;

                let validDate = new Date().toISOString();
                if (dateStr && typeof dateStr === 'string') {
                    const cleanDateStr = dateStr.startsWith('026') ? `2${dateStr}` : dateStr;
                    const d = new Date(cleanDateStr.length === 10 ? `${cleanDateStr}T12:00:00.000Z` : cleanDateStr);
                    if (!isNaN(d.getTime())) {
                        validDate = d.toISOString();
                    }
                }

                return {
                    id: `shared-rec-${idx}`,
                    userId: 'shared',
                    date: validDate,
                    measurements: {
                        height: Number(height) || undefined,
                        weight: Number(weight) || 0,
                        age: Number(age) > 0 ? Number(age) : undefined,
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
                , name, sexFlag, dateStr,
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
