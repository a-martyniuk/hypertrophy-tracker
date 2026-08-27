import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    deleteDoc,
    query,
    orderBy
} from 'firebase/firestore';
import { db, isFirebaseConfigured, auth } from '../lib/firebase';
import type { MeasurementRecord } from '../types/measurements';
import { publishCommunityAthlete } from './communityAthleteService';

export const fetchCloudRecords = async (userId: string): Promise<MeasurementRecord[] | null> => {
    if (!isFirebaseConfigured || !userId) return null;

    try {
        const recordsRef = collection(db, 'users', userId, 'records');
        const q = query(recordsRef, orderBy('date', 'desc'));
        const snapshot = await getDocs(q);

        const records: MeasurementRecord[] = [];
        snapshot.forEach((d) => {
            records.push(d.data() as MeasurementRecord);
        });

        return records;
    } catch (err) {
        console.error('[measurementService] Error al obtener registros de Firestore:', err);
        return null;
    }
};

export const saveCloudRecord = async (record: MeasurementRecord, userId: string): Promise<void> => {
    if (!isFirebaseConfigured || !userId) {
        throw new Error('Firebase no está configurado o falta userId');
    }

    try {
        const recordRef = doc(db, 'users', userId, 'records', record.id);
        const dataToSave = {
            ...record,
            userId
        };
        await setDoc(recordRef, dataToSave, { merge: true });

        // Also sync with public community athletes for peer comparison if isPublic !== false
        try {
            const profileDoc = await getDoc(doc(db, 'users', userId, 'profile', 'main'));
            const profileData = profileDoc.exists() ? profileDoc.data() : null;
            const isPublic = profileData?.isPublic !== false; // Default is public
            const user = auth.currentUser;
            const name = profileData?.publicAlias || profileData?.name || user?.displayName || user?.email?.split('@')[0] || 'Atleta';
            const sex = profileData?.sex || 'male';
            const publicAlias = profileData?.publicAlias;

            await publishCommunityAthlete(userId, name, sex, record, record.measurements?.age, isPublic, publicAlias);
        } catch (pubErr) {
            console.warn('[measurementService] Error al sincronizar con comunidad:', pubErr);
        }
    } catch (err) {
        console.error('[measurementService] Error al guardar registro en Firestore:', err);
        throw err;
    }
};

export const deleteCloudRecord = async (id: string, userId: string): Promise<void> => {
    if (!isFirebaseConfigured || !userId) {
        throw new Error('Firebase no está configurado o falta userId');
    }

    try {
        const recordRef = doc(db, 'users', userId, 'records', id);
        await deleteDoc(recordRef);
    } catch (err) {
        console.error('[measurementService] Error al eliminar registro de Firestore:', err);
        throw err;
    }
};
