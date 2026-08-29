import { createContext, useState, useEffect, type ReactNode } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { db, auth, isFirebaseConfigured } from '../lib/firebase';
import type { UserProfile } from '../types/measurements';
import { removeCommunityAthlete } from '../services/communityAthleteService';
import { enqueueSyncAction } from '../services/offlineSyncQueue';
import { getProfileStorageKey } from '../utils/storageKeys';

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
            const storageKey = getProfileStorageKey(user?.uid);

            if (!user || !isFirebaseConfigured) {
                const saved = localStorage.getItem(storageKey);
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

                const isAlexis = (cleanName.toLowerCase().includes('alexis') || cleanName.toLowerCase().includes('martyniuk') || user.email?.toLowerCase().includes('martyniuk'));

                let resolvedAge = data.age;
                if (!resolvedAge && data.birthDate) {
                    const diff = Date.now() - new Date(data.birthDate).getTime();
                    const calculated = Math.abs(new Date(diff).getUTCFullYear() - 1970);
                    if (!isNaN(calculated) && calculated >= 10 && calculated <= 110) {
                        resolvedAge = calculated;
                    }
                }
                if (!resolvedAge && typeof window !== 'undefined') {
                    const localAge = localStorage.getItem('user_age') || localStorage.getItem(`calc_settings_${user.uid}_age`);
                    if (localAge) {
                        try {
                            const parsed = JSON.parse(localAge);
                            if (parsed && !isNaN(Number(parsed))) resolvedAge = Number(parsed);
                        } catch {
                            const n = Number(localAge);
                            if (!isNaN(n)) resolvedAge = n;
                        }
                    }
                }
                if (!resolvedAge) {
                    resolvedAge = isAlexis ? 38 : 28;
                }

                const resolvedHeight = data.height || (typeof window !== 'undefined' ? Number(localStorage.getItem('skeletal_height')) || (isAlexis ? 191 : 178) : (isAlexis ? 191 : 178));
                const resolvedWeight = data.weight || (isAlexis ? 104 : (data.sex === 'female' ? 60 : 78));

                setProfile({
                    id: user.uid,
                    name: cleanName,
                    sex: data.sex || 'male',
                    age: resolvedAge,
                    height: resolvedHeight,
                    weight: resolvedWeight,
                    birthDate: data.birthDate,
                    isPublic: data.isPublic !== false,
                    publicAlias: data.publicAlias || '',
                    baseline: data.baseline
                });
            } else {
                const isAlexis = (user.displayName?.toLowerCase().includes('alexis') || user.displayName?.toLowerCase().includes('martyniuk') || user.email?.toLowerCase().includes('martyniuk'));
                const defaultProfile: UserProfile = {
                    id: user.uid,
                    name: user.displayName || user.email?.split('@')[0] || 'Atleta',
                    sex: 'male',
                    age: isAlexis ? 38 : 28,
                    height: isAlexis ? 191 : 178,
                    weight: isAlexis ? 104 : 78,
                    isPublic: true,
                    publicAlias: ''
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

        const defaultName = user?.displayName || user?.email?.split('@')[0] || 'Atleta';
        const isAlexis = defaultName.toLowerCase().includes('alexis') || defaultName.toLowerCase().includes('martyniuk') || user?.email?.toLowerCase().includes('martyniuk');
        const defaultSex = updates.sex || 'male';
        const newProfile: UserProfile = profile
            ? { ...profile, ...updates }
            : {
                id: user?.uid || 'guest',
                name: defaultName,
                sex: defaultSex,
                age: isAlexis ? 38 : 28,
                height: isAlexis ? 191 : (defaultSex === 'female' ? 165 : 178),
                weight: isAlexis ? 104 : (defaultSex === 'female' ? 60 : 78),
                isPublic: true,
                publicAlias: '',
                ...updates
            } as UserProfile;

        // Optimistic update
        setProfile(newProfile);

        if (typeof window !== 'undefined') {
            if (newProfile.age) {
                localStorage.setItem('user_age', JSON.stringify(newProfile.age));
                localStorage.setItem(`calc_settings_${newProfile.id}_age`, JSON.stringify(newProfile.age));
                localStorage.setItem(`calc_settings_guest_age`, JSON.stringify(newProfile.age));
            }
            if (newProfile.height) {
                localStorage.setItem('skeletal_height', String(newProfile.height));
                localStorage.setItem(`calc_settings_${newProfile.id}_height`, JSON.stringify(newProfile.height));
                localStorage.setItem(`calc_settings_guest_height`, JSON.stringify(newProfile.height));
            }
            localStorage.setItem(getProfileStorageKey(user?.uid), JSON.stringify(newProfile));
        }

        try {
            if (!user || !isFirebaseConfigured) {
                return;
            }

            if (typeof navigator !== 'undefined' && !navigator.onLine) {
                enqueueSyncAction('UPDATE_PROFILE', user.uid, newProfile);
                return;
            }

            const profileDocRef = doc(db, 'users', user.uid, 'profile', 'main');
            await setDoc(profileDocRef, {
                name: newProfile.name,
                sex: newProfile.sex,
                age: newProfile.age || 38,
                height: newProfile.height || 191,
                birthDate: newProfile.birthDate || null,
                isPublic: newProfile.isPublic !== false,
                publicAlias: newProfile.publicAlias || null,
                baseline: newProfile.baseline || null,
                updatedAt: new Date().toISOString()
            }, { merge: true });

            // If user turned profile to private, remove from community immediately
            if (newProfile.isPublic === false) {
                await removeCommunityAthlete(user.uid);
            }

        } catch (err) {
            console.warn('[ProfileContext] Error en cloud. Encolando actualización de perfil para sincronización offline:', err);
            if (user?.uid) {
                enqueueSyncAction('UPDATE_PROFILE', user.uid, newProfile);
            }
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
