import { saveCloudRecord, deleteCloudRecord } from './measurementService';
import { doc, setDoc } from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import type { MeasurementRecord, UserProfile } from '../types/measurements';

export type SyncActionType = 'SAVE_RECORD' | 'DELETE_RECORD' | 'UPDATE_PROFILE';

export interface SyncAction {
    id: string;
    type: SyncActionType;
    userId: string;
    timestamp: number;
    payload: any;
    retryCount: number;
}

export interface SyncStatus {
    isOnline: boolean;
    isSyncing: boolean;
    pendingCount: number;
    lastSyncTimestamp: number | null;
}

const STORAGE_KEY = 'hypertrophy_offline_sync_queue';
const listeners = new Set<(status: SyncStatus) => void>();

let isSyncing = false;
let lastSyncTimestamp: number | null = null;

const notifyListeners = () => {
    const queue = getPendingSyncActions();
    const status: SyncStatus = {
        isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
        isSyncing,
        pendingCount: queue.length,
        lastSyncTimestamp
    };
    listeners.forEach(cb => cb(status));
};

export const subscribeSyncStatus = (cb: (status: SyncStatus) => void): (() => void) => {
    listeners.add(cb);
    notifyListeners();
    return () => listeners.delete(cb);
};

export const getPendingSyncActions = (): SyncAction[] => {
    if (typeof window === 'undefined') return [];
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
};

const saveQueue = (queue: SyncAction[]) => {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
        notifyListeners();
    } catch (e) {
        console.error('[offlineSyncQueue] Error al guardar cola offline:', e);
    }
};

export const enqueueSyncAction = (
    type: SyncActionType,
    userId: string,
    payload: any
): void => {
    if (!userId || userId === 'guest') return;

    const queue = getPendingSyncActions();
    // Prevent duplicate saves of the same record ID
    const actionId = payload?.id ? `${type}_${payload.id}` : `${type}_${Date.now()}_${Math.random()}`;
    const filtered = queue.filter(a => a.id !== actionId);

    filtered.push({
        id: actionId,
        type,
        userId,
        timestamp: Date.now(),
        payload,
        retryCount: 0
    });

    saveQueue(filtered);
    console.log(`[offlineSyncQueue] Acción ${type} encolada para sincronización offline.`);
};

export const flushSyncQueue = async (): Promise<{ success: boolean; syncedCount: number; errors: number }> => {
    if (isSyncing || typeof navigator === 'undefined' || !navigator.onLine || !isFirebaseConfigured) {
        return { success: false, syncedCount: 0, errors: 0 };
    }

    const queue = getPendingSyncActions();
    if (queue.length === 0) {
        return { success: true, syncedCount: 0, errors: 0 };
    }

    isSyncing = true;
    notifyListeners();

    let syncedCount = 0;
    let errors = 0;
    const remaining: SyncAction[] = [];

    for (const action of queue) {
        try {
            if (action.type === 'SAVE_RECORD') {
                await saveCloudRecord(action.payload as MeasurementRecord, action.userId);
                syncedCount++;
            } else if (action.type === 'DELETE_RECORD') {
                await deleteCloudRecord(action.payload as string, action.userId);
                syncedCount++;
            } else if (action.type === 'UPDATE_PROFILE') {
                const profileRef = doc(db, 'users', action.userId, 'profile', 'main');
                await setDoc(profileRef, action.payload as UserProfile, { merge: true });
                syncedCount++;
            }
        } catch (err) {
            console.warn(`[offlineSyncQueue] Fallo al sincronizar acción ${action.type}:`, err);
            errors++;
            action.retryCount = (action.retryCount || 0) + 1;
            if (action.retryCount < 5) {
                remaining.push(action);
            }
        }
    }

    saveQueue(remaining);
    isSyncing = false;
    lastSyncTimestamp = Date.now();
    notifyListeners();

    if (syncedCount > 0) {
        console.log(`[offlineSyncQueue] Sincronización exitosa: ${syncedCount} acciones procesadas.`);
    }

    return { success: errors === 0, syncedCount, errors };
};

export const initBackgroundSyncListener = (): (() => void) => {
    if (typeof window === 'undefined') return () => {};

    const handleOnline = () => {
        console.log('[offlineSyncQueue] Conexión a Internet detectada. Vaciando cola de sincronización...');
        flushSyncQueue();
    };

    const handleVisibility = () => {
        if (document.visibilityState === 'visible' && navigator.onLine) {
            flushSyncQueue();
        }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('focus', handleVisibility);
    document.addEventListener('visibilitychange', handleVisibility);

    // Initial flush if online
    if (navigator.onLine) {
        setTimeout(() => flushSyncQueue(), 1500);
    }

    return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('focus', handleVisibility);
        document.removeEventListener('visibilitychange', handleVisibility);
    };
};
