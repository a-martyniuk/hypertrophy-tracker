import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { GrowthGoal } from '../types/measurements';

const STORAGE_KEY = 'hypertrophy_goals';

export const useGoals = (userId?: string) => {
    const [goals, setGoals] = useState<GrowthGoal[]>([]);

    const fetchGoals = useCallback(async () => {
        if (!userId) {
            console.log('[useGoals] No userId provided, fetching from local storage');
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                setGoals(JSON.parse(saved));
            } else {
                setGoals([]);
            }
            return;
        }

        console.log('[useGoals] Fetching goals for user:', userId);
        const { data, error } = await supabase
            .from('growth_goals')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[useGoals] Error fetching goals:', error);
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
    }, [userId]);

    const addGoal = async (goal: Omit<GrowthGoal, 'id' | 'createdAt'>) => {
        console.log('[useGoals] Adding goal for user:', userId, goal);

        if (!userId) {
            console.log('[useGoals] No user, saving to local storage');
            const newGoal: GrowthGoal = {
                ...goal,
                id: crypto.randomUUID(),
                createdAt: new Date().toISOString(),
                userId: 'guest'
            };
            const newGoals = [newGoal, ...goals];
            setGoals(newGoals);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newGoals));
            return;
        }

        console.log('[useGoals] Attempting Supabase insert...');
        const { data, error } = await supabase
            .from('growth_goals')
            .insert({
                user_id: userId,
                measurement_type: goal.measurementType,
                target_value: goal.targetValue,
                target_date: goal.targetDate,
                status: goal.status
            })
            .select();

        if (error) {
            console.error('[useGoals] Supabase insert error:', error);
            throw error;
        } else {
            console.log('[useGoals] Insert successful, fetching updated goals...', data);
            await fetchGoals();
        }
    };

    const deleteGoal = async (id: string) => {
        if (!userId) {
            const newGoals = goals.filter(g => g.id !== id);
            setGoals(newGoals);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newGoals));
            return;
        }

        const { error } = await supabase
            .from('growth_goals')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);

        if (error) {
            console.error('[useGoals] Error deleting goal:', error);
            throw error;
        } else {
            await fetchGoals();
        }
    };

    const syncLocalGoalsToCloud = useCallback(async () => {
        if (!userId) return;

        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return;

        const localGoals: GrowthGoal[] = JSON.parse(saved);
        if (localGoals.length === 0) return;

        console.log(`Syncing ${localGoals.length} goals to cloud for user ${userId}...`);

        // We can't use addGoal here easily if it depends on state/other things, 
        // but let's implement the core insert logic directly to avoid circular deps or complexity
        for (const goal of localGoals) {
            const { data: existing } = await supabase
                .from('growth_goals')
                .select('id')
                .eq('user_id', userId)
                .eq('measurement_type', goal.measurementType)
                .eq('target_value', goal.targetValue)
                .maybeSingle();

            if (!existing) {
                await supabase.from('growth_goals').insert({
                    user_id: userId,
                    measurement_type: goal.measurementType,
                    target_value: goal.targetValue,
                    target_date: goal.targetDate,
                    status: goal.status
                });
            }
        }

        localStorage.removeItem(STORAGE_KEY);
    }, [userId]);

    useEffect(() => {
        if (userId) {
            syncLocalGoalsToCloud().then(() => fetchGoals());
        } else {
            fetchGoals();
        }
    }, [userId, fetchGoals, syncLocalGoalsToCloud]);

    return {
        goals,
        addGoal,
        deleteGoal,
        refresh: fetchGoals
    };
};
