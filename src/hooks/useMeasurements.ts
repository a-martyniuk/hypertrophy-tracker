import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { MeasurementRecord, BodyMeasurements, BodyPhoto } from '../types/measurements';

const STORAGE_KEY = 'hypertrophy_measurements';

/**
 * Hook to manage athlete measurements.
 */
export const useMeasurements = (userId?: string | null, authSession?: any | null) => {
    const [records, setRecords] = useState<MeasurementRecord[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchRecords = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                const saved = localStorage.getItem(STORAGE_KEY);
                if (saved) {
                    setRecords(JSON.parse(saved));
                }
                setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from('body_records')
                .select(`
                    *,
                    body_measurements (*),
                    body_photos (*)
                `)
                .order('date', { ascending: false });

            if (error) throw error;

            if (data) {
                const mappedRecords: MeasurementRecord[] = data.map((record: any) => {
                    const ms: any = {};
                    record.body_measurements.forEach((m: any) => {
                        if (m.type.includes('.')) {
                            const [base, side] = m.type.split('.');
                            if (!ms[base]) ms[base] = {};
                            ms[base][side] = m.value;
                        } else {
                            ms[m.type] = m.value;
                        }
                    });

                    const photos: BodyPhoto[] = record.body_photos?.map((p: any) => ({
                        id: p.id,
                        url: p.url,
                        angle: p.angle,
                        createdAt: p.created_at
                    })) || [];

                    return {
                        id: record.id,
                        userId: record.user_id,
                        date: record.date,
                        notes: record.notes,
                        metadata: record.metadata,
                        measurements: ms as BodyMeasurements,
                        photos
                    };
                });
                setRecords(mappedRecords);
            }
        } catch (err) {
            console.error('[useMeasurements] Error fetching records:', err);
        } finally {
            setLoading(false);
        }
    };

    const deleteRecord = async (id: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                const newRecords = records.filter(r => r.id !== id);
                setRecords(newRecords);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(newRecords));
                return;
            }
            const { error } = await supabase.from('body_records').delete().eq('id', id);
            if (error) throw error;
            fetchRecords();
        } catch (err) {
            console.error('[useMeasurements] Error deleting record:', err);
        }
    };

    const saveRecord = async (record: MeasurementRecord) => {
        const translateError = (error: any): string => {
            const message = error?.message || '';
            const code = error?.code || '';
            if (message.includes('TIMEOUT') || message.includes('signal is aborted')) return 'La conexión es lenta. Intentando en segundo plano.';
            if (code === '42501' || message.includes('403')) return 'Error de permisos (RLS). Verifica tu sesión.';
            if (code === '23503' || message.includes('409')) return 'Error de sincronización.';
            return 'Hubo un error al guardar tus medidas.';
        };

        try {
            const saveOperation = (async () => {
                const baseUrl = import.meta.env.VITE_SUPABASE_URL;
                const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

                // 1. Resolve Auth (Aggressive)
                let token = authSession?.access_token;
                let targetUserId = userId || authSession?.user?.id;
                if (targetUserId === 'default-user') targetUserId = undefined;

                if (!token || !targetUserId) {
                    const { data: { session: currentSession } } = await supabase.auth.getSession();
                    token = currentSession?.access_token;
                    targetUserId = currentSession?.user?.id;
                }

                // 2. GUEST MODE FLIGHT PATH
                if (!targetUserId) {
                    const existingRecords = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
                    const filtered = existingRecords.filter((r: any) => r.id !== record.id);
                    const newRecords = [record, ...filtered].sort((a: any, b: any) =>
                        new Date(b.date).getTime() - new Date(a.date).getTime()
                    );
                    setRecords(newRecords);
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(newRecords));
                    return { success: true, target: 'local' };
                }

                // 3. CLOUD FLIGHT PATH
                let useNativeFallback = false;
                const nativeFetch = async (method: string, path: string, body?: any, prefer?: string) => {
                    const controller = new AbortController();
                    const fetchTimeout = setTimeout(() => controller.abort(), 15000);
                    try {
                        const response = await fetch(`${baseUrl}/rest/v1/${path}`, {
                            method,
                            signal: controller.signal,
                            headers: {
                                'apikey': anonKey,
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json',
                                'Prefer': prefer || (method === 'POST' ? 'return=minimal' : '')
                            },
                            body: body ? JSON.stringify(body) : undefined
                        });
                        clearTimeout(fetchTimeout);
                        if (!response.ok) {
                            const errBody = await response.json().catch(() => ({}));
                            throw { ...errBody, status: response.status };
                        }
                        return response.status === 204 ? null : response.json().catch(() => null);
                    } catch (err: any) {
                        clearTimeout(fetchTimeout);
                        throw err;
                    }
                };

                const dbAction = async (libQuery: any, native: { method: string, path: string, body?: any, prefer?: string }) => {
                    if (useNativeFallback) return nativeFetch(native.method, native.path, native.body, native.prefer);
                    const result = await Promise.race([
                        libQuery,
                        new Promise((resolve) => setTimeout(() => resolve({ _hang: true }), 5000))
                    ]) as any;
                    if (result._hang) {
                        useNativeFallback = true;
                        return nativeFetch(native.method, native.path, native.body, native.prefer);
                    }
                    if (result.error) throw result.error;
                    return result.data;
                };

                // STEP A: Main Record
                const dbPayload = {
                    id: record.id,
                    date: record.date,
                    weight: record.measurements.weight,
                    body_fat_pct: record.measurements.bodyFat,
                    notes: record.notes,
                    metadata: record.metadata,
                    user_id: targetUserId
                };

                await dbAction(
                    supabase.from('body_records').upsert(dbPayload),
                    { method: 'POST', path: 'body_records', body: dbPayload, prefer: 'resolution=merge-duplicates' }
                );

                // STEP B: Cleanup Children
                await Promise.all([
                    dbAction(supabase.from('body_measurements').delete().eq('body_record_id', record.id), { method: 'DELETE', path: `body_measurements?body_record_id=eq.${record.id}` }),
                    dbAction(supabase.from('body_photos').delete().eq('body_record_id', record.id), { method: 'DELETE', path: `body_photos?body_record_id=eq.${record.id}` })
                ]);

                // STEP C: Insert Measurements
                const m = record.measurements as any;
                const keys = ['neck', 'back', 'pecho', 'waist', 'hips', 'weight', 'bodyFat', 'arm.left', 'arm.right', 'thigh.left', 'thigh.right', 'calf.left', 'calf.right'];
                const measurementItems = [];
                for (const key of keys) {
                    let value = key.includes('.') ? m[key.split('.')[0]]?.[key.split('.')[1]] : m[key];
                    if (value !== undefined && value !== null) {
                        measurementItems.push({
                            body_record_id: record.id,
                            user_id: targetUserId,
                            type: key,
                            value: value,
                            side: key.includes('.left') ? 'left' : key.includes('.right') ? 'right' : 'center'
                        });
                    }
                }
                if (measurementItems.length > 0) {
                    await dbAction(supabase.from('body_measurements').insert(measurementItems), { method: 'POST', path: 'body_measurements', body: measurementItems });
                }

                const photoItems = (record.photos || []).map(p => ({
                    id: p.id,
                    body_record_id: record.id,
                    user_id: targetUserId,
                    url: p.url,
                    angle: p.angle
                }));
                if (photoItems.length > 0) {
                    await dbAction(supabase.from('body_photos').insert(photoItems), { method: 'POST', path: 'body_photos', body: photoItems });
                }

                // Finalize State
                const updatedRecord = { ...record, userId: targetUserId };
                setRecords(prev => [updatedRecord, ...prev.filter(r => r.id !== record.id)].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

                // Fetch to confirm and catch background issues
                fetchRecords().catch(() => { });

                return { success: true, target: 'cloud' };
            })();

            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 45000));
            return await Promise.race([saveOperation, timeoutPromise]) as { success: boolean, target?: string, error?: any };
        } catch (error: any) {
            console.error('[saveRecord] Failed:', error);
            return { success: false, error: { message: translateError(error) } };
        }
    };

    const syncLocalDataToCloud = async () => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return;
        try {
            const localRecords: MeasurementRecord[] = JSON.parse(saved);
            if (!Array.isArray(localRecords) || localRecords.length === 0) return;

            const remaining: MeasurementRecord[] = [];
            for (const record of localRecords) {
                const result = await saveRecord(record);
                // Only count as success if it actually hit the cloud
                if (result.success && result.target === 'cloud') {
                    // Successfully migrated
                } else {
                    remaining.push(record);
                }
            }

            if (remaining.length === 0) {
                localStorage.removeItem(STORAGE_KEY);
            } else {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
            }
            fetchRecords();
        } catch (err) {
            console.error('[useMeasurements] Sync failed:', err);
        }
    };

    useEffect(() => {
        if (userId && userId !== 'default-user') {
            syncLocalDataToCloud();
            fetchRecords();
        } else {
            fetchRecords();
        }
    }, [userId]);

    return {
        records,
        loading,
        saveRecord,
        deleteRecord,
        refresh: fetchRecords
    };
};
