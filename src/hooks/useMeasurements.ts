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
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('TIMEOUT')), 45000)
        );

        console.time('[saveRecord] Total Time');
        try {
            const saveOperation = (async () => {
                const targetUserId = userId || record.userId;

                if (!targetUserId || targetUserId === 'default-user') {
                    const newRecords = [record, ...records].sort((a, b) =>
                        new Date(b.date).getTime() - new Date(a.date).getTime()
                    );
                    setRecords(newRecords);
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(newRecords));
                    return { success: true };
                }

                // 2. Upsert Main Record
                // We use upsert as it's the most reliable way to handle both new and existing records
                // but we omit the slow .select().single() to avoid RLS-returning bottlenecks
                console.time('Step 2: Main Record Save');
                const { error: recordError } = await supabase
                    .from('body_records')
                    .upsert({
                        id: record.id,
                        date: record.date,
                        weight: record.measurements.weight,
                        body_fat_pct: record.measurements.bodyFat,
                        notes: record.notes,
                        metadata: record.metadata,
                        user_id: targetUserId
                    });
                console.timeEnd('Step 2: Main Record Save');

                if (recordError) {
                    console.error('[saveRecord] Error saving main record:', recordError);
                    throw recordError;
                }

                // since we have the ID from the client, we use it directly
                const finalRecordId = record.id;

                // 3. Parallelize Deletions (Old measurements and photos)
                console.time('Step 3: Cleanup');
                const [delM, delP] = await Promise.all([
                    supabase.from('body_measurements').delete().eq('body_record_id', finalRecordId),
                    supabase.from('body_photos').delete().eq('body_record_id', finalRecordId).maybeSingle() // maybeSingle to handle missing table gracefully if user hasn't run SQL yet
                ]);
                console.timeEnd('Step 3: Cleanup');

                // 4. Prepare and Parallelize Inserts
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
                            body_record_id: finalRecordId,
                            type: key,
                            value: value,
                            side: key.includes('.left') ? 'left' : key.includes('.right') ? 'right' : 'center'
                        });
                    }
                }

                const photoItems = (record.photos || []).map(p => ({
                    id: p.id,
                    body_record_id: finalRecordId,
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

                const insertResults = await Promise.all(insertPromises);
                console.timeEnd('Step 4: Inserts');

                for (const res of insertResults) {
                    if (res.error) {
                        console.error('[saveRecord] Insert error:', res.error);
                        throw res.error;
                    }
                }

                // 6. Finalize Local State
                const updatedRecord = { ...record, id: finalRecordId, userId: targetUserId };
                setRecords(prev => {
                    const filtered = prev.filter(r => r.id !== updatedRecord.id);
                    return [updatedRecord, ...filtered].sort((a, b) =>
                        new Date(b.date).getTime() - new Date(a.date).getTime()
                    );
                });

                fetchRecords().catch(err => console.error('[saveRecord] Background sync failed:', err));
                console.timeEnd('[saveRecord] Total Time');
                return { success: true };
            })();

            return await Promise.race([saveOperation, timeoutPromise]) as { success: boolean, error?: any };
        } catch (error: any) {
            console.timeEnd('[saveRecord] Total Time');
            console.error('[saveRecord] Fatal error:', error);
            let message = 'Error inesperado al guardar.';
            if (error.message === 'TIMEOUT') {
                message = 'Se agotaron los 45s. Si el problema persiste, intenta en ventana de INCÓGNITO.';
            } else if (error.code === '42501') {
                message = 'Error de permisos (RLS). Por favor, ejecuta el script SQL proporcionado para actualizar la seguridad de la base de datos.';
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
