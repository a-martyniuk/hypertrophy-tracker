import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { MeasurementRecord } from '../types/measurements';

const STORAGE_KEY = 'hypertrophy_measurements';

/**
 * Hook to manage athlete measurements with high performance and data safety.
 */
export const useMeasurements = (userId?: string | null, authSession?: any | null) => {
    const [records, setRecords] = useState<MeasurementRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const isSyncing = useRef(false);

    const fetchRecords = async (forceAuthId?: string) => {
        const effectiveUserId = forceAuthId || userId;
        if (effectiveUserId === 'default-user') return;

        try {
            console.log('[useMeasurements] Fetching for user:', effectiveUserId);
            if (effectiveUserId) {
                // UTILITY: Helper to map raw DB response to app Type
                const mapData = (rawRecords: any[]) => rawRecords.map((r: any) => ({
                    id: r.id,
                    userId: r.user_id,
                    date: r.date,
                    notes: r.notes,
                    metadata: r.metadata,
                    measurements: (r.body_measurements || []).reduce((acc: any, m: any) => {
                        if (m.type.includes('.')) {
                            const [b, s] = m.type.split('.');
                            if (!acc[b]) acc[b] = {};
                            acc[b][s] = m.value;
                        } else acc[m.type] = m.value;
                        return acc;
                    }, {}),
                    photos: (r.body_photos || []).map((p: any) => ({
                        id: p.id, url: p.url, angle: p.angle, createdAt: p.created_at
                    }))
                }));

                // UTILITY: Native Fallback Engine
                const executeQuery = async (queryPromise: Promise<any>, fallbackPath: string) => {
                    // 1. Try SDK with Timeout Race
                    try {
                        const race = await Promise.race([
                            queryPromise,
                            new Promise(resolve => setTimeout(() => resolve('TIMEOUT'), 7000))
                        ]);

                        if (race !== 'TIMEOUT') return race as { data: any, error: any };
                        console.warn(`[useMeasurements] SDK Timeout on ${fallbackPath}. Switching to Native Fetch.`);
                    } catch (e) {
                        console.error('[useMeasurements] SDK Exception:', e);
                    }

                    // 2. Native Fallback
                    try {
                        const { data: { session } } = await supabase.auth.getSession();
                        if (!session) return { data: null, error: 'No Session' };

                        const url = import.meta.env.VITE_SUPABASE_URL;
                        const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

                        const res = await fetch(`${url}/rest/v1/${fallbackPath}`, {
                            headers: {
                                'apikey': key,
                                'Authorization': `Bearer ${session.access_token}`,
                                'Prefer': 'count=none'
                            }
                        });

                        if (!res.ok) throw await res.text();
                        return { data: await res.json(), error: null };
                    } catch (err) {
                        return { data: null, error: err };
                    }
                };

                // ATTEMPT 1: Full Data (Join)
                const { data, error } = await executeQuery(
                    supabase.from('body_records')
                        .select('*, body_measurements (*), body_photos (*)')
                        .order('date', { ascending: false }) as any,
                    'body_records?select=*,body_measurements(*),body_photos(*)&order=date.desc'
                );

                if (!error && data && data.length > 0) {
                    console.log(`[useMeasurements] Full fetch success: ${data.length} records.`);
                    setRecords(mapData(data));
                    return;
                }

                if (error) console.warn('[useMeasurements] Full fetch error:', error);

                // ATTEMPT 2: Parent Only (Fallback for RLS/Join issues)
                console.log('[useMeasurements] Attempting parent-only fetch...');
                const { data: parentData, error: parentError } = await executeQuery(
                    supabase.from('body_records').select('*').order('date', { ascending: false }) as any,
                    'body_records?select=*&order=date.desc'
                );

                if (parentError) {
                    console.error('[useMeasurements] CRITICAL: Parent table inaccessible:', parentError);
                } else if (parentData && parentData.length > 0) {
                    console.log(`[useMeasurements] Parent-only success: ${parentData.length} records found (details missing).`);
                    // We found parents! The issue is definitely the child join policies.
                    setRecords(mapData(parentData)); // Will produce entries with empty measurements/photos
                    return;
                } else {
                    console.log('[useMeasurements] Parent table query returned 0 records.');
                }
            }
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) setRecords(JSON.parse(saved));
        } catch (err) {
            console.error('[useMeasurements] Refresh failed:', err);
        } finally {
            setLoading(false);
        }
    };

    const saveRecord = async (record: MeasurementRecord) => {
        const translateError = (error: any): string => {
            const msg = error?.message || error?.msg || '';
            const status = error?.status;
            console.error('[saveRecord] Technical breakdown:', { status, msg, error });

            if (status === 403 || msg.includes('403')) return 'Error 403: RLS bloqueado. Por favor, ejecuta el script SQL de denormalización provisto.';
            if (msg.includes('column') && msg.includes('not found')) return 'Error de esquema: El script SQL no se ha ejecutado completamente.';
            if (msg.includes('TIMEOUT')) return 'Tiempo de espera agotado. Reintenta.';
            return `Error al guardar (${status || '?'}). Revisa la consola para detalles.`;
        };

        try {
            const saveOperation = (async () => {
                const baseUrl = import.meta.env.VITE_SUPABASE_URL;
                const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

                // 1. Identity Resolution
                let token = authSession?.access_token;
                let tUid = userId || authSession?.user?.id;
                if (!tUid || tUid === 'default-user') {
                    const { data: { session } } = await supabase.auth.getSession();
                    token = session?.access_token;
                    tUid = session?.user?.id;
                }

                // GUEST MODE
                if (!tUid) {
                    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
                    const combined = [record, ...existing.filter((r: any) => r.id !== record.id)].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                    setRecords(combined);
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(combined));
                    return { success: true, target: 'local' };
                }

                // CLOUD MODE (Native Fallback to bypass SDK hangs)
                const nativeExec = async (method: string, path: string, body?: any) => {
                    const ctrl = new AbortController();
                    const timer = setTimeout(() => ctrl.abort(), 20000);
                    try {
                        const res = await fetch(`${baseUrl}/rest/v1/${path}`, {
                            method,
                            signal: ctrl.signal,
                            headers: {
                                'apikey': anonKey,
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json',
                                'Prefer': method === 'POST' ? 'return=minimal, resolution=merge-duplicates' : ''
                            },
                            body: body ? JSON.stringify(body) : undefined
                        });
                        if (!res.ok) {
                            const err = await res.json().catch(() => ({ message: 'Net Error' }));
                            throw { ...err, status: res.status };
                        }
                        return res.status === 204 ? null : res.json().catch(() => null);
                    } finally { clearTimeout(timer); }
                };

                // STEP A: Parent UPSERT
                await nativeExec('POST', 'body_records', {
                    id: record.id, date: record.date, weight: record.measurements.weight,
                    body_fat_pct: record.measurements.bodyFat, notes: record.notes,
                    metadata: record.metadata, user_id: tUid
                });

                // STEP B: Cleanup Children
                await nativeExec('DELETE', `body_measurements?body_record_id=eq.${record.id}`);
                await nativeExec('DELETE', `body_photos?body_record_id=eq.${record.id}`);

                // STEP C: Insert Measurements (Smart Fallback)
                const m = record.measurements as any;
                const keys = ['neck', 'back', 'pecho', 'waist', 'hips', 'weight', 'bodyFat', 'arm.left', 'arm.right', 'thigh.left', 'thigh.right', 'calf.left', 'calf.right'];
                const items = keys.map(k => {
                    const val = k.includes('.') ? m[k.split('.')[0]]?.[k.split('.')[1]] : m[k];
                    if (val === undefined || val === null) return null;
                    return {
                        body_record_id: record.id, user_id: tUid, // Attempt denormalized
                        type: k, value: val, side: k.includes('.left') ? 'left' : k.includes('.right') ? 'right' : 'center'
                    };
                }).filter(Boolean);

                if (items.length > 0) {
                    try {
                        await nativeExec('POST', 'body_measurements', items);
                    } catch (err: any) {
                        // FALLBACK: If user_id column doesn't exist yet, retry without it
                        if (err.message?.includes('column "user_id" of relation "body_measurements" does not exist')) {
                            const legacyItems = items.map(({ user_id, ...rest }: any) => rest);
                            await nativeExec('POST', 'body_measurements', legacyItems);
                        } else throw err;
                    }
                }

                // STEP D: Photos (Smart Fallback)
                if (record.photos?.length) {
                    const photos = record.photos.map(p => ({
                        id: p.id, body_record_id: record.id, user_id: tUid,
                        url: p.url, angle: p.angle
                    }));
                    try {
                        await nativeExec('POST', 'body_photos', photos);
                    } catch (err: any) {
                        if (err.message?.includes('column "user_id" of relation "body_photos" does not exist')) {
                            const legacyPhotos = photos.map(({ user_id, ...rest }: any) => rest);
                            await nativeExec('POST', 'body_photos', legacyPhotos);
                        } else throw err;
                    }
                }

                // Final Update
                setRecords(prev => [{ ...record, userId: tUid }, ...prev.filter(r => r.id !== record.id)].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
                fetchRecords().catch(() => { });
                return { success: true, target: 'cloud' };
            })();

            return await Promise.race([saveOperation, new Promise((_, r) => setTimeout(() => r(new Error('TIMEOUT')), 45000))]) as any;
        } catch (error: any) {
            return { success: false, error: { message: translateError(error) } };
        }
    };

    const sync = async () => {
        if (isSyncing.current) return;
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return;
        const locals: MeasurementRecord[] = JSON.parse(saved);
        if (!locals.length) return;

        isSyncing.current = true;
        try {
            const remaining: MeasurementRecord[] = [];
            for (const r of locals) {
                const res = await saveRecord(r);
                if (!res.success || res.target !== 'cloud') remaining.push(r);
            }
            if (!remaining.length) localStorage.removeItem(STORAGE_KEY);
            else localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
            await fetchRecords();
        } finally { isSyncing.current = false; }
    };

    useEffect(() => {
        const init = async () => {
            if (userId && userId !== 'default-user') { await sync(); await fetchRecords(userId); }
            else await fetchRecords();
        };
        init();
    }, [userId]);

    return {
        records, loading, saveRecord,
        deleteRecord: async (id: string) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                const filtered = records.filter(r => r.id !== id);
                setRecords(filtered);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
                return;
            }
            try {
                await supabase.from('body_records').delete().eq('id', id);
                fetchRecords();
            } catch (err) { console.error('[delete] Cloud op failed:', err); }
        },
        refresh: fetchRecords
    };
};
