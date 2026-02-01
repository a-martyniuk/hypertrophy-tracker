import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { UserProfile } from '../types/measurements';

/**
 * Hook to manage the user profile.
 * Handles fetching, local storage fallback for guests, and profile updates.
 */
export const useProfile = () => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                const saved = localStorage.getItem('hypertrophy_profile');
                if (saved) {
                    setProfile(JSON.parse(saved));
                } else {
                    setProfile({
                        id: 'guest',
                        name: 'Invitado',
                        sex: 'male',
                        baseline: { wrist: 17.5, ankle: 22.5, knee: 39 }
                    });
                }
                return;
            }

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .maybeSingle();

            if (error) throw error;

            if (data) {
                // Self-healing: If name became 'User' due to previous bug, restore from email
                const cleanName = (data.name === 'User' && user.email)
                    ? user.email.split('@')[0]
                    : data.name;

                setProfile({
                    id: data.id,
                    name: cleanName,
                    sex: data.sex,
                    birthDate: data.birth_date,
                    baseline: data.baseline
                });
            } else {
                // If profile is missing in DB (unlikely due to trigger), initialize local state
                setProfile({
                    id: user.id,
                    name: user.email?.split('@')[0] || 'Atleta',
                    sex: 'male'
                });
            }
        } catch (err) {
            console.error('[useProfile] Error fetching profile:', err);
        } finally {
            setLoading(false);
        }
    };

    const updateProfile = async (updates: Partial<UserProfile>) => {
        // 0. Get user context first to ensure we have correct defaults
        // This is slightly less optimistic but prevents data corruption (e.g. overwriting name with 'User')
        const { data: { user } } = await supabase.auth.getUser();

        // 1. Snapshot previous state for rollback
        const previousProfile = profile;

        // 2. Create optimistic new state
        const defaultName = user?.email?.split('@')[0] || 'Atleta';

        const newProfile: UserProfile = profile
            ? { ...profile, ...updates }
            : {
                id: user?.id || 'temp', // Use real ID if available
                name: defaultName,      // Use email-derived name instead of 'User'
                sex: 'male',
                ...updates
            } as UserProfile;

        // 3. Apply optimistic update immediately
        setProfile(newProfile);

        try {
            if (!user) {
                // Guest mode: persist to local storage
                localStorage.setItem('hypertrophy_profile', JSON.stringify(newProfile));
                return;
            }

            // 4. Perform DB update
            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    name: newProfile.name,
                    sex: newProfile.sex,
                    birth_date: newProfile.birthDate,
                    baseline: newProfile.baseline,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;
        } catch (err) {
            console.error('[useProfile] Error updating profile:', err);
            // 6. Rollback on error
            setProfile(previousProfile);
            // Optionally notify user here if we had a toast system
            // alert('Error updating profile. Please check your connection.');
        }
    };

    useEffect(() => {
        fetchProfile();
        const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
            fetchProfile();
        });
        return () => subscription.unsubscribe();
    }, []);

    return {
        profile,
        loading,
        updateProfile,
        refresh: fetchProfile
    };
};
