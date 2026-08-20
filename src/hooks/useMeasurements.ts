import { useState, useEffect, useRef, useCallback } from 'react';
import { isFirebaseConfigured } from '../lib/firebase';
import type { MeasurementRecord } from '../types/measurements';
import {
    fetchCloudRecords,
    saveCloudRecord,
    deleteCloudRecord
} from '../services/measurementService';
import { syncOfflineRecords } from '../services/syncService';

const STORAGE_KEY = 'hypertrophy_measurements';

export const useMeasurements = (userId?: string | null) => {
    const [records, setRecords] = useState<MeasurementRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const isSyncing = useRef(false);

    const fetchRecords = useCallback(async (targetUserId?: string | null) => {
        const effectiveUserId = targetUserId !== undefined ? targetUserId : userId;

        try {
            // 1. Cloud Mode (Firestore)
            if (isFirebaseConfigured && effectiveUserId && effectiveUserId !== 'guest') {
                const cloudRecords = await fetchCloudRecords(effectiveUserId);
                if (cloudRecords) {
                    setRecords(cloudRecords);
                    return;
                }
            }

            // 2. Local / Guest Mode Fallback
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                try {
                    setRecords(JSON.parse(saved));
                } catch {
                    setRecords([]);
                }
            } else {
                setRecords([]);
            }
        } catch (err) {
            console.error('[useMeasurements] Error al obtener registros:', err);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    const saveRecord = async (record: MeasurementRecord) => {
        try {
            const isCloud = isFirebaseConfigured && userId && userId !== 'guest';

            // GUEST / LOCAL MODE
            if (!isCloud) {
                const existing: MeasurementRecord[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
                const combined = [record, ...existing.filter((r) => r.id !== record.id)]
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                setRecords(combined);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(combined));
                return { success: true, target: 'local' };
            }

            // CLOUD MODE (Firestore JSON)
            await saveCloudRecord(record, userId!);

            // Optimistic / Local State Update
            setRecords(prev => [{ ...record, userId: userId! }, ...prev.filter(r => r.id !== record.id)]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

            return { success: true, target: 'cloud' };
        } catch (error: unknown) {
            console.error('[useMeasurements] Error al guardar registro:', error);
            const msg = error instanceof Error ? error.message : 'Error al guardar el registro';
            return { success: false, error: { message: msg } };
        }
    };

    const deleteRecord = async (id: string) => {
        const isCloud = isFirebaseConfigured && userId && userId !== 'guest';

        if (!isCloud) {
            const filtered = records.filter(r => r.id !== id);
            setRecords(filtered);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
            return { success: true };
        }

        try {
            await deleteCloudRecord(id, userId!);
            setRecords(prev => prev.filter(r => r.id !== id));
            return { success: true };
        } catch (err: unknown) {
            console.error('[useMeasurements] Error al eliminar registro:', err);
            const msg = err instanceof Error ? err.message : 'Error al eliminar el registro';
            return { success: false, error: msg };
        }
    };

    const sync = useCallback(async () => {
        if (isSyncing.current || !userId || userId === 'guest' || !isFirebaseConfigured) return;

        try {
            isSyncing.current = true;
            const syncedCount = await syncOfflineRecords(userId);
            if (syncedCount > 0) {
                await fetchRecords(userId);
            }
        } finally {
            isSyncing.current = false;
        }
    }, [userId, fetchRecords]);

    useEffect(() => {
        let mounted = true;
        const init = async () => {
            if (userId && userId !== 'guest' && isFirebaseConfigured) {
                await sync();
                if (mounted) await fetchRecords(userId);
            } else {
                if (mounted) await fetchRecords();
            }
        };
        void init();
        return () => { mounted = false; };
    }, [userId, sync, fetchRecords]);

    return {
        records,
        loading,
        saveRecord,
        deleteRecord,
        refresh: fetchRecords
    };
};
