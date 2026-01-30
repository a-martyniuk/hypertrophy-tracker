import { useState, useEffect } from 'react';
import type { GrowthGoal } from '../types/measurements';

const STORAGE_KEY = 'hypertrophy_goals';

export const useGoals = () => {
    const [goals, setGoals] = useState<GrowthGoal[]>([]);

    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                setGoals(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to load goals', e);
            }
        }
    }, []);

    const addGoal = (goal: Omit<GrowthGoal, 'id' | 'createdAt'>) => {
        const newGoal: GrowthGoal = {
            ...goal,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
        };
        const newGoals = [...goals, newGoal];
        setGoals(newGoals);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newGoals));
    };

    const deleteGoal = (id: string) => {
        const newGoals = goals.filter(g => g.id !== id);
        setGoals(newGoals);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newGoals));
    };

    const updateGoalStatus = (id: string, status: GrowthGoal['status']) => {
        const newGoals = goals.map(g => g.id === id ? { ...g, status } : g);
        setGoals(newGoals);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newGoals));
    };

    return {
        goals,
        addGoal,
        deleteGoal,
        updateGoalStatus,
    };
};
