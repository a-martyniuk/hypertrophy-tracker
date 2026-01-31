import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { MeasurementRecord, BodyMeasurements, BodyPhoto } from '../types/measurements';

const STORAGE_KEY = 'hypertrophy_measurements';

export const useMeasurements = () => {
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

        try {
            const saveOperation = (async () => {
                const { data: { user: authUser } } = await supabase.auth.getUser();
                const targetUserId = authUser?.id || record.userId;

                if (!targetUserId) {
                    const newRecords = [record, ...records].sort((a, b) =>
                        new Date(b.date).getTime() - new Date(a.date).getTime()
                    );
                    setRecords(newRecords);
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(newRecords));
                    return { success: true };
                }

                // 1. Save or Update Main Record
                const { data: newRecord, error: recordError } = await supabase
                    .from('body_records')
                    .upsert({
                        id: record.id.length > 30 ? record.id : undefined,
                        date: record.date,
                        weight: record.measurements.weight,
                        notes: record.notes,
                        metadata: record.metadata,
                        user_id: targetUserId
                    })
                    .select()
                    .single();

                if (recordError) throw recordError;

                // 2. Parallelize Deletions of child records (ONLY for this specific record)
                await Promise.all([
                    supabase.from('body_measurements').delete().eq('body_record_id', newRecord.id),
                    supabase.from('body_photos').delete().eq('body_record_id', newRecord.id)
                ]);

                // 3. Prepare inserts
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
                            body_record_id: newRecord.id,
                            type: key,
                            value: value,
                            side: key.includes('.left') ? 'left' : key.includes('.right') ? 'right' : 'center'
                        });
                    }
                }

                const photoItems = (record.photos || []).map(p => ({
                    id: p.id,
                    body_record_id: newRecord.id,
                    url: p.url,
                    angle: p.angle
                }));

                // 4. Parallelize Inserts
                const insertPromises = [
                    supabase.from('body_measurements').insert(measurementItems)
                ];
                if (photoItems.length > 0) {
                    insertPromises.push(supabase.from('body_photos').insert(photoItems));
                }

                const insertResults = await Promise.all(insertPromises);
                for (const res of insertResults) {
                    if (res.error) throw res.error;
                }

                // 5. Optimistic Update: Update local state immediately with the new record
                const updatedRecord = { ...record, id: newRecord.id, userId: targetUserId };
                setRecords(prev => {
                    const filtered = prev.filter(r => r.id !== updatedRecord.id);
                    return [updatedRecord, ...filtered].sort((a, b) =>
                        new Date(b.date).getTime() - new Date(a.date).getTime()
                    );
                });

                // Trigger background refresh but don't wait for it to return success
                fetchRecords().catch(err => console.error('Background refresh failed:', err));

                return { success: true };
            })();

            return await Promise.race([saveOperation, timeoutPromise]) as { success: boolean, error?: any };
        } catch (error: any) {
            console.error('Error saving record:', error);
            let message = 'Error inesperado al guardar.';
            if (error.message === 'TIMEOUT') {
                message = 'Tiempo de espera agotado después de 45s. Es posible que los datos se hayan guardado pero la confirmación falló. Revisa tu historial.';
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
