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
                if (cloudRecords && cloudRecords.length > 0) {
                    setRecords(cloudRecords);
                    return;
                }
            }

            // 2. Local / Guest Mode Fallback
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                try {
                    const parsed: MeasurementRecord[] = JSON.parse(saved);
                    if (Array.isArray(parsed)) {
                        setRecords(parsed);
                        return;
                    }
                } catch {
                    // JSON parse error fallback
                }
            }

            // New visitor / Clean slate: start with empty records
            setRecords([]);
        } catch (err) {
            console.error('[useMeasurements] Error al obtener registros:', err);
        } finally {
            setLoading(false);
        }
    }, [userId]);

    const saveRecord = async (record: MeasurementRecord) => {
        try {
            const isCloud = isFirebaseConfigured && userId && userId !== 'guest';

            // 1. Instant local optimistic update (Offline-First)
            const localPayload = { ...record, userId: userId || 'local' };
            const existing: MeasurementRecord[] = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            const combined = [localPayload, ...existing.filter((r) => r.id !== record.id)]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setRecords(combined);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(combined));

            // 2. Background Cloud Sync if connected
            if (isCloud) {
                try {
                    await saveCloudRecord(record, userId!);
                    return { success: true, target: 'cloud' };
                } catch (cloudErr) {
                    console.warn('[useMeasurements] Offline mode: guardado localmente, sincronizacion pendiente.', cloudErr);
                    return { success: true, target: 'local_cached' };
                }
            }

            return { success: true, target: 'local' };
        } catch (error: unknown) {
            console.error('[useMeasurements] Error al guardar registro:', error);
            const msg = error instanceof Error ? error.message : 'Error al guardar el registro';
            return { success: false, error: { message: msg } };
        }
    };

    const deleteRecord = async (id: string) => {
        const isCloud = isFirebaseConfigured && userId && userId !== 'guest';

        // 1. Instant local removal
        const filtered = records.filter(r => r.id !== id);
        setRecords(filtered);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));

        if (!isCloud) {
            return { success: true };
        }

        // 2. Background Cloud delete
        try {
            await deleteCloudRecord(id, userId!);
            return { success: true };
        } catch (err: unknown) {
            console.error('[useMeasurements] Error al eliminar registro en cloud:', err);
            return { success: true, warning: 'Eliminado localmente, error en cloud' };
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
