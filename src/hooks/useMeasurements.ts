import { useState, useEffect } from 'react';
import type { MeasurementRecord } from '../types/measurements';

const STORAGE_KEY = 'hypertrophy_measurements';

export const useMeasurements = () => {
    const [records, setRecords] = useState<MeasurementRecord[]>([]);

    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                setRecords(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to load measurements', e);
            }
        }
    }, []);

    const saveRecord = (record: MeasurementRecord) => {
        const newRecords = [...records, record].sort((a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setRecords(newRecords);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newRecords));
    };

    const deleteRecord = (id: string) => {
        const newRecords = records.filter(r => r.id !== id);
        setRecords(newRecords);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newRecords));
    };

    const updateRecord = (updatedRecord: MeasurementRecord) => {
        const newRecords = records.map(r => r.id === updatedRecord.id ? updatedRecord : r);
        setRecords(newRecords);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newRecords));
    };

    return {
        records,
        saveRecord,
        deleteRecord,
        updateRecord,
    };
};
