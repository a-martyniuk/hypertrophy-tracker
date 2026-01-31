import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { MeasurementRecord, BodyMeasurements, BodyPhoto } from '../types/measurements';

const STORAGE_KEY = 'hypertrophy_measurements';

export const useMeasurements = (userId?: string | null) => {
    const [records, setRecords] = useState<MeasurementRecord[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchRecords = async () => {
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
            console.error('Error fetching measurements:', error);
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

                const photos: BodyPhoto[] = record.body_photos.map((p: any) => ({
                    id: p.id,
                    url: p.url,
                    angle: p.angle,
                    createdAt: p.created_at
                }));

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
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('TIMEOUT')), 45000)
        );

        console.time('saveRecord Total');
        try {
            const saveOperation = (async () => {
                console.log('[saveRecord] Starting save operation. userId provided:', userId);

                // 1. Use provided userId directly to avoid the hanging getSession call
                console.time('Step 1: Auth (Local)');
                const targetUserId = userId || record.userId;
                console.timeEnd('Step 1: Auth (Local)');

                if (!targetUserId || targetUserId === 'default-user') {
                    console.log('[saveRecord] No valid user ID, saving to local storage...');
                    const newRecords = [record, ...records].sort((a, b) =>
                        new Date(b.date).getTime() - new Date(a.date).getTime()
                    );
                    setRecords(newRecords);
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(newRecords));
                    return { success: true };
                }

                // 2. Save or Update Main Record
                console.time('Step 2a: Upsert Payload Preparation');
                const upsertData = {
                    id: record.id.length > 30 ? record.id : undefined,
                    date: record.date,
                    weight: record.measurements.weight,
                    notes: record.notes,
                    metadata: record.metadata,
                    user_id: targetUserId
                };
                console.log('[saveRecord] Upsert Payload:', upsertData);
                console.timeEnd('Step 2a: Upsert Payload Preparation');

                console.time('Step 2b: Execution of Upsert');
                const { data: upsertResult, error: recordError } = await supabase
                    .from('body_records')
                    .upsert(upsertData)
                    .select('id');
                console.timeEnd('Step 2b: Execution of Upsert');

                if (recordError) {
                    console.error('[saveRecord] Error in main record upsert:', recordError);
                    throw recordError;
                }

                if (!upsertResult || upsertResult.length === 0) {
                    throw new Error('No se recibió confirmación del registro creado.');
                }

                const newRecordId = upsertResult[0].id;
                console.log('[saveRecord] Record saved successfully with ID:', newRecordId);

                // 3. Parallelize Deletions
                console.time('Step 3: Parallel Deletions');
                const [delM, delP] = await Promise.all([
                    supabase.from('body_measurements').delete().eq('body_record_id', newRecordId),
                    supabase.from('body_photos').delete().eq('body_record_id', newRecordId)
                ]);
                console.timeEnd('Step 3: Parallel Deletions');

                if (delM.error) console.error('[saveRecord] Warning: Measurements deletion error:', delM.error);
                if (delP.error) console.error('[saveRecord] Warning: Photos deletion error:', delP.error);

                // 4. Prepare inserts
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

                    if (value !== undefined) {
                        measurementItems.push({
                            body_record_id: newRecordId,
                            type: key,
                            value: value,
                            side: key.includes('.left') ? 'left' : key.includes('.right') ? 'right' : 'center'
                        });
                    }
                }

                const photoItems = (record.photos || []).map(p => ({
                    id: p.id,
                    body_record_id: newRecordId,
                    url: p.url,
                    angle: p.angle
                }));

                // 5. Parallelize Inserts
                console.time('Step 4: Parallel Inserts');
                const insertPromises = [
                    supabase.from('body_measurements').insert(measurementItems)
                ];
                if (photoItems.length > 0) {
                    insertPromises.push(supabase.from('body_photos').insert(photoItems));
                }

                const insertResults = await Promise.all(insertPromises);
                console.timeEnd('Step 4: Parallel Inserts');

                for (const res of insertResults) {
                    if (res.error) {
                        console.error('[saveRecord] Error in inserts:', res.error);
                        throw res.error;
                    }
                }

                // 6. Finalize Local State
                console.log('[saveRecord] Finalizing local state...');
                const updatedRecord = { ...record, id: newRecordId, userId: targetUserId };
                setRecords(prev => {
                    const filtered = prev.filter(r => r.id !== updatedRecord.id);
                    return [updatedRecord, ...filtered].sort((a, b) =>
                        new Date(b.date).getTime() - new Date(a.date).getTime()
                    );
                });

                fetchRecords().catch(err => console.error('[saveRecord] Background refresh failed:', err));
                console.timeEnd('saveRecord Total');
                return { success: true };
            })();

            return await Promise.race([saveOperation, timeoutPromise]) as { success: boolean, error?: any };
        } catch (error: any) {
            console.timeEnd('saveRecord Total');
            console.error('[saveRecord] Fatal error:', error);
            let message = 'Error inesperado al guardar.';
            if (error.message === 'TIMEOUT') {
                message = 'Se agotaron los 45s. Por favor, abre la consola (F12) y dinos en qué paso se quedó el proceso.';
            } else if (error.code) {
                message = `Error de base de datos (${error.code}): ${error.message}`;
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
            const { data: existing } = await supabase
                .from('body_records')
                .select('id')
                .eq('user_id', user.id)
                .eq('date', record.date)
                .maybeSingle();

            if (!existing) {
                await saveRecord(record);
            }
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
