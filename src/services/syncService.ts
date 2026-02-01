import { saveCloudRecord } from './measurementService';
import type { MeasurementRecord } from '../types/measurements';

const STORAGE_KEY = 'hypertrophy_measurements';

export const syncOfflineRecords = async (token: string, userId: string) => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    const locals: MeasurementRecord[] = JSON.parse(saved);
    if (!locals.length) return;

    console.log(`[syncService] Syncing ${locals.length} local records...`);

    let successCount = 0;
    const remaining: MeasurementRecord[] = [];

    for (const r of locals) {
        try {
            await saveCloudRecord(r, token, userId);
            successCount++;
        } catch (error) {
            console.error('[syncService] Failed to sync record:', r.id, error);
            remaining.push(r);
        }
    }

    if (remaining.length === 0 && successCount > 0) {
        localStorage.removeItem(STORAGE_KEY);
    } else if (remaining.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
    }

    return successCount;
};
