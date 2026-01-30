import { useState, useEffect } from 'react';
import type { UserProfile } from '../types/measurements';

const USER_STORAGE_KEY = 'hypertrophy_user';

export const useUser = () => {
    const [user, setUser] = useState<UserProfile>({
        id: 'default-user',
        name: 'Atleta Pro',
        sex: 'male'
    });

    useEffect(() => {
        const saved = localStorage.getItem(USER_STORAGE_KEY);
        if (saved) {
            try {
                setUser(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to load user profile', e);
            }
        }
    }, []);

    const updateUser = (updates: Partial<UserProfile>) => {
        const newUser = { ...user, ...updates };
        setUser(newUser);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(newUser));
    };

    return {
        user,
        updateUser
    };
};
