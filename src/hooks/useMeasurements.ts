import { useState, useEffect, useCallback } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db, auth, isFirebaseConfigured } from '../lib/firebase';
import type { MeasurementRecord } from '../types/measurements';
import {
    fetchCloudRecords,
    saveCloudRecord,
    deleteCloudRecord
} from '../services/measurementService';
import { publishCommunityAthlete } from '../services/communityAthleteService';
import { getMeasurementsStorageKey } from '../utils/storageKeys';
import { enqueueSyncAction } from '../services/offlineSyncQueue';

export const useMeasurements = (userId?: string | null) => {
    const [records, setRecords] = useState<MeasurementRecord[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchRecords = useCallback(async (targetUserId?: string | null) => {
        const effectiveUserId = targetUserId !== undefined ? targetUserId : userId;
        const storageKey = getMeasurementsStorageKey(effectiveUserId);

        try {
            // 1. Cloud Mode (Firestore) for Authenticated Users
            if (isFirebaseConfigured && effectiveUserId && effectiveUserId !== 'guest') {
                const cloudRecords = await fetchCloudRecords(effectiveUserId);
                if (cloudRecords !== null) {
                    // Firestore returned valid response (even if empty [])
                    setRecords(cloudRecords);
                    localStorage.setItem(storageKey, JSON.stringify(cloudRecords));

                    // Auto-sync latest measurement to community in background
                    if (cloudRecords.length > 0) {
                        try {
                            const latestRecord = cloudRecords[0];
                            const profileDoc = await getDoc(doc(db, 'users', effectiveUserId, 'profile', 'main'));
                            const profileData = profileDoc.exists() ? profileDoc.data() : null;
                            const isPublic = profileData?.isPublic !== false;
                            const user = auth.currentUser;
                            const name = profileData?.publicAlias || profileData?.name || user?.displayName || user?.email?.split('@')[0] || 'Atleta';
                            const sex = profileData?.sex || 'male';
                            const publicAlias = profileData?.publicAlias;

                            publishCommunityAthlete(effectiveUserId, name, sex, latestRecord, latestRecord.measurements?.age, isPublic, publicAlias).catch(() => {});
                        } catch {
                            // Non-blocking background sync
                        }
                    }
                    return;
                }
            }

            // 2. Local / User-scoped Cache Fallback
            const saved = localStorage.getItem(storageKey);
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

            // Clean slate for new users / guests
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
            const storageKey = getMeasurementsStorageKey(userId);

            // 1. Instant local optimistic update in user-scoped storage
            const localPayload = { ...record, userId: userId || 'local' };
            const existing: MeasurementRecord[] = JSON.parse(localStorage.getItem(storageKey) || '[]');
            const combined = [localPayload, ...existing.filter((r) => r.id !== record.id)]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setRecords(combined);
            localStorage.setItem(storageKey, JSON.stringify(combined));

            // 2. Background Cloud Sync if connected
            if (isCloud) {
                if (typeof navigator !== 'undefined' && !navigator.onLine) {
                    enqueueSyncAction('SAVE_RECORD', userId!, record);
                    return { success: true, target: 'offline_queued' };
                }

                try {
                    await saveCloudRecord(record, userId!);
                    return { success: true, target: 'cloud' };
                } catch (cloudErr) {
                    console.warn('[useMeasurements] Error en cloud. Encolando para sincronización automática:', cloudErr);
                    enqueueSyncAction('SAVE_RECORD', userId!, record);
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
        const storageKey = getMeasurementsStorageKey(userId);

        // 1. Instant local removal from user-scoped storage
        const filtered = records.filter(r => r.id !== id);
        setRecords(filtered);
        localStorage.setItem(storageKey, JSON.stringify(filtered));

        if (!isCloud) {
            return { success: true };
        }

        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            enqueueSyncAction('DELETE_RECORD', userId!, id);
            return { success: true };
        }

        // 2. Background Cloud delete
        try {
            await deleteCloudRecord(id, userId!);
            return { success: true };
        } catch (err: unknown) {
            console.warn('[useMeasurements] Error al eliminar en cloud. Encolando para reintento offline:', err);
            enqueueSyncAction('DELETE_RECORD', userId!, id);
            return { success: true, warning: 'Eliminado localmente, reintento encolado' };
        }
    };

    useEffect(() => {
        let mounted = true;
        const init = async () => {
            if (mounted) {
                await fetchRecords(userId);
            }
        };
        void init();
        return () => { mounted = false; };
    }, [userId, fetchRecords]);

    return {
        records,
        loading,
        saveRecord,
        deleteRecord,
        refresh: fetchRecords
    };
};
