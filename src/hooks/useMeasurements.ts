import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { MeasurementRecord, BodyMeasurements, BodyPhoto } from '../types/measurements';

const STORAGE_KEY = 'hypertrophy_measurements';

export const useMeasurements = (userId?: string | null, authSession?: any | null) => {
    const [records, setRecords] = useState<MeasurementRecord[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchRecords = async () => {
        console.log('[useMeasurements] fetchRecords starting...');
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

        if (error) {
            console.error('[useMeasurements] Error fetching records:', error);
        } else if (data) {
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
        setLoading(false);
    };

    const deleteRecord = async (id: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            const newRecords = records.filter(r => r.id !== id);
            setRecords(newRecords);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newRecords));
            return;
        }
        await supabase.from('body_records').delete().eq('id', id);
        fetchRecords();
    };

    const saveRecord = async (record: MeasurementRecord) => {
        console.log('[saveRecord] Entry. ID:', record.id);

        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('TIMEOUT')), 45000)
        );

        console.time('[saveRecord] Total');
        try {
            const saveOperation = (async () => {
                // 1. Get Token and Setup Environment
                const baseUrl = import.meta.env.VITE_SUPABASE_URL;
                const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

                let token = authSession?.access_token;
                let targetUserId = userId || authSession?.user?.id || record.userId;

                if (!token) {
                    console.log('[saveRecord] Token missing, searching localStorage...');
                    for (let i = 0; i < localStorage.length; i++) {
                        const key = localStorage.key(i);
                        if (key?.startsWith('sb-') && key.endsWith('-auth-token')) {
                            const raw = localStorage.getItem(key);
                            if (raw) {
                                const parsed = JSON.parse(raw);
                                token = parsed.access_token;
                                targetUserId = targetUserId || parsed.user?.id;
                                break;
                            }
                        }
                    }
                }

                if (!targetUserId || targetUserId === 'default-user') {
                    console.log('[saveRecord] Guest Mode');
                    const newRecords = [record, ...records].sort((a, b) =>
                        new Date(b.date).getTime() - new Date(a.date).getTime()
                    );
                    setRecords(newRecords);
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(newRecords));
                    return { success: true };
                }

                let useNativeFallback = false;

                const dbAction = async (libQuery: any, native: { method: string, path: string, body?: any, prefer?: string }) => {
                    const label = `[saveRecord] ${native.method} ${native.path}`;
                    if (useNativeFallback) {
                        return nativeFetch(native.method, native.path, native.body, native.prefer);
                    }

                    console.log(`${label} - Starting Library attempt...`);
                    const result = await Promise.race([
                        libQuery,
                        new Promise((resolve) => setTimeout(() => resolve({ _hang: true }), 5000))
                    ]) as any;

                    if (result._hang) {
                        console.warn(`${label} - Library HANG. Switching to Native Fallback.`);
                        useNativeFallback = true;
                        return nativeFetch(native.method, native.path, native.body, native.prefer);
                    }
                    if (result.error) throw result.error;
                    console.log(`${label} - Library SUCCESS.`);
                    return result.data;
                };

                const nativeFetch = async (method: string, path: string, body?: any, prefer?: string) => {
                    const label = `[saveRecord] NativeFetch ${method} ${path}`;
                    console.log(`${label} - Executing native fetch...`);

                    if (!token) throw new Error('Cannot use native fallback: No access token found.');

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
                            console.error(`${label} - HTTP ERROR:`, response.status, errBody);
                            throw new Error(`Native fetch failed (${response.status}): ${JSON.stringify(errBody)}`);
                        }

                        console.log(`${label} - SUCCESS.`);
                        return response.status === 204 ? null : response.json().catch(() => null);
                    } catch (err: any) {
                        clearTimeout(fetchTimeout);
                        console.error(`${label} - FATAL:`, err);
                        throw err;
                    }
                };

                // STEP 2: Main Record (ALWAYS use UPSERT to avoid "ghost updates" on sync)
                const dbPayload = {
                    id: record.id,
                    date: record.date,
                    weight: record.measurements.weight,
                    body_fat_pct: record.measurements.bodyFat,
                    notes: record.notes,
                    metadata: record.metadata,
                    user_id: targetUserId
                };

                console.log('[saveRecord] Step 2: Main Record UPSERT (Ensuring it exists for children)');
                await dbAction(
                    supabase.from('body_records').upsert(dbPayload),
                    {
                        method: 'POST',
                        path: 'body_records',
                        body: dbPayload,
                        prefer: 'return=minimal, resolution=merge-duplicates'
                    }
                );

                // STEP 3: Cleanup
                console.log('[saveRecord] Proceeding to Step 3: Cleanup');
                await dbAction(
                    supabase.from('body_measurements').delete().eq('body_record_id', record.id),
                    { method: 'DELETE', path: `body_measurements?body_record_id=eq.${record.id}` }
                );
                await dbAction(
                    supabase.from('body_photos').delete().eq('body_record_id', record.id),
                    { method: 'DELETE', path: `body_photos?body_record_id=eq.${record.id}` }
                );

                // STEP 4: Detailed Inserts (WITH Denormalized user_id)
                const m = record.measurements as any;
                const keys = ['neck', 'back', 'pecho', 'waist', 'hips', 'weight', 'bodyFat', 'arm.left', 'arm.right', 'thigh.left', 'thigh.right', 'calf.left', 'calf.right'];
                const measurementItems = [];

                for (const key of keys) {
                    let value;
                    if (key.includes('.')) {
                        const [base, side] = key.split('.');
                        value = m[base]?.[side];
                    } else {
                        value = m[key];
                    }

                    if (value !== undefined && value !== null) {
                        measurementItems.push({
                            body_record_id: record.id,
                            user_id: targetUserId, // Denormalized for bulletproof RLS
                            type: key,
                            value: value,
                            side: key.includes('.left') ? 'left' : key.includes('.right') ? 'right' : 'center'
                        });
                    }
                }

                if (measurementItems.length > 0) {
                    await dbAction(
                        supabase.from('body_measurements').insert(measurementItems),
                        { method: 'POST', path: 'body_measurements', body: measurementItems }
                    );
                }

                const photoItems = (record.photos || []).map(p => ({
                    id: p.id,
                    body_record_id: record.id,
                    user_id: targetUserId, // Denormalized for bulletproof RLS
                    url: p.url,
                    angle: p.angle
                }));

                if (photoItems.length > 0) {
                    await dbAction(
                        supabase.from('body_photos').insert(photoItems),
                        { method: 'POST', path: 'body_photos', body: photoItems }
                    );
                }

                // Finalize
                const updatedRecord = { ...record, userId: targetUserId };
                setRecords(prev => {
                    const filtered = prev.filter(r => r.id !== updatedRecord.id);
                    return [updatedRecord, ...filtered].sort((a, b) =>
                        new Date(b.date).getTime() - new Date(a.date).getTime()
                    );
                });

                fetchRecords().catch(() => { });
                console.timeEnd('[saveRecord] Total');
                return { success: true };
            })();

            return await Promise.race([saveOperation, timeoutPromise]) as { success: boolean, error?: any };
        } catch (error: any) {
            console.timeEnd('[saveRecord] Total');
            console.error('[saveRecord] FATAL ERROR:', error);
            return { success: false, error: { message: error.message || 'Error inesperado al guardar.' } };
        }
    };

    const syncLocalDataToCloud = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return;
        const localRecords: MeasurementRecord[] = JSON.parse(saved);
        if (localRecords.length === 0) return;
        for (const record of localRecords) {
            await saveRecord(record);
        }
        localStorage.removeItem(STORAGE_KEY);
        fetchRecords();
    };

    useEffect(() => {
        fetchRecords();
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
            if (event === 'SIGNED_IN') {
                await syncLocalDataToCloud();
            } else {
                fetchRecords();
            }
        });
        return () => subscription.unsubscribe();
    }, []);

    return {
        records,
        loading,
        saveRecord,
        deleteRecord,
        syncLocalDataToCloud,
        refresh: fetchRecords
    };
};
