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
        if (effectiveUserId === 'default-user') return; // Ignore placeholder

        try {
            if (effectiveUserId) {
                const { data, error } = await supabase
                    .from('body_records')
                    .select(`
                        *,
                        body_measurements (*),
                        body_photos (*)
                    `)
                    .order('date', { ascending: false });

                if (!error && data) {
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
                    setRecords(mappedRecords);
                    return;
                }
            }

            // Local fallback
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                setRecords(JSON.parse(saved));
            } else {
                setRecords([]);
            }
        } catch (err) {
            console.error('[useMeasurements] Fetch failed:', err);
        } finally {
            setLoading(false);
        }
    };

    const saveRecord = async (record: MeasurementRecord) => {
        // Translation helper for RLS and network issues
        const translateError = (error: any): string => {
            const message = error?.message || error?.msg || (typeof error === 'string' ? error : '');
            if (message.includes('403') || error?.status === 403) return 'Error de permisos (RLS). Por favor ejecuta el script de SQL de denormalización.';
            if (message.includes('TIMEOUT')) return 'Conexión lenta. Intentando de nuevo...';
            return 'No se pudo guardar. Revisa tu conexión.';
        };

        try {
            const saveOperation = (async () => {
                const baseUrl = import.meta.env.VITE_SUPABASE_URL;
                const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

                // 1. Resolve Identity with Freshness
                let token = authSession?.access_token;
                let targetUserId = userId || authSession?.user?.id;

                if (!targetUserId || targetUserId === 'default-user') {
                    const { data: { session: currentSession } } = await supabase.auth.getSession();
                    token = currentSession?.access_token;
                    targetUserId = currentSession?.user.id;
                }

                // GUEST MODE
                if (!targetUserId) {
                    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
                    const newRecords = [record, ...existing.filter((r: any) => r.id !== record.id)].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                    setRecords(newRecords);
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(newRecords));
                    return { success: true, target: 'local' };
                }

                // CLOUD MODE (Native Fallback Engine)
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
                            const errData = await response.json().catch(() => ({ message: 'Unknown Error' }));
                            console.error(`[saveRecord] Native Fetch Error (${response.status}):`, errData);
                            throw { ...errData, status: response.status };
                        }
                        return response.status === 204 ? null : response.json().catch(() => null);
                    } finally {
                        clearTimeout(fetchTimeout);
                    }
                };

                const dbAction = async (libQuery: any, native: { method: string, path: string, body?: any, prefer?: string }) => {
                    if (useNativeFallback) return nativeFetch(native.method, native.path, native.body, native.prefer);
                    const result = await Promise.race([
                        libQuery,
                        new Promise((resolve) => setTimeout(() => resolve({ _hang: true }), 5000))
                    ]) as any;

                    if (result?._hang) {
                        console.warn('[useMeasurements] SDK HANG. Using Native Fallback.');
                        useNativeFallback = true;
                        return nativeFetch(native.method, native.path, native.body, native.prefer);
                    }
                    if (result?.error) {
                        console.error('[useMeasurements] SDK Error:', result.error);
                        throw result.error;
                    }
                    return result?.data;
                };

                // STEP 1: Main Record (Include user_id explicitly)
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

                // STEP 2: Delete children (Atomic cleanup)
                // We use serial execution to be safe with RLS propagation
                await dbAction(supabase.from('body_measurements').delete().eq('body_record_id', record.id), { method: 'DELETE', path: `body_measurements?body_record_id=eq.${record.id}` });
                await dbAction(supabase.from('body_photos').delete().eq('body_record_id', record.id), { method: 'DELETE', path: `body_photos?body_record_id=eq.${record.id}` });

                // STEP 3: Insert Measurements (Now with Denormalized user_id)
                const m = record.measurements as any;
                const keys = ['neck', 'back', 'pecho', 'waist', 'hips', 'weight', 'bodyFat', 'arm.left', 'arm.right', 'thigh.left', 'thigh.right', 'calf.left', 'calf.right'];
                const items = [];
                for (const key of keys) {
                    let val = key.includes('.') ? m[key.split('.')[0]]?.[key.split('.')[1]] : m[key];
                    if (val !== undefined && val !== null) {
                        items.push({
                            body_record_id: record.id,
                            user_id: targetUserId, // DENORMALIZED
                            type: key,
                            value: val,
                            side: key.includes('.left') ? 'left' : key.includes('.right') ? 'right' : 'center'
                        });
                    }
                }

                if (items.length > 0) {
                    await dbAction(supabase.from('body_measurements').insert(items), { method: 'POST', path: 'body_measurements', body: items });
                }

                // STEP 4: Photos (Now with Denormalized user_id)
                if (record.photos?.length) {
                    const photos = record.photos.map(p => ({
                        id: p.id,
                        body_record_id: record.id,
                        user_id: targetUserId, // DENORMALIZED
                        url: p.url,
                        angle: p.angle
                    }));
                    await dbAction(supabase.from('body_photos').insert(photos), { method: 'POST', path: 'body_photos', body: photos });
                }

                // Success
                setRecords(prev => [{ ...record, userId: targetUserId }, ...prev.filter(r => r.id !== record.id)].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
                return { success: true, target: 'cloud' };
            })();

            return await Promise.race([saveOperation, new Promise((_, r) => setTimeout(() => r(new Error('TIMEOUT')), 45000))]) as any;
        } catch (error: any) {
            console.error('[saveRecord] FAILED:', error);
            return { success: false, error: { message: translateError(error) } };
        }
    };

    // Sequential Sync Flow
    const sync = async () => {
        if (isSyncing.current) return;
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return;

        const locals: MeasurementRecord[] = JSON.parse(saved);
        if (!locals.length) return;

        isSyncing.current = true;
        try {
            console.log(`[useMeasurements] Syncing ${locals.length} records...`);
            const remaining: MeasurementRecord[] = [];
            for (const r of locals) {
                const result = await saveRecord(r);
                if (!result.success || result.target !== 'cloud') remaining.push(r);
            }

            if (!remaining.length) localStorage.removeItem(STORAGE_KEY);
            else localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));

            await fetchRecords();
        } finally {
            isSyncing.current = false;
        }
    };

    useEffect(() => {
        const run = async () => {
            if (userId && userId !== 'default-user') {
                await sync();
                await fetchRecords(userId);
            } else {
                await fetchRecords();
            }
        };
        run();
    }, [userId]);

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
            console.error('[useMeasurements] Delete failed:', err);
        }
    };

    return { records, loading, saveRecord, deleteRecord, refresh: fetchRecords, isSyncing: isSyncing.current };
};
