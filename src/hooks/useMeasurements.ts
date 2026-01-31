
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

    // --- ROBUST HELPERS ---

    const safeGetToken = async (): Promise<string | null> => {
        // 1. Try prop session first (instant)
        if (authSession?.access_token) return authSession.access_token;

        // 2. Try Supabase session with timeout
        try {
            const sessionPromise = supabase.auth.getSession();
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Auth Timeout')), 5000)
            );
            const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise]) as any;
            return session?.access_token || null;
        } catch (e) {
            console.warn('[safeGetToken] Session fetch failed/timed out:', e);
            return null;
        }
    };

    const robustFetch = async (path: string, options: RequestInit = {}, token: string) => {
        const baseUrl = import.meta.env.VITE_SUPABASE_URL;
        const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s Hard Timeout

        try {
            const res = await fetch(`${baseUrl}/rest/v1/${path}`, {
                ...options,
                headers: {
                    'apikey': anonKey,
                    'Authorization': `Bearer ${token}`,
                    ...options.headers
                },
                signal: controller.signal
            });

            if (!res.ok) {
                const text = await res.text();
                // Treat 404 on DELETE as success (resource already gone)
                if (options.method === 'DELETE' && res.status === 404) return null;
                throw new Error(`HTTP ${res.status}: ${text}`);
            }

            // Return JSON if content exists, otherwise null
            const isJson = res.headers.get('content-type')?.includes('application/json');
            return isJson && res.status !== 204 ? await res.json() : null;
        } finally {
            clearTimeout(timeoutId);
        }
    };

    // --- CORE LOGIC ---

    const fetchRecords = async (forceAuthId?: string) => {
        const effectiveUserId = forceAuthId || userId;
        if (effectiveUserId === 'default-user') return;

        try {
            // 0. Environment Check
            const baseUrl = import.meta.env.VITE_SUPABASE_URL;
            const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
            if (!baseUrl || !anonKey) {
                console.error('[useMeasurements] CRITICAL: Missing Env Vars');
                return;
            }

            // 1. Get Token
            const token = await safeGetToken();
            if (!token) {
                console.warn('[useMeasurements] No auth token available. Aborting refresh.');
                // Fallback to local storage if no auth (e.g. offline/guest)
                const saved = localStorage.getItem(STORAGE_KEY);
                if (saved) setRecords(JSON.parse(saved));
                setLoading(false);
                return;
            }

            // 2. Fetch Data (Native)
            if (effectiveUserId) {
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
                    }, {
                        // Default safety structure
                        arm: { left: 0, right: 0 }, thigh: { left: 0, right: 0 },
                        calf: { left: 0, right: 0 }, forearm: { left: 0, right: 0 },
                        wrist: { left: 0, right: 0 }, ankle: { left: 0, right: 0 },
                        weight: r.weight, bodyFat: r.body_fat_pct
                    }),
                    photos: (r.body_photos || []).map((p: any) => ({
                        id: p.id, url: p.url, angle: p.angle, createdAt: p.created_at
                    }))
                }));

                try {
                    // Optimized Fetch
                    const data = await robustFetch(
                        'body_records?select=*,body_measurements(*),body_photos(*)&order=date.desc&limit=20',
                        { method: 'GET', headers: { 'Prefer': 'count=exact' } },
                        token
                    );
                    if (data) {
                        setRecords(mapData(data));
                        return; // Success
                    }
                } catch (err) {
                    console.error('[useMeasurements] Fetch failed, trying fallback:', err);
                }
            }

            // Fallback: Local Storage
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) setRecords(JSON.parse(saved));

        } catch (err) {
            console.error('[useMeasurements] Refresh logic failed:', err);
        } finally {
            setLoading(false);
        }
    };

    const saveRecord = async (record: MeasurementRecord) => {
        try {
            // 1. Identity Resolution
            let tUid = userId || authSession?.user?.id;
            const token = await safeGetToken();

            // Re-resolve ID from session if missing and token exists
            if (!tUid && token) {
                const { data: { user } } = await supabase.auth.getUser(token);
                tUid = user?.id;
            }

            // GUEST MODE (No Token or No User ID)
            if (!tUid || !token) {
                const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
                const combined = [record, ...existing.filter((r: any) => r.id !== record.id)]
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                setRecords(combined);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(combined));
                return { success: true, target: 'local' };
            }

            // CLOUD MODE
            // Step A: Parent UPSERT
            await robustFetch('body_records', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Prefer': 'return=minimal, resolution=merge-duplicates' },
                body: JSON.stringify({
                    id: record.id, date: record.date, weight: record.measurements.weight,
                    body_fat_pct: record.measurements.bodyFat, notes: record.notes,
                    metadata: record.metadata, user_id: tUid
                })
            }, token);

            // Step B: Cleanup Children
            await Promise.all([
                robustFetch(`body_measurements?body_record_id=eq.${record.id}`, { method: 'DELETE' }, token),
                robustFetch(`body_photos?body_record_id=eq.${record.id}`, { method: 'DELETE' }, token)
            ]);

            // Step C: Insert Measurements
            const m = record.measurements as any;
            const keys = [
                'neck', 'back', 'pecho', 'waist', 'hips', 'weight', 'bodyFat', 'height',
                'arm.left', 'arm.right', 'forearm.left', 'forearm.right',
                'thigh.left', 'thigh.right', 'calf.left', 'calf.right',
                'wrist.left', 'wrist.right', 'ankle.left', 'ankle.right'
            ];
            const items = keys.map(k => {
                const val = k.includes('.') ? m[k.split('.')[0]]?.[k.split('.')[1]] : m[k];
                if (val === undefined || val === null) return null;
                return {
                    body_record_id: record.id, user_id: tUid,
                    type: k, value: val, side: k.includes('.left') ? 'left' : k.includes('.right') ? 'right' : 'center'
                };
            }).filter(Boolean);

            if (items.length > 0) {
                await robustFetch('body_measurements', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(items)
                }, token);
            }

            // Step D: Photos
            if (record.photos?.length) {
                const photos = record.photos.map(p => ({
                    id: p.id, body_record_id: record.id, user_id: tUid,
                    url: p.url, angle: p.angle
                }));
                await robustFetch('body_photos', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(photos)
                }, token);
            }

            // Final Update
            setRecords(prev => [{ ...record, userId: tUid }, ...prev.filter(r => r.id !== record.id)]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

            return { success: true, target: 'cloud' };

        } catch (error: any) {
            console.error('[saveRecord] Save failed:', error);
            const isTimeout = error.message?.includes('Timeout') || error.name === 'AbortError';
            return { success: false, error: { message: isTimeout ? 'Tiempo de espera agotado.' : error.message } };
        }
    };

    const deleteRecord = async (id: string) => {
        const token = await safeGetToken();

        if (!token) {
            const filtered = records.filter(r => r.id !== id);
            setRecords(filtered);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
            return { success: true };
        }

        try {
            // 1. Delete Measurements
            await robustFetch(`body_measurements?body_record_id=eq.${id}`, { method: 'DELETE' }, token);
            // 2. Delete Photos
            await robustFetch(`body_photos?body_record_id=eq.${id}`, { method: 'DELETE' }, token);
            // 3. Delete Parent
            await robustFetch(`body_records?id=eq.${id}`, { method: 'DELETE' }, token);

            setRecords(prev => prev.filter(r => r.id !== id));
            return { success: true };
        } catch (err: any) {
            console.error('[deleteRecord] Failed:', err);
            const isTimeout = err.message?.includes('Timeout') || err.name === 'AbortError';
            return { success: false, error: isTimeout ? 'Tiempo de espera agotado.' : err.message };
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
            console.log(`[useMeasurements] Syncing ${locals.length} local records...`);
            let successCount = 0;
            const remaining: MeasurementRecord[] = [];

            for (const r of locals) {
                const res = await saveRecord(r);
                if (res.success && res.target === 'cloud') successCount++;
                else remaining.push(r);
            }

            if (remaining.length === 0 && successCount > 0) localStorage.removeItem(STORAGE_KEY);
            else if (remaining.length > 0) localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));

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
        records, loading, saveRecord, deleteRecord, refresh: fetchRecords
    };
};
