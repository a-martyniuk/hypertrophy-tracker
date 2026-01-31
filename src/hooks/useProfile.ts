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
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                const newProfile = profile ? { ...profile, ...updates } : updates as UserProfile;
                setProfile(newProfile);
                localStorage.setItem('hypertrophy_profile', JSON.stringify(newProfile));
                return;
            }

            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    name: updates.name || profile?.name,
                    sex: updates.sex || profile?.sex,
                    birth_date: updates.birthDate || profile?.birthDate,
                    baseline: updates.baseline || profile?.baseline,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;
            fetchProfile();
        } catch (err) {
            console.error('[useProfile] Error updating profile:', err);
            throw err; // Allow UI to handle specific error states
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
