import type { BodyMeasurements, MeasurementRecord } from '../types/measurements';

export interface SharedAthletePayload {
    name: string;
    sex: 'male' | 'female';
    date: string;
    measurements: BodyMeasurements;
    notes?: string;
}

export const encodeAthleteData = (
    name: string,
    record: MeasurementRecord,
    sex: 'male' | 'female' = 'male'
): string => {
    const payload: SharedAthletePayload = {
        name,
        sex,
        date: record.date,
        measurements: record.measurements,
        notes: record.notes
    };

    try {
        const jsonStr = JSON.stringify(payload);
        const encoded = btoa(encodeURIComponent(jsonStr));
        return encoded;
    } catch (err) {
        console.error('Error encoding athlete payload:', err);
        return '';
    }
};

export const decodeAthleteData = (encodedStr: string): SharedAthletePayload | null => {
    try {
        const jsonStr = decodeURIComponent(atob(encodedStr));
        return JSON.parse(jsonStr) as SharedAthletePayload;
    } catch (err) {
        console.error('Error decoding athlete payload:', err);
        return null;
    }
};
