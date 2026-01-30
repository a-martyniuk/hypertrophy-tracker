import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { GrowthGoal } from '../types/measurements';

const STORAGE_KEY = 'hypertrophy_goals';

export const useGoals = () => {
    const [goals, setGoals] = useState<GrowthGoal[]>([]);

    const fetchGoals = async () => {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                setGoals(JSON.parse(saved));
            }
            return;
        }

        const { data, error } = await supabase
            .from('growth_goals')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching goals:', error);
        } else if (data) {
            const mappedGoals: GrowthGoal[] = data.map((g: any) => ({
                id: g.id,
                userId: g.user_id,
                measurementType: g.measurement_type,
                targetValue: g.target_value,
                targetDate: g.target_date,
                status: g.status,
                createdAt: g.created_at
            }));
            setGoals(mappedGoals);
        }
    };

    useEffect(() => {
        fetchGoals();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
            fetchGoals();
        });

        return () => subscription.unsubscribe();
    }, []);

    const addGoal = async (goal: Omit<GrowthGoal, 'id' | 'createdAt'>) => {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            const newGoal: GrowthGoal = {
                ...goal,
                id: crypto.randomUUID(),
                createdAt: new Date().toISOString(),
            };
            const newGoals = [newGoal, ...goals];
            setGoals(newGoals);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newGoals));
            return;
        }

        const { error } = await supabase
            .from('growth_goals')
            .insert({
                user_id: user.id,
                measurement_type: goal.measurementType,
                target_value: goal.targetValue,
                target_date: goal.targetDate,
                status: goal.status
            });

        if (error) {
            console.error('Error adding goal:', error);
        } else {
            fetchGoals();
        }
    };

    const deleteGoal = async (id: string) => {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            const newGoals = goals.filter(g => g.id !== id);
            setGoals(newGoals);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newGoals));
            return;
        }

        const { error } = await supabase
            .from('growth_goals')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting goal:', error);
        } else {
            fetchGoals();
        }
    };

    return {
        goals,
        addGoal,
        deleteGoal,
        refresh: fetchGoals
    };
};
