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

/**
 * Fetches all real public community athletes from Firestore.
 */
export const fetchCommunityAthletes = async (currentUserId?: string): Promise<ComparisonProfile[]> => {
    if (!isFirebaseConfigured) {
        return [];
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
                const dateStr = data.date ? new Date(data.date).toLocaleDateString() : 'Activo';
                const weightStr = data.measurements.weight ? `${data.measurements.weight} kg` : '';
                const h = data.height || data.measurements.height || 178;
                const w = data.weight || data.measurements.weight || 80;
                const age = data.age || data.measurements.age || 25;
                const displayName = data.publicAlias || data.name || 'Atleta de la Comunidad';

                cloudAthletes.push({
                    id: `cloud_${athleteId}`,
                    name: displayName,
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

        // Sort by newest date in memory
        cloudAthletes.sort((a, b) => {
            const dateA = a.date ? new Date(a.date).getTime() : 0;
            const dateB = b.date ? new Date(b.date).getTime() : 0;
            return dateB - dateA;
        });

        return cloudAthletes;
    } catch (err) {
        console.error('[communityAthleteService] Error al obtener atletas de la comunidad:', err);
        return [];
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
        const resolvedAge = latestRecord.measurements?.age || age || 25;
        const cleanName = publicAlias?.trim() || ((name && name !== 'User' && name !== 'guest') ? name : 'Atleta Registrado');

        const payload = {
            id: userId,
            name: cleanName,
            publicAlias: publicAlias?.trim() || null,
            title: `${height || 178} cm · ${weight || 80} kg · ${resolvedAge} años`,
            era: weight ? `${weight} kg` : 'Comunidad',
            sex: sex || 'male',
            age: resolvedAge,
            height: height || 178,
            weight: weight || 80,
            bodyFat: bodyFat ?? 12,
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
