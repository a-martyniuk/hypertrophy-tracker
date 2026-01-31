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
                setProfile({
                    id: data.id,
                    name: data.name,
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
        // 1. Snapshot previous state for rollback
        const previousProfile = profile;

        // 2. Create optimistic new state
        // We merge existing profile with updates. 
        // If profile is null (unlikely if interacting), we try to construct a partial one.
        const newProfile: UserProfile = profile
            ? { ...profile, ...updates }
            : {
                id: 'temp',
                name: 'User',
                sex: 'male',
                ...updates
            } as UserProfile;

        // 3. Apply optimistic update immediately
        setProfile(newProfile);

        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                // Guest mode: persist to local storage
                localStorage.setItem('hypertrophy_profile', JSON.stringify(newProfile));
                return;
            }

            // 4. Perform DB update
            // We use the optimistic values or fallback to current state for non-updated fields
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

            // 5. Optionally re-fetch to ensure sync (e.g. triggers, server-side defaults)
            // We skip this for simple fields like sex to avoid flickering if DB is slightly behind,
            // but strictly we should. Let's rely on the optimistic update for now for smoothness.
            // fetchProfile(); 
        } catch (err) {
            console.error('[useProfile] Error updating profile:', err);
            // 6. Rollback on error
            setProfile(previousProfile);
            // Optionally notify user here if we had a toast system
            alert('Error updating profile. Please check your connection.');
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
