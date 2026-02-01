import { supabase } from '../lib/supabaseClient';
import type { MeasurementRecord } from '../types/measurements';

const BASE_URL = import.meta.env.VITE_SUPABASE_URL;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const safeGetToken = async (propSession?: any): Promise<string | null> => {
    // 1. Try prop session first (instant)
    if (propSession?.access_token) return propSession.access_token;

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

export const robustFetch = async (path: string, options: RequestInit = {}, token: string) => {
    if (!BASE_URL || !ANON_KEY) {
        throw new Error('Missing Supabase environment variables');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s Hard Timeout

    try {
        const res = await fetch(`${BASE_URL}/rest/v1/${path}`, {
            ...options,
            headers: {
                'apikey': ANON_KEY,
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

export const fetchCloudRecords = async (token: string): Promise<MeasurementRecord[] | null> => {
    try {
        // Optimized Fetch
        const data = await robustFetch(
            'body_records?select=*,body_measurements(*),body_photos(*)&order=date.desc&limit=20',
            { method: 'GET', headers: { 'Prefer': 'count=exact' } },
            token
        );

        if (!data) return null;

        return data.map((r: any) => ({
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

    } catch (err) {
        console.error('[measurementService] Fetch failed:', err);
        return null;
    }
};

export const saveCloudRecord = async (record: MeasurementRecord, token: string, userId: string) => {
    // Step A: Parent UPSERT
    await robustFetch('body_records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Prefer': 'return=minimal, resolution=merge-duplicates' },
        body: JSON.stringify({
            id: record.id, date: record.date, weight: record.measurements.weight,
            body_fat_pct: record.measurements.bodyFat, notes: record.notes,
            metadata: record.metadata, user_id: userId
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
            body_record_id: record.id, user_id: userId,
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
            id: p.id, body_record_id: record.id, user_id: userId,
            url: p.url, angle: p.angle
        }));
        await robustFetch('body_photos', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(photos)
        }, token);
    }
};

export const deleteCloudRecord = async (id: string, token: string) => {
    // 1. Delete Measurements
    await robustFetch(`body_measurements?body_record_id=eq.${id}`, { method: 'DELETE' }, token);
    // 2. Delete Photos
    await robustFetch(`body_photos?body_record_id=eq.${id}`, { method: 'DELETE' }, token);
    // 3. Delete Parent
    await robustFetch(`body_records?id=eq.${id}`, { method: 'DELETE' }, token);
};
