import type { MeasurementRecord, UserProfile } from '../types/measurements';

export const CANONICAL_INITIAL_PROFILE: UserProfile = {
    id: 'guest',
    name: 'Alexis Martyniuk',
    sex: 'male',
    age: 38,
    height: 191,
    weight: 104,
    baseline: {
        wrist: 17.5,
        ankle: 22.5,
        knee: 39
    }
};

export const CANONICAL_INITIAL_RECORDS: MeasurementRecord[] = [
    {
        id: "50f49768-709d-4acb-88de-db8c88afc4e1",
        userId: "wstVVGtWHGd0ojPH3fi0odYz9Ul2",
        date: "2026-08-20T03:00:00.000Z",
        measurements: {
            weight: 104,
            height: 191,
            age: 38,
            bodyFat: 20,
            neck: 43,
            back: 130,
            pecho: 117,
            waist: 95,
            hips: 97,
            arm: {
                left: 43,
                right: 43
            },
            forearm: {
                left: 33,
                right: 33
            },
            wrist: {
                left: 17,
                right: 17
            },
            thigh: {
                left: 64,
                right: 64
            },
            calf: {
                left: 41,
                right: 41
            },
            ankle: {
                left: 22,
                right: 22
            }
        },
        notes: "Línea base registrada (20/08/2026)",
        metadata: {
            condition: "rest_day",
            sleepHours: 8
        }
    }
];
