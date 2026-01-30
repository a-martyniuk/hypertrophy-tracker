import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { UserProfile } from '../types/measurements';

export const useProfile = () => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            // Local fallback
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
            setLoading(false);
            return;
        }

        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

        if (error) {
            console.error('Error fetching profile:', error);
        } else if (data) {
            setProfile({
                id: data.id,
                name: data.name,
                sex: data.sex,
                birthDate: data.birth_date,
                baseline: data.baseline
            });
        } else {
            // Create profile if missing (resilience)
            const newProfile: UserProfile = {
                id: user.id,
                name: user.email?.split('@')[0] || 'Atleta',
                sex: 'male'
            };
            setProfile(newProfile);
            // We don't insert here to avoid errors if the table is still being created
        }
        setLoading(false);
    };

    const updateProfile = async (updates: Partial<UserProfile>) => {
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

        if (error) {
            console.error('Error updating profile:', error);
        } else {
            fetchProfile();
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
