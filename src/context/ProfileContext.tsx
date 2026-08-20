import { createContext, useState, useEffect, type ReactNode } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth, isFirebaseConfigured } from '../lib/firebase';
import type { UserProfile } from '../types/measurements';

export interface ProfileContextType {
    profile: UserProfile | null;
    loading: boolean;
    updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
    refresh: () => Promise<void>;
}

export const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const ProfileProvider = ({ children }: { children: ReactNode }) => {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async () => {
        try {
            const user = auth.currentUser;

            if (!user || !isFirebaseConfigured) {
                const saved = localStorage.getItem('hypertrophy_profile');
                if (saved) {
                    try {
                        setProfile(JSON.parse(saved));
                    } catch {
                        setProfile({
                            id: 'guest',
                            name: 'Invitado',
                            sex: 'male',
                            baseline: { wrist: 17.5, ankle: 22.5, knee: 39 }
                        });
                    }
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

            const profileDocRef = doc(db, 'users', user.uid, 'profile', 'main');
            const docSnap = await getDoc(profileDocRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                const cleanName = (data.name === 'User' && user.email)
                    ? user.email.split('@')[0]
                    : (data.name || user.displayName || user.email?.split('@')[0] || 'Atleta');

                setProfile({
                    id: user.uid,
                    name: cleanName,
                    sex: data.sex || 'male',
                    birthDate: data.birthDate,
                    baseline: data.baseline
                });
            } else {
                const defaultProfile: UserProfile = {
                    id: user.uid,
                    name: user.displayName || user.email?.split('@')[0] || 'Atleta',
                    sex: 'male'
                };
                setProfile(defaultProfile);
                await setDoc(profileDocRef, {
                    ...defaultProfile,
                    createdAt: new Date().toISOString()
                }, { merge: true });
            }
        } catch (err) {
            console.error('[ProfileContext] Error al cargar perfil:', err);
        } finally {
            setLoading(false);
        }
    };

    const updateProfile = async (updates: Partial<UserProfile>) => {
        const user = auth.currentUser;
        const previousProfile = profile;

        const defaultName = user?.displayName || user?.email?.split('@')[0] || 'Atleta';
        const newProfile: UserProfile = profile
            ? { ...profile, ...updates }
            : {
                id: user?.uid || 'guest',
                name: defaultName,
                sex: 'male',
                ...updates
            } as UserProfile;

        // Optimistic update
        setProfile(newProfile);

        try {
            if (!user || !isFirebaseConfigured) {
                localStorage.setItem('hypertrophy_profile', JSON.stringify(newProfile));
                return;
            }

            const profileDocRef = doc(db, 'users', user.uid, 'profile', 'main');
            await setDoc(profileDocRef, {
                name: newProfile.name,
                sex: newProfile.sex,
                birthDate: newProfile.birthDate || null,
                baseline: newProfile.baseline || null,
                updatedAt: new Date().toISOString()
            }, { merge: true });

        } catch (err) {
            console.error('[ProfileContext] Error al actualizar perfil:', err);
            setProfile(previousProfile);
        }
    };

    useEffect(() => {
        fetchProfile();

        if (isFirebaseConfigured) {
            const unsubscribe = onAuthStateChanged(auth, () => {
                fetchProfile();
            });
            return () => unsubscribe();
        }
    }, []);

    return (
        <ProfileContext.Provider value={{ profile, loading, updateProfile, refresh: fetchProfile }}>
            {children}
        </ProfileContext.Provider>
    );
};
