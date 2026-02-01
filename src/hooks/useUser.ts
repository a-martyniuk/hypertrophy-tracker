import { useState } from 'react';
import type { UserProfile } from '../types/measurements';

const USER_STORAGE_KEY = 'hypertrophy_user';

export const useUser = () => {
    const [user, setUser] = useState<UserProfile>(() => {
        const saved = localStorage.getItem(USER_STORAGE_KEY);
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error('Failed to load user profile', e);
            }
        }
        return {
            id: 'default-user',
            name: 'Atleta Pro',
            sex: 'male'
        };
    });

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
