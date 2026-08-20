import { saveCloudRecord } from './measurementService';
import type { MeasurementRecord } from '../types/measurements';

const STORAGE_KEY = 'hypertrophy_measurements';

export const syncOfflineRecords = async (userId: string) => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return 0;

    let locals: MeasurementRecord[] = [];
    try {
        locals = JSON.parse(saved);
    } catch {
        return 0;
    }

    if (!locals.length) return 0;

    console.log(`[syncService] Sincronizando ${locals.length} registros locales a Firestore...`);

    let successCount = 0;
    const remaining: MeasurementRecord[] = [];

    for (const r of locals) {
        try {
            await saveCloudRecord(r, userId);
            successCount++;
        } catch (error) {
            console.error('[syncService] Error al sincronizar registro:', r.id, error);
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
