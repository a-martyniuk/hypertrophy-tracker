import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { MeasurementRecord, BodyMeasurements, BodyPhoto } from '../types/measurements';

const STORAGE_KEY = 'hypertrophy_measurements';

/**
 * Hook to manage athlete measurements.
 * Features: Local storage fallback, hybrid Supabase/Native save engine, and robust error handling.
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
        /**
         * Translates technical database errors into user-friendly messages.
         */
        const translateError = (error: any): string => {
            const message = error?.message || '';
            const code = error?.code || '';

            if (message.includes('TIMEOUT') || message.includes('signal is aborted')) {
                return 'La conexión es lenta. Estamos intentando guardar en segundo plano.';
            }
            if (code === '42501' || message.includes('403')) {
                return 'No tienes permiso para modificar este registro.';
            }
            if (code === '23503' || message.includes('409')) {
                return 'Error de sincronización. Por favor, intenta de nuevo.';
            }
            return 'Hubo un error al guardar tus medidas. Revisa tu conexión.';
        };

        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('TIMEOUT')), 45000)
        );

        try {
            const saveOperation = (async () => {
                const baseUrl = import.meta.env.VITE_SUPABASE_URL;
                const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

                let token = authSession?.access_token;
                let targetUserId = userId || authSession?.user?.id || record.userId;

                // Recovery of token if missing from props
                if (!token) {
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

                // GUEST MODE: Local Storage only
                if (!targetUserId || targetUserId === 'default-user') {
                    const newRecords = [record, ...records].sort((a, b) =>
                        new Date(b.date).getTime() - new Date(a.date).getTime()
                    );
                    setRecords(newRecords);
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(newRecords));
                    return { success: true };
                }

                let useNativeFallback = false;

                const dbAction = async (libQuery: any, native: { method: string, path: string, body?: any, prefer?: string }) => {
                    if (useNativeFallback) {
                        return nativeFetch(native.method, native.path, native.body, native.prefer);
                    }

                    const result = await Promise.race([
                        libQuery,
                        new Promise((resolve) => setTimeout(() => resolve({ _hang: true }), 5000))
                    ]) as any;

                    if (result._hang) {
                        console.warn(`[saveRecord] Supabase Library HANG for ${native.path}. Activating Native Fallback.`);
                        useNativeFallback = true;
                        return nativeFetch(native.method, native.path, native.body, native.prefer);
                    }
                    if (result.error) throw result.error;
                    return result.data;
                };

                const nativeFetch = async (method: string, path: string, body?: any, prefer?: string) => {
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
                            throw { ...errBody, status: response.status };
                        }

                        return response.status === 204 ? null : response.json().catch(() => null);
                    } catch (err: any) {
                        clearTimeout(fetchTimeout);
                        throw err;
                    }
                };

                // STEP 1: Main Record (UPSERT)
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
                    {
                        method: 'POST',
                        path: 'body_records',
                        body: dbPayload,
                        prefer: 'return=minimal, resolution=merge-duplicates'
                    }
                );

                // STEP 2: Cleanup children to allow fresh insert
                await Promise.all([
                    dbAction(
                        supabase.from('body_measurements').delete().eq('body_record_id', record.id),
                        { method: 'DELETE', path: `body_measurements?body_record_id=eq.${record.id}` }
                    ),
                    dbAction(
                        supabase.from('body_photos').delete().eq('body_record_id', record.id),
                        { method: 'DELETE', path: `body_photos?body_record_id=eq.${record.id}` }
                    )
                ]);

                // STEP 3: Sub-records
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
                            user_id: targetUserId,
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
                    user_id: targetUserId,
                    url: p.url,
                    angle: p.angle
                }));

                if (photoItems.length > 0) {
                    await dbAction(
                        supabase.from('body_photos').insert(photoItems),
                        { method: 'POST', path: 'body_photos', body: photoItems }
                    );
                }

                const updatedRecord = { ...record, userId: targetUserId };
                setRecords(prev => {
                    const filtered = prev.filter(r => r.id !== updatedRecord.id);
                    return [updatedRecord, ...filtered].sort((a, b) =>
                        new Date(b.date).getTime() - new Date(a.date).getTime()
                    );
                });

                fetchRecords().catch(() => { });
                return { success: true };
            })();

            return await Promise.race([saveOperation, timeoutPromise]) as { success: boolean, error?: any };
        } catch (error: any) {
            console.error('[saveRecord] Saving failed:', error);
            return {
                success: false,
                error: { message: translateError(error) }
            };
        }
    };

    const syncLocalDataToCloud = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return;
        try {
            const localRecords: MeasurementRecord[] = JSON.parse(saved);
            if (localRecords.length === 0) return;
            for (const record of localRecords) {
                await saveRecord(record);
            }
            localStorage.removeItem(STORAGE_KEY);
            fetchRecords();
        } catch (err) {
            console.error('[useMeasurements] Sync failed:', err);
        }
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
