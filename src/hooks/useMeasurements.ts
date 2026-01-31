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
            setTimeout(() => reject(new Error('TIMEOUT')), 15000)
        );

        try {
            const saveOperation = (async () => {
                const { data: { user } } = await supabase.auth.getUser();
                const targetUserId = user?.id || record.userId;

                if (!targetUserId) {
                    const newRecords = [record, ...records].sort((a, b) =>
                        new Date(b.date).getTime() - new Date(a.date).getTime()
                    );
                    setRecords(newRecords);
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(newRecords));
                    return { success: true };
                }

                // 1. Save or Update Record
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

                // 2. Save Measurements (relational)
                const { error: delError } = await supabase.from('body_measurements').delete().eq('body_record_id', newRecord.id);
                if (delError) throw delError;

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

                const { error: mError } = await supabase
                    .from('body_measurements')
                    .insert(measurementItems);

                if (mError) throw mError;

                // 3. Save Photos metadata
                if (record.photos && record.photos.length > 0) {
                    const { error: delPhotoError } = await supabase.from('body_photos').delete().eq('body_record_id', newRecord.id);
                    if (delPhotoError) throw delPhotoError;

                    const photoItems = record.photos.map(p => ({
                        id: p.id,
                        body_record_id: newRecord.id,
                        url: p.url,
                        angle: p.angle
                    }));
                    const { error: pError } = await supabase.from('body_photos').insert(photoItems);
                    if (pError) throw pError;
                }

                await fetchRecords();
                return { success: true };
            })();

            return await Promise.race([saveOperation, timeoutPromise]) as { success: boolean, error?: any };
        } catch (error: any) {
            console.error('Error saving record:', error);
            let message = 'Error inesperado al guardar.';
            if (error.message === 'TIMEOUT') {
                message = 'Tiempo de espera agotado. Revisa tu conexión de red.';
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
