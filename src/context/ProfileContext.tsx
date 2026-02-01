import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { UserProfile } from '../types/measurements';

interface ProfileContextType {
    profile: UserProfile | null;
    loading: boolean;
    updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
    refresh: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider = ({ children }: { children: ReactNode }) => {
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
                setProfile({
                    id: user.id,
                    name: user.email?.split('@')[0] || 'Atleta',
                    sex: 'male'
                });
            }
        } catch (err) {
            console.error('[ProfileContext] Error fetching profile:', err);
        } finally {
            setLoading(false);
        }
    };

    const updateProfile = async (updates: Partial<UserProfile>) => {
        const { data: { user } } = await supabase.auth.getUser();

        // Snapshot previous state for rollback
        const previousProfile = profile;

        const defaultName = user?.email?.split('@')[0] || 'Atleta';

        const newProfile: UserProfile = profile
            ? { ...profile, ...updates }
            : {
                id: user?.id || 'temp',
                name: defaultName,
                sex: 'male',
                ...updates
            } as UserProfile;

        // Optimistic update
        setProfile(newProfile);

        try {
            if (!user) {
                localStorage.setItem('hypertrophy_profile', JSON.stringify(newProfile));
                return;
            }

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
            console.error('[ProfileContext] Error updating profile:', err);
            setProfile(previousProfile);
        }
    };

    useEffect(() => {
        fetchProfile();
        const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
            fetchProfile();
        });
        return () => subscription.unsubscribe();
    }, []);

    return (
        <ProfileContext.Provider value={{ profile, loading, updateProfile, refresh: fetchProfile }}>
            {children}
        </ProfileContext.Provider>
    );
};

export const useProfileContext = () => {
    const context = useContext(ProfileContext);
    if (context === undefined) {
        throw new Error('useProfileContext must be used within a ProfileProvider');
    }
    return context;
};
