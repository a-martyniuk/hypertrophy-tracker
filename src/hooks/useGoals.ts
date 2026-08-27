import { useState, useEffect, useCallback } from 'react';
import {
    collection,
    doc,
    getDocs,
    setDoc,
    deleteDoc,
    query,
    orderBy
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import type { GrowthGoal } from '../types/measurements';

import { getGoalsStorageKey } from '../utils/storageKeys';

export const useGoals = (userId?: string) => {
    const [goals, setGoals] = useState<GrowthGoal[]>([]);

    const fetchGoals = useCallback(async () => {
        const storageKey = getGoalsStorageKey(userId);

        if (!userId || userId === 'guest' || !isFirebaseConfigured) {
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                try {
                    setGoals(JSON.parse(saved));
                } catch {
                    setGoals([]);
                }
            } else {
                setGoals([]);
            }
            return;
        }

        try {
            const goalsRef = collection(db, 'users', userId, 'goals');
            const q = query(goalsRef, orderBy('createdAt', 'desc'));
            const snapshot = await getDocs(q);

            const mappedGoals: GrowthGoal[] = [];
            snapshot.forEach((d) => {
                const data = d.data();
                mappedGoals.push({
                    id: d.id,
                    userId: data.userId || userId,
                    measurementType: data.measurementType,
                    targetValue: data.targetValue,
                    targetDate: data.targetDate,
                    status: data.status,
                    createdAt: data.createdAt
                });
            });

            setGoals(mappedGoals);
            localStorage.setItem(storageKey, JSON.stringify(mappedGoals));
        } catch (error) {
            console.error('[useGoals] Error al obtener objetivos de Firestore:', error);
        }
    }, [userId]);

    const addGoal = async (goal: Omit<GrowthGoal, 'id' | 'createdAt'>) => {
        const isCloud = isFirebaseConfigured && userId && userId !== 'guest';
        const newId = crypto.randomUUID();
        const createdAt = new Date().toISOString();
        const storageKey = getGoalsStorageKey(userId);

        const newGoal: GrowthGoal = {
            ...goal,
            id: newId,
            createdAt,
            userId: isCloud ? userId : 'guest'
        };

        if (!isCloud) {
            const newGoals = [newGoal, ...goals];
            setGoals(newGoals);
            localStorage.setItem(storageKey, JSON.stringify(newGoals));
            return;
        }

        try {
            const goalDocRef = doc(db, 'users', userId, 'goals', newId);
            await setDoc(goalDocRef, newGoal);
            setGoals(prev => [newGoal, ...prev]);
        } catch (error) {
            console.error('[useGoals] Error al insertar objetivo en Firestore:', error);
            throw error;
        }
    };

    const deleteGoal = async (id: string) => {
        const isCloud = isFirebaseConfigured && userId && userId !== 'guest';
        const storageKey = getGoalsStorageKey(userId);

        if (!isCloud) {
            const newGoals = goals.filter(g => g.id !== id);
            setGoals(newGoals);
            localStorage.setItem(storageKey, JSON.stringify(newGoals));
            return;
        }

        try {
            const goalDocRef = doc(db, 'users', userId, 'goals', id);
            await deleteDoc(goalDocRef);
            setGoals(prev => prev.filter(g => g.id !== id));
        } catch (error) {
            console.error('[useGoals] Error al eliminar objetivo de Firestore:', error);
            throw error;
        }
    };

    useEffect(() => {
        let isMounted = true;
        const init = async () => {
            if (isMounted) await fetchGoals();
        };
        void init();
        return () => { isMounted = false; };
    }, [userId, fetchGoals]);

    return {
        goals,
        addGoal,
        deleteGoal,
        refresh: fetchGoals
    };
};
