import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { User } from '@supabase/supabase-js';

export const useAuth = () => {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check current session
        const getSession = async () => {
            const { data: { session: currentSession } } = await supabase.auth.getSession();
            setSession(currentSession);
            setUser(currentSession?.user ?? null);
            setLoading(false);
        };

        getSession();

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
            setSession(currentSession);
            setUser(currentSession?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signOut = async () => {
        try {
            // Attempt graceful sign out
            await Promise.race([
                supabase.auth.signOut(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('SignOut Timeout')), 2000))
            ]);
        } catch (err) {
            console.warn('[useAuth] Graceful sign out failed or timed out, forcing local reset:', err);
        } finally {
            // Always force local state cleanup regardless of library success
            setSession(null);
            setUser(null);
        }
    };

    return {
        user,
        session,
        loading,
        signOut,
        isAuthenticated: !!user,
    };
};
