import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { MeasurementRecord, BodyMeasurements } from '../types/measurements';

const STORAGE_KEY = 'hypertrophy_measurements';

export const useMeasurements = () => {
    const [records, setRecords] = useState<MeasurementRecord[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchRecords = async () => {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            // Fallback to local storage if not logged in
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                setRecords(JSON.parse(saved));
            }
            setLoading(false);
            return;
        }

        // Fetch from Supabase
        const { data, error } = await supabase
            .from('body_records')
            .select(`
                *,
                body_measurements (*)
            `)
            .order('date', { ascending: false });

        if (error) {
            console.error('Error fetching measurements:', error);
        } else if (data) {
            const mappedRecords: MeasurementRecord[] = data.map((record: any) => {
                const ms: any = {};
                // Reconstruct the nested measurements object
                record.body_measurements.forEach((m: any) => {
                    if (m.type.includes('.')) {
                        const [base, side] = m.type.split('.');
                        if (!ms[base]) ms[base] = {};
                        ms[base][side] = m.value;
                    } else {
                        ms[m.type] = m.value;
                    }
                });

                return {
                    id: record.id,
                    userId: record.user_id,
                    date: record.date,
                    notes: record.notes,
                    metadata: record.metadata,
                    measurements: ms as BodyMeasurements
                };
            });
            setRecords(mappedRecords);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchRecords();

        // Listen for auth changes to re-fetch
        const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
            fetchRecords();
        });

        return () => subscription.unsubscribe();
    }, []);

    const saveRecord = async (record: MeasurementRecord) => {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            // Save locally
            const newRecords = [record, ...records].sort((a, b) =>
                new Date(b.date).getTime() - new Date(a.date).getTime()
            );
            setRecords(newRecords);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newRecords));
            return;
        }

        // Save to Supabase
        const { data: newRecord, error: recordError } = await supabase
            .from('body_records')
            .insert({
                date: record.date,
                weight: record.measurements.weight,
                notes: record.notes,
                metadata: record.metadata,
                user_id: user.id
            })
            .select()
            .single();

        if (recordError) {
            console.error('Error saving record:', recordError);
            return;
        }

        // Flat the measurements for the relational table
        const measurementItems = [];
        const m = record.measurements as any;

        // Helper to collect all fields
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

        if (mError) {
            console.error('Error saving measurements:', mError);
        } else {
            fetchRecords(); // Refresh
        }
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

    return {
        records,
        loading,
        saveRecord,
        deleteRecord,
        refresh: fetchRecords
    };
};
