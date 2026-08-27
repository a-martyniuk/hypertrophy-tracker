import {
    collection,
    doc,
    getDocs,
    setDoc,
    query,
    orderBy,
    limit
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import type { BodyMeasurements, MeasurementRecord } from '../types/measurements';
import type { ComparisonProfile } from '../utils/athleteComparison';

export const DEFAULT_COMMUNITY_ATHLETES: ComparisonProfile[] = [
    {
        id: 'comm_lucas_v',
        name: 'Lucas V.',
        title: 'Atleta Intermedio (Powerbuilder)',
        era: 'Comunidad (84.0 kg)',
        sex: 'male',
        age: 26,
        height: 180,
        weight: 84.0,
        bodyFat: 12.0,
        date: '2026-08-18',
        measurements: {
            height: 180,
            weight: 84.0,
            bodyFat: 12.0,
            neck: 41.0,
            pecho: 116.0,
            back: 118.5,
            waist: 81.0,
            hips: 99.0,
            arm: { left: 42.0, right: 42.5 },
            forearm: { left: 33.5, right: 34.0 },
            thigh: { left: 63.0, right: 63.5 },
            calf: { left: 40.0, right: 40.5 },
            wrist: { left: 17.5, right: 17.5 },
            ankle: { left: 22.5, right: 22.5 }
        }
    },
    {
        id: 'comm_martin_g',
        name: 'Martín G.',
        title: 'Atleta Avanzado (Recomposición Táctica)',
        era: 'Comunidad (79.5 kg)',
        sex: 'male',
        age: 29,
        height: 174,
        weight: 79.5,
        bodyFat: 10.2,
        date: '2026-08-12',
        measurements: {
            height: 174,
            weight: 79.5,
            bodyFat: 10.2,
            neck: 40.5,
            pecho: 113.0,
            back: 114.0,
            waist: 77.0,
            hips: 96.0,
            arm: { left: 41.0, right: 41.2 },
            forearm: { left: 33.0, right: 33.2 },
            thigh: { left: 61.0, right: 61.5 },
            calf: { left: 39.0, right: 39.2 },
            wrist: { left: 17.0, right: 17.0 },
            ankle: { left: 22.0, right: 22.0 }
        }
    },
    {
        id: 'comm_rodrigo_m',
        name: 'Rodrigo M.',
        title: 'Hipertrofia Clásica (V-Taper Dominante)',
        era: 'Comunidad (81.2 kg)',
        sex: 'male',
        age: 27,
        height: 177,
        weight: 81.2,
        bodyFat: 11.5,
        date: '2026-08-05',
        measurements: {
            height: 177,
            weight: 81.2,
            bodyFat: 11.5,
            neck: 41.5,
            pecho: 118.0,
            back: 120.0,
            waist: 78.5,
            hips: 97.0,
            arm: { left: 42.5, right: 43.0 },
            forearm: { left: 34.0, right: 34.5 },
            thigh: { left: 62.0, right: 62.5 },
            calf: { left: 39.5, right: 40.0 },
            wrist: { left: 17.5, right: 17.5 },
            ankle: { left: 22.5, right: 22.5 }
        }
    },
    {
        id: 'comm_carla_s',
        name: 'Carla S.',
        title: 'Atleta Femenina (Aesthetic & Glúteos)',
        era: 'Comunidad (58.5 kg)',
        sex: 'female',
        age: 25,
        height: 165,
        weight: 58.5,
        bodyFat: 18.5,
        date: '2026-08-15',
        measurements: {
            height: 165,
            weight: 58.5,
            bodyFat: 18.5,
            neck: 32.5,
            pecho: 91.0,
            back: 92.0,
            waist: 64.0,
            hips: 98.5,
            arm: { left: 29.5, right: 29.5 },
            forearm: { left: 24.0, right: 24.0 },
            thigh: { left: 56.5, right: 57.0 },
            calf: { left: 35.0, right: 35.0 },
            wrist: { left: 14.5, right: 14.5 },
            ankle: { left: 19.5, right: 19.5 }
        }
    },
    {
        id: 'comm_gonzalo_b',
        name: 'Gonzalo B.',
        title: 'Volumen Limpio & Fuerza',
        era: 'Comunidad (86.0 kg)',
        sex: 'male',
        age: 31,
        height: 182,
        weight: 86.0,
        bodyFat: 13.5,
        date: '2026-07-28',
        measurements: {
            height: 182,
            weight: 86.0,
            bodyFat: 13.5,
            neck: 42.0,
            pecho: 120.0,
            back: 122.0,
            waist: 83.0,
            hips: 101.0,
            arm: { left: 43.0, right: 43.5 },
            forearm: { left: 34.5, right: 35.0 },
            thigh: { left: 65.0, right: 65.5 },
            calf: { left: 41.0, right: 41.5 },
            wrist: { left: 18.0, right: 18.0 },
            ankle: { left: 23.0, right: 23.0 }
        }
    }
];

/**
 * Fetches all real public community athletes from Firestore.
 */
export const fetchCommunityAthletes = async (currentUserId?: string): Promise<ComparisonProfile[]> => {
    if (!isFirebaseConfigured) {
        return [];
    }

    try {
        const communityRef = collection(db, 'community_athletes');
        const q = query(communityRef, orderBy('updatedAt', 'desc'), limit(50));
        const snapshot = await getDocs(q);

        const cloudAthletes: ComparisonProfile[] = [];
        snapshot.forEach((d) => {
            const data = d.data();
            const athleteId = d.id;
            if (data && data.measurements && athleteId !== currentUserId) {
                const dateStr = data.date ? new Date(data.date).toLocaleDateString() : 'Activo';
                const weightStr = data.measurements.weight ? `${data.measurements.weight} kg` : '';
                const h = data.height || data.measurements.height || 178;
                const w = data.weight || data.measurements.weight || 80;
                const age = data.age || data.measurements.age || 25;

                cloudAthletes.push({
                    id: `cloud_${athleteId}`,
                    name: data.name || 'Atleta de la Comunidad',
                    title: `${h} cm · ${w} kg · ${age} años`,
                    era: weightStr ? `${weightStr} (${dateStr})` : dateStr,
                    category: 'community',
                    sex: data.sex || 'male',
                    age,
                    height: h,
                    weight: w,
                    bodyFat: data.bodyFat ?? data.measurements.bodyFat ?? 12,
                    date: data.date,
                    measurements: data.measurements as Partial<BodyMeasurements>
                });
            }
        });

        return cloudAthletes;
    } catch (err) {
        console.error('[communityAthleteService] Error al obtener atletas de la comunidad:', err);
        return [];
    }
};

/**
 * Publishes/updates the current athlete telemetry in the public community collection.
 */
export const publishCommunityAthlete = async (
    userId: string,
    name: string,
    sex: 'male' | 'female',
    latestRecord: MeasurementRecord,
    age?: number
): Promise<void> => {
    if (!isFirebaseConfigured || !userId || userId === 'guest' || !latestRecord) return;

    try {
        const athleteRef = doc(db, 'community_athletes', userId);
        const weight = latestRecord.measurements?.weight;
        const height = latestRecord.measurements?.height;
        const bodyFat = latestRecord.measurements?.bodyFat;
        const resolvedAge = latestRecord.measurements?.age || age || 25;
        const cleanName = (name && name !== 'User' && name !== 'guest') ? name : 'Atleta Registrado';

        const payload = {
            id: userId,
            name: cleanName,
            title: `${height || 178} cm · ${weight || 80} kg · ${resolvedAge} años`,
            era: weight ? `${weight} kg` : 'Comunidad',
            sex: sex || 'male',
            age: resolvedAge,
            height: height || 178,
            weight: weight || 80,
            bodyFat: bodyFat ?? 12,
            date: latestRecord.date,
            measurements: latestRecord.measurements || {},
            updatedAt: new Date().toISOString()
        };

        await setDoc(athleteRef, payload, { merge: true });
    } catch (err) {
        console.error('[communityAthleteService] Error al publicar atleta en comunidad:', err);
    }
};
