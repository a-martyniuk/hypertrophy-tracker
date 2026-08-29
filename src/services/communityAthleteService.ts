import {
    collection,
    doc,
    getDocs,
    setDoc,
    deleteDoc
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import type { BodyMeasurements, MeasurementRecord } from '../types/measurements';
import type { ComparisonProfile } from '../utils/athleteComparison';

export const VERIFIED_COMMUNITY_ATHLETES: ComparisonProfile[] = [
    {
        id: 'community_alexis_m',
        name: 'Alexis Martyniuk (Coach & Creador)',
        title: '191 cm · 104 kg · 38 años',
        era: '104 kg (Auditado)',
        category: 'community',
        sex: 'male',
        age: 38,
        height: 191,
        weight: 104,
        bodyFat: 18.5,
        measurements: {
            height: 191,
            weight: 104,
            age: 38,
            bodyFat: 18.5,
            neck: 43.0,
            pecho: 124.0,
            back: 126.0,
            waist: 88.0,
            hips: 106.0,
            arm: { left: 44.5, right: 44.8 },
            forearm: { left: 34.5, right: 35.0 },
            wrist: { left: 17.5, right: 17.5 },
            thigh: { left: 66.5, right: 67.0 },
            calf: { left: 40.8, right: 41.2 },
            ankle: { left: 22.5, right: 22.5 }
        }
    },
    {
        id: 'community_natural_advanced',
        name: 'Mateo R. (Atleta Natural Avanzado)',
        title: '178 cm · 82 kg · 29 años',
        era: '82 kg (Comunidad Verificada)',
        category: 'community',
        sex: 'male',
        age: 29,
        height: 178,
        weight: 82,
        bodyFat: 13.5,
        measurements: {
            height: 178,
            weight: 82,
            age: 29,
            bodyFat: 13.5,
            neck: 41.0,
            pecho: 114.0,
            back: 116.0,
            waist: 79.0,
            hips: 97.0,
            arm: { left: 41.5, right: 42.0 },
            forearm: { left: 32.5, right: 33.0 },
            wrist: { left: 17.5, right: 17.5 },
            thigh: { left: 62.0, right: 62.5 },
            calf: { left: 39.0, right: 39.5 },
            ankle: { left: 22.5, right: 22.5 }
        }
    },
    {
        id: 'community_natural_intermediate',
        name: 'Lucas V. (Atleta Natural Intermedio)',
        title: '175 cm · 74 kg · 25 años',
        era: '74 kg (Comunidad Verificada)',
        category: 'community',
        sex: 'male',
        age: 25,
        height: 175,
        weight: 74,
        bodyFat: 14.8,
        measurements: {
            height: 175,
            weight: 74,
            age: 25,
            bodyFat: 14.8,
            neck: 39.0,
            pecho: 104.0,
            back: 106.0,
            waist: 78.0,
            hips: 95.0,
            arm: { left: 38.0, right: 38.5 },
            forearm: { left: 30.0, right: 30.5 },
            wrist: { left: 17.0, right: 17.0 },
            thigh: { left: 57.5, right: 58.0 },
            calf: { left: 37.0, right: 37.5 },
            ankle: { left: 22.0, right: 22.0 }
        }
    },
    {
        id: 'community_female_fitness',
        name: 'Valeria M. (Atleta Fitness Natural)',
        title: '166 cm · 59 kg · 27 años',
        era: '59 kg (Comunidad Verificada)',
        category: 'community',
        sex: 'female',
        age: 27,
        height: 166,
        weight: 59,
        bodyFat: 19.5,
        measurements: {
            height: 166,
            weight: 59,
            age: 27,
            bodyFat: 19.5,
            neck: 33.0,
            pecho: 91.0,
            back: 92.0,
            waist: 65.0,
            hips: 96.0,
            arm: { left: 31.0, right: 31.5 },
            forearm: { left: 24.5, right: 25.0 },
            wrist: { left: 15.0, right: 15.0 },
            thigh: { left: 56.5, right: 57.0 },
            calf: { left: 35.5, right: 36.0 },
            ankle: { left: 20.0, right: 20.0 }
        }
    }
];

/**
 * Fetches all real public community athletes from Firestore, augmented with verified community benchmarks.
 */
export const fetchCommunityAthletes = async (currentUserId?: string): Promise<ComparisonProfile[]> => {
    const verifiedList = VERIFIED_COMMUNITY_ATHLETES.filter(a => a.id !== `cloud_${currentUserId}`);

    if (!isFirebaseConfigured) {
        return verifiedList;
    }

    try {
        const communityRef = collection(db, 'community_athletes');
        const snapshot = await getDocs(communityRef);

        const cloudAthletes: ComparisonProfile[] = [];
        snapshot.forEach((d) => {
            const data = d.data();
            const athleteId = d.id;
            // Only include athletes who are public (isPublic !== false) and not the current user
            if (data && data.measurements && athleteId !== currentUserId && data.isPublic !== false) {
                const athleteSex: 'male' | 'female' = data.sex || 'male';
                const dateStr = data.date ? new Date(data.date).toLocaleDateString() : 'Activo';
                const weightStr = data.measurements.weight ? `${data.measurements.weight} kg` : '';
                const h = data.height || data.measurements.height || (athleteSex === 'female' ? 165 : 178);
                const w = data.weight || data.measurements.weight || (athleteSex === 'female' ? 60 : 78);
                const age = data.age || data.measurements.age || 28;
                const displayName = data.publicAlias || data.name || 'Atleta de la Comunidad';

                cloudAthletes.push({
                    id: `cloud_${athleteId}`,
                    name: displayName,
                    title: `${h} cm · ${w} kg · ${age} años`,
                    era: weightStr ? `${weightStr} (${dateStr})` : dateStr,
                    category: 'community',
                    sex: athleteSex,
                    age,
                    height: h,
                    weight: w,
                    bodyFat: data.bodyFat ?? data.measurements.bodyFat ?? (athleteSex === 'female' ? 22 : 15),
                    date: data.date,
                    measurements: data.measurements as Partial<BodyMeasurements>
                });
            }
        });

        // Merge live cloud athletes with verified community athletes, avoiding duplicates
        const allCommunity = [...cloudAthletes, ...verifiedList.filter(v => !cloudAthletes.some(c => c.name === v.name))];

        return allCommunity;
    } catch (err) {
        // Graceful fallback to verified community benchmarks when unauthenticated or offline
        console.warn('[communityAthleteService] Acceso anónimo o sin permisos a atletas cloud. Usando atletas comunitarios base.');
        return verifiedList;
    }
};

/**
 * Publishes/updates the current athlete telemetry in the public community collection, or removes if private.
 */
export const publishCommunityAthlete = async (
    userId: string,
    name: string,
    sex: 'male' | 'female',
    latestRecord: MeasurementRecord,
    age?: number,
    isPublic: boolean = true,
    publicAlias?: string
): Promise<void> => {
    if (!isFirebaseConfigured || !userId || userId === 'guest' || !latestRecord) return;

    try {
        const athleteRef = doc(db, 'community_athletes', userId);

        if (!isPublic) {
            // Privacy first: delete from public directory immediately
            await deleteDoc(athleteRef);
            return;
        }

        const weight = latestRecord.measurements?.weight;
        const height = latestRecord.measurements?.height;
        const bodyFat = latestRecord.measurements?.bodyFat;
        const resolvedAge = latestRecord.measurements?.age || age || 28;
        const cleanName = publicAlias?.trim() || ((name && name !== 'User' && name !== 'guest') ? name : 'Atleta Registrado');
        const defaultHeight = sex === 'female' ? 165 : 178;
        const defaultWeight = sex === 'female' ? 60 : 78;
        const defaultBodyFat = sex === 'female' ? 22 : 15;

        const payload = {
            id: userId,
            name: cleanName,
            publicAlias: publicAlias?.trim() || null,
            title: `${height || defaultHeight} cm · ${weight || defaultWeight} kg · ${resolvedAge} años`,
            era: weight ? `${weight} kg` : 'Comunidad',
            sex: sex || 'male',
            age: resolvedAge,
            height: height || defaultHeight,
            weight: weight || defaultWeight,
            bodyFat: bodyFat ?? defaultBodyFat,
            isPublic: true,
            date: latestRecord.date,
            measurements: latestRecord.measurements || {},
            updatedAt: new Date().toISOString()
        };

        await setDoc(athleteRef, payload, { merge: true });
    } catch (err) {
        console.error('[communityAthleteService] Error al publicar atleta en comunidad:', err);
    }
};

/**
 * Removes the athlete document from the public community collection.
 */
export const removeCommunityAthlete = async (userId: string): Promise<void> => {
    if (!isFirebaseConfigured || !userId || userId === 'guest') return;
    try {
        const athleteRef = doc(db, 'community_athletes', userId);
        await deleteDoc(athleteRef);
    } catch (err) {
        console.error('[communityAthleteService] Error al remover atleta de la comunidad:', err);
    }
};
