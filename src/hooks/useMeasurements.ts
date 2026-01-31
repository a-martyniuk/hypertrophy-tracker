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
            console.log('[useMeasurements] No user, loading from localStorage');
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

        const { error } = await supabase
            .from('body_records')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting record:', error);
        } else {
            fetchRecords();
        }
    };

    const saveRecord = async (record: MeasurementRecord) => {
        console.log('[saveRecord] ENTRY. Record ID:', record.id, 'userId provided:', userId);

        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('TIMEOUT')), 45000)
        );

        console.time('[saveRecord] Total Time');
        try {
            const saveOperation = (async () => {
                console.log('[saveRecord] saveOperation starting now...');
                const targetUserId = userId || record.userId;
                console.log('[saveRecord] Using targetUserId:', targetUserId);

                if (!targetUserId || targetUserId === 'default-user') {
                    console.log('[saveRecord] Guest Mode: Saving only to local storage');
                    const newRecords = [record, ...records].sort((a, b) =>
                        new Date(b.date).getTime() - new Date(a.date).getTime()
                    );
                    setRecords(newRecords);
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(newRecords));
                    return { success: true };
                }

                // 2. Save or Update Main Record
                // Split approach for better tracing and RLS compatibility
                const isNew = !record.id || record.id.length < 30; // Random UUIDs are usually 36 chars
                const payload = {
                    id: record.id,
                    date: record.date,
                    weight: record.measurements.weight,
                    body_fat_pct: record.measurements.bodyFat,
                    notes: record.notes,
                    metadata: record.metadata,
                    user_id: targetUserId
                };

                console.log('[saveRecord] Attempting DB write. IsNew Guess:', isNew);
                console.log('[saveRecord] Payload details:', { date: record.date, weight: record.measurements.weight });

                console.time('Step 2: Main Record DB Write');
                // We use single calls instead of consolidated upsert for max visibility
                if (isNew) {
                    console.log('[saveRecord] Calling .insert()...');
                    const { error: insErr } = await supabase.from('body_records').insert(payload);
                    if (insErr) {
                        console.error('[saveRecord] Insert failed:', insErr);
                        // Fallback: If it already exists, try update
                        if (insErr.code === '23505') {
                            console.log('[saveRecord] Conflict detected, trying update fallback...');
                            const { error: fallbackErr } = await supabase
                                .from('body_records')
                                .update(payload)
                                .eq('id', record.id);
                            if (fallbackErr) throw fallbackErr;
                        } else {
                            throw insErr;
                        }
                    }
                } else {
                    console.log('[saveRecord] Calling .update()...');
                    const { error: updErr } = await supabase
                        .from('body_records')
                        .update(payload)
                        .eq('id', record.id);
                    if (updErr) {
                        console.error('[saveRecord] Update failed:', updErr);
                        throw updErr;
                    }
                }
                console.timeEnd('Step 2: Main Record DB Write');
                console.log('[saveRecord] Step 2 complete: Body Record confirmed.');

                // 3. Cleanup Old Sub-records
                console.log('[saveRecord] Starting Step 3: Cleanup old data');
                console.time('Step 3: Cleanup');
                const [delM, delP] = await Promise.all([
                    supabase.from('body_measurements').delete().eq('body_record_id', record.id),
                    supabase.from('body_photos').delete().eq('body_record_id', record.id)
                ]);
                console.timeEnd('Step 3: Cleanup');

                if (delM.error) console.warn('[saveRecord] Measurements delete warning:', delM.error);
                if (delP.error) console.warn('[saveRecord] Photos delete warning:', delP.error);

                // 4. Prepare and Insert New Sub-records
                console.log('[saveRecord] Starting Step 4: Inserting detailed data');
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

                console.time('Step 4: Inserts');
                const insertPromises = [
                    supabase.from('body_measurements').insert(measurementItems)
                ];

                if (photoItems.length > 0) {
                    insertPromises.push(supabase.from('body_photos').insert(photoItems));
                }

                const results = await Promise.all(insertPromises);
                console.timeEnd('Step 4: Inserts');

                for (const res of results) {
                    if (res.error) {
                        console.error('[saveRecord] Sub-record insert error:', res.error);
                        throw res.error;
                    }
                }

                // 6. Local State Synchronization
                console.log('[saveRecord] Syncing local state');
                const updatedRecord = { ...record, userId: targetUserId };
                setRecords(prev => {
                    const filtered = prev.filter(r => r.id !== updatedRecord.id);
                    return [updatedRecord, ...filtered].sort((a, b) =>
                        new Date(b.date).getTime() - new Date(a.date).getTime()
                    );
                });

                fetchRecords().catch(err => console.error('[saveRecord] Background refresh failed:', err));
                console.log('[saveRecord] ALL STEPS COMPLETE');
                console.timeEnd('[saveRecord] Total Time');
                return { success: true };
            })();

            return await Promise.race([saveOperation, timeoutPromise]) as { success: boolean, error?: any };
        } catch (error: any) {
            console.timeEnd('[saveRecord] Total Time');
            console.error('[saveRecord] FATAL ERROR:', error);

            let message = 'Error inesperado al guardar.';
            if (error.message === 'TIMEOUT') {
                message = 'Se agotaron los 45s. Por favor, asegúrate de estar en una ventana de INCÓGNITO.';
            } else if (error.code === '42501') {
                message = 'Error de seguridad (RLS). ¿Ejecutaste el script SQL en Supabase?';
            } else if (error.code) {
                message = `Error de DB (${error.code}): ${error.message}`;
            } else {
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

        console.log('[useMeasurements] Syncing local data to cloud...');
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
