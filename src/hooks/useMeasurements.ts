import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { MeasurementRecord, BodyMeasurements, BodyPhoto } from '../types/measurements';

const STORAGE_KEY = 'hypertrophy_measurements';

/**
 * Hook to manage athlete measurements with extreme robustness.
 */
export const useMeasurements = (userId?: string | null, authSession?: any | null) => {
    const [records, setRecords] = useState<MeasurementRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const isSyncing = useRef(false);

    const fetchRecords = async (forceAuthId?: string) => {
        const effectiveUserId = forceAuthId || userId;
        console.log('[useMeasurements] Fetching records for:', effectiveUserId || 'Guest');

        try {
            // Priority 1: Auth Cloud Fetch
            if (effectiveUserId && effectiveUserId !== 'default-user') {
                const { data, error } = await supabase
                    .from('body_records')
                    .select(`
                        *,
                        body_measurements (*),
                        body_photos (*)
                    `)
                    .order('date', { ascending: false });

                if (error) {
                    console.warn('[useMeasurements] Cloud fetch failed, falling back to local:', error);
                    // Fallback to local if fetch errors but we have a userId? 
                    // No, typically if cloud errors, we should show error but keep state.
                    throw error;
                }

                if (data) {
                    const mappedRecords: MeasurementRecord[] = data.map((record: any) => {
                        const ms: any = {};
                        (record.body_measurements || []).forEach((m: any) => {
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

                    console.log('[useMeasurements] Cloud fetched:', mappedRecords.length, 'records');
                    setRecords(mappedRecords);
                    return;
                }
            }

            // Priority 2: Guest Local Fetch
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                console.log('[useMeasurements] Local fetched:', parsed.length, 'records');
                setRecords(parsed);
            } else {
                setRecords([]);
            }
        } catch (err) {
            console.error('[useMeasurements] Error in fetchRecords:', err);
        } finally {
            setLoading(false);
        }
    };

    const saveRecord = async (record: MeasurementRecord) => {
        console.log('[useMeasurements] Beginning save process for:', record.id);

        const translateError = (error: any): string => {
            const message = error?.message || error?.msg || '';
            const code = error?.code || '';
            console.error('[useMeasurements] Technical Error:', { message, code, raw: error });

            if (message.includes('TIMEOUT') || message.includes('signal is aborted')) return 'Conexión lenta. Reintentalo.';
            if (code === '42501' || message.includes('403')) return 'Error de permisos (RLS). Por favor reinicia sesión.';
            if (code === 'PGRST116') return 'Error de formato de datos.';
            return 'No se pudo guardar. Revisa tu conexión.';
        };

        try {
            const saveOperation = (async () => {
                const baseUrl = import.meta.env.VITE_SUPABASE_URL;
                const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

                // 1. Resolve Identity
                let token = authSession?.access_token;
                let targetUserId = userId || authSession?.user?.id;
                if (targetUserId === 'default-user') targetUserId = undefined;

                if (!targetUserId) {
                    const { data: { session: currentSession } } = await supabase.auth.getSession();
                    token = currentSession?.access_token;
                    targetUserId = currentSession?.user?.id;
                }

                // 2. GUEST PASS
                if (!targetUserId) {
                    console.log('[useMeasurements] Identity not confirmed. Saving to LocalStorage.');
                    const existingRecords = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
                    const filtered = existingRecords.filter((r: any) => r.id !== record.id);
                    const newRecords = [record, ...filtered].sort((a: any, b: any) =>
                        new Date(b.date).getTime() - new Date(a.date).getTime()
                    );
                    setRecords(newRecords);
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(newRecords));
                    return { success: true, target: 'local' };
                }

                console.log('[useMeasurements] Identity confirmed:', targetUserId, '. Saving to Cloud.');

                // 3. CLOUD PASS
                let useNativeFallback = false;
                const nativeFetch = async (method: string, path: string, body?: any, prefer?: string) => {
                    const controller = new AbortController();
                    const fetchTimeout = setTimeout(() => controller.abort(), 20000);
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
                        new Promise((resolve) => setTimeout(() => resolve({ _hang: true }), 7000))
                    ]) as any;
                    if (result._hang) {
                        console.warn('[useMeasurements] SDK HANG detected. Using native fetch.');
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

                // STEP C: Insert Measurements (Safe)
                const m = record.measurements as any;
                const keys = ['neck', 'back', 'pecho', 'waist', 'hips', 'weight', 'bodyFat', 'arm.left', 'arm.right', 'thigh.left', 'thigh.right', 'calf.left', 'calf.right'];
                const measurementItems = [];
                for (const key of keys) {
                    let value = key.includes('.') ? m[key.split('.')[0]]?.[key.split('.')[1]] : m[key];
                    if (value !== undefined && value !== null) {
                        const item: any = {
                            body_record_id: record.id,
                            type: key,
                            value: value,
                            side: key.includes('.left') ? 'left' : key.includes('.right') ? 'right' : 'center'
                        };
                        // Only add user_id if we suspect the column exists (Standard schema doesn't have it, we use RLS policies based on parent)
                        // However, to be ultra safe, we only add it if we are sure. Current schema doesn't have it.
                        measurementItems.push(item);
                    }
                }
                if (measurementItems.length > 0) {
                    await dbAction(supabase.from('body_measurements').insert(measurementItems), { method: 'POST', path: 'body_measurements', body: measurementItems });
                }

                if (record.photos?.length) {
                    const photoItems = record.photos.map(p => ({
                        id: p.id,
                        body_record_id: record.id,
                        url: p.url,
                        angle: p.angle
                    }));
                    await dbAction(supabase.from('body_photos').insert(photoItems), { method: 'POST', path: 'body_photos', body: photoItems });
                }

                const updatedRecord = { ...record, userId: targetUserId };
                setRecords(prev => [updatedRecord, ...prev.filter(r => r.id !== record.id)].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

                return { success: true, target: 'cloud' };
            })();

            return await Promise.race([saveOperation, new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), 45000))]) as { success: boolean, target?: string, error?: any };
        } catch (error: any) {
            console.error('[saveRecord] CRITICAL FAILURE:', error);
            return { success: false, error: { message: translateError(error) } };
        }
    };

    const syncLocalDataToCloud = async () => {
        if (isSyncing.current) return;
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return;

        const localRecords: MeasurementRecord[] = JSON.parse(saved);
        if (!localRecords.length) return;

        console.log('[useMeasurements] Syncing', localRecords.length, 'records to cloud...');
        isSyncing.current = true;

        try {
            const remaining: MeasurementRecord[] = [];
            for (const record of localRecords) {
                const result = await saveRecord(record);
                if (!result.success || result.target !== 'cloud') {
                    remaining.push(record);
                }
            }

            if (remaining.length === 0) {
                localStorage.removeItem(STORAGE_KEY);
                console.log('[useMeasurements] Sync total success. LocalStorage cleared.');
            } else {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
                console.warn('[useMeasurements] Sync partial failure.', remaining.length, 'records remain locally.');
            }
            fetchRecords();
        } finally {
            isSyncing.current = false;
        }
    };

    // Effect: Fetching and Syncing
    useEffect(() => {
        const init = async () => {
            if (userId && userId !== 'default-user') {
                console.log('[useMeasurements] Active User detected. Syncing...');
                await syncLocalDataToCloud();
                await fetchRecords();
            } else {
                await fetchRecords();
            }
        };
        init();
    }, [userId]);

    return {
        records,
        loading,
        saveRecord,
        deleteRecord: async (id: string) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                const newRecords = records.filter(r => r.id !== id);
                setRecords(newRecords);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(newRecords));
                return;
            }
            await supabase.from('body_records').delete().eq('id', id);
            fetchRecords();
        },
        refresh: fetchRecords
    };
};
