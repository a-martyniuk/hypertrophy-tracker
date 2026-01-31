import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { MeasurementRecord, BodyMeasurements, BodyPhoto } from '../types/measurements';

const STORAGE_KEY = 'hypertrophy_measurements';

export const useMeasurements = (userId?: string | null) => {
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
        console.log('[saveRecord] Hybrid Entry. ID:', record.id);

        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('TIMEOUT')), 45000)
        );

        console.time('[saveRecord] Total');
        try {
            const saveOperation = (async () => {
                // 1. Warm up session and get token
                console.time('Step 1: Session Warmup');
                const sessionResult = await Promise.race([
                    supabase.auth.getSession(),
                    new Promise((resolve) => setTimeout(() => resolve({ data: { session: null }, error: new Error('session_timeout') }), 3000))
                ]) as any;
                const session = sessionResult.data?.session;
                const targetUserId = userId || session?.user?.id || record.userId;
                console.timeEnd('Step 1: Session Warmup');

                if (!targetUserId || targetUserId === 'default-user') {
                    console.log('[saveRecord] Local mode');
                    const newRecords = [record, ...records].sort((a, b) =>
                        new Date(b.date).getTime() - new Date(a.date).getTime()
                    );
                    setRecords(newRecords);
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(newRecords));
                    return { success: true };
                }

                // 2. Hybrid DB Write
                const dbPayload = {
                    id: record.id,
                    date: record.date,
                    weight: record.measurements.weight,
                    body_fat_pct: record.measurements.bodyFat,
                    notes: record.notes,
                    metadata: record.metadata,
                    user_id: targetUserId
                };

                const isNew = !record.id || record.id.length < 30;
                console.log('[saveRecord] Mode:', isNew ? 'INSERT' : 'UPDATE', 'Payload:', dbPayload);

                const performWrite = async () => {
                    // Try library first with a 5s race
                    console.time('Step 2: Library Call');
                    const libCall = isNew
                        ? supabase.from('body_records').insert(dbPayload)
                        : supabase.from('body_records').update(dbPayload).eq('id', record.id);

                    const result = await Promise.race([
                        libCall,
                        new Promise((resolve) => setTimeout(() => resolve({ error: { message: 'LIB_HANG' } }), 5000))
                    ]) as any;
                    console.timeEnd('Step 2: Library Call');

                    if (result.error?.message === 'LIB_HANG') {
                        console.warn('[saveRecord] Library HANG detected. Falling back to native fetch...');
                        const baseUrl = import.meta.env.VITE_SUPABASE_URL;
                        const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

                        const fetchUrl = isNew
                            ? `${baseUrl}/rest/v1/body_records`
                            : `${baseUrl}/rest/v1/body_records?id=eq.${record.id}`;

                        const fetchResponse = await fetch(fetchUrl, {
                            method: isNew ? 'POST' : 'PATCH',
                            headers: {
                                'apikey': anonKey,
                                'Authorization': `Bearer ${session?.access_token}`,
                                'Content-Type': 'application/json',
                                'Prefer': isNew ? 'return=minimal' : ''
                            },
                            body: JSON.stringify(dbPayload)
                        });

                        if (!fetchResponse.ok) {
                            const errBody = await fetchResponse.json().catch(() => ({}));
                            throw new Error(`Native fetch failed: ${fetchResponse.status} ${JSON.stringify(errBody)}`);
                        }
                        console.log('[saveRecord] Native fetch SUCCESS.');
                    } else if (result.error) {
                        throw result.error;
                    }
                };

                await performWrite();

                // 3. Cleanup and Sub-records (Standard Library Calls)
                console.time('Step 3: Cleanup old data');
                await Promise.all([
                    supabase.from('body_measurements').delete().eq('body_record_id', record.id),
                    supabase.from('body_photos').delete().eq('body_record_id', record.id)
                ]);
                console.timeEnd('Step 3: Cleanup old data');

                // 4. Detailed Inserts
                const measurementItems = [];
                const m = record.measurements as any;
                const keys = ['neck', 'back', 'pecho', 'waist', 'hips', 'weight', 'bodyFat', 'arm.left', 'arm.right', 'thigh.left', 'thigh.right', 'calf.left', 'calf.right'];

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
                            type: key,
                            value: value,
                            side: key.includes('.left') ? 'left' : key.includes('.right') ? 'right' : 'center'
                        });
                    }
                }

                const photoItems = (record.photos || []).map(p => ({
                    id: p.id,
                    body_record_id: record.id,
                    url: p.url,
                    angle: p.angle
                }));

                console.time('Step 4: Sub-record inserts');
                const insertPromises = [
                    supabase.from('body_measurements').insert(measurementItems)
                ];
                if (photoItems.length > 0) {
                    insertPromises.push(supabase.from('body_photos').insert(photoItems));
                }
                const subResults = await Promise.all(insertPromises);
                console.timeEnd('Step 4: Sub-record inserts');

                for (const res of subResults) {
                    if (res.error) {
                        console.error('[saveRecord] Sub-record error:', res.error);
                        // If it's just RLS, we don't crash the whole thing but we warn
                        if (res.error.code !== '42501') throw res.error;
                    }
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
            let message = 'Error inesperado al guardar.';
            if (error.message === 'TIMEOUT') {
                message = 'Se agotaron los 45s. Es posible que tu red esté bloqueando la conexión a Supabase.';
            } else if (error.code === '42501') {
                message = 'Error de seguridad (RLS). Por favor, revisa tus políticas en Supabase.';
            } else if (error.message) {
                message = error.message;
            }
            return { success: false, error: { ...error, message } };
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
