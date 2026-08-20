import {
    collection,
    doc,
    getDocs,
    setDoc,
    deleteDoc,
    query,
    orderBy
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import type { MeasurementRecord } from '../types/measurements';

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
