import { saveCloudRecord } from './measurementService';
import type { MeasurementRecord } from '../types/measurements';
import { getMeasurementsStorageKey } from '../utils/storageKeys';

export const syncOfflineRecords = async (userId: string) => {
    if (!userId || userId === 'guest') return 0;
    const userKey = getMeasurementsStorageKey(userId);
    const saved = localStorage.getItem(userKey);
    if (!saved) return 0;

    let locals: MeasurementRecord[] = [];
    try {
        locals = JSON.parse(saved);
    } catch {
        return 0;
    }

    // Only sync records that strictly belong to this user
    const userLocals = locals.filter(r => r.userId === userId || r.userId === 'local');
    if (!userLocals.length) return 0;

    let successCount = 0;
    for (const r of userLocals) {
        try {
            await saveCloudRecord(r, userId);
            successCount++;
        } catch (error) {
            console.error('[syncService] Error al sincronizar registro:', r.id, error);
        }
    }

    return successCount;
};
