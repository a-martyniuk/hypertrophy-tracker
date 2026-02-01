import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { MeasurementRecord } from '../types/measurements';
import {
    safeGetToken,
    fetchCloudRecords,
    saveCloudRecord,
    deleteCloudRecord
} from '../services/measurementService';
import { syncOfflineRecords } from '../services/syncService';

const STORAGE_KEY = 'hypertrophy_measurements';

/**
 * Hook to manage athlete measurements.
 * Refactored to use service layer for API interactions.
 */
export const useMeasurements = (userId?: string | null, authSession?: any | null) => {
    const [records, setRecords] = useState<MeasurementRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const isSyncing = useRef(false);

    const fetchRecords = async (forceAuthId?: string) => {
        const effectiveUserId = forceAuthId || userId;
        if (effectiveUserId === 'default-user') return;

        try {
            const token = await safeGetToken(authSession);

            // 1. Cloud Mode
            if (token && effectiveUserId) {
                const cloudRecords = await fetchCloudRecords(token);
                if (cloudRecords) {
                    setRecords(cloudRecords);
                    return;
                }
            }

            // 2. Fallback / Guest Mode
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) setRecords(JSON.parse(saved));

        } catch (err) {
            console.error('[useMeasurements] Refresh logic failed:', err);
        } finally {
            setLoading(false);
        }
    };

    const saveRecord = async (record: MeasurementRecord) => {
        try {
            let tUid = userId || authSession?.user?.id;
            const token = await safeGetToken(authSession);

            // Re-resolve ID only if needed (rare edge case)
            if (!tUid && token) {
                const { data: { user } } = await supabase.auth.getUser(token);
                tUid = user?.id;
            }

            // GUEST MODE
            if (!tUid || !token) {
                const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
                const combined = [record, ...existing.filter((r: any) => r.id !== record.id)]
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                setRecords(combined);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(combined));
                return { success: true, target: 'local' };
            }

            // CLOUD MODE
            await saveCloudRecord(record, token, tUid);

            // Optimistic Update
            setRecords(prev => [{ ...record, userId: tUid }, ...prev.filter(r => r.id !== record.id)]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

            return { success: true, target: 'cloud' };

        } catch (error: any) {
            console.error('[useMeasurements] Save failed:', error);
            const isTimeout = error.message?.includes('Timeout') || error.name === 'AbortError';
            return { success: false, error: { message: isTimeout ? 'Tiempo de espera agotado.' : error.message } };
        }
    };

    const deleteRecord = async (id: string) => {
        const token = await safeGetToken(authSession);

        if (!token) {
            const filtered = records.filter(r => r.id !== id);
            setRecords(filtered);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
            return { success: true };
        }

        try {
            await deleteCloudRecord(id, token);
            setRecords(prev => prev.filter(r => r.id !== id));
            return { success: true };
        } catch (err: any) {
            console.error('[useMeasurements] Delete failed:', err);
            const isTimeout = err.message?.includes('Timeout') || err.name === 'AbortError';
            return { success: false, error: isTimeout ? 'Tiempo de espera agotado.' : err.message };
        }
    };

    const sync = async () => {
        if (isSyncing.current) return;

        try {
            const token = await safeGetToken(authSession);
            if (!token || !userId) return;

            isSyncing.current = true;
            const syncedCount = await syncOfflineRecords(token, userId);

            if (syncedCount && syncedCount > 0) {
                await fetchRecords(userId);
            }
        } finally {
            isSyncing.current = false;
        }
    };

    useEffect(() => {
        const init = async () => {
            if (userId && userId !== 'default-user') { await sync(); await fetchRecords(userId); }
            else await fetchRecords();
        };
        init();
    }, [userId]);

    return {
        records, loading, saveRecord, deleteRecord, refresh: fetchRecords
    };
};
