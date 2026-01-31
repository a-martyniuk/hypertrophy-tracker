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
            let { data: { session: currentSession } } = await supabase.auth.getSession();

            // FAILSAFE: Auto-Recovery from LocalStorage
            // Sometimes the SDK fails to initialize the session from storage on first load.
            // We manually check for the token and force restoration if found.
            if (!currentSession && typeof window !== 'undefined') {
                try {
                    const keys = Object.keys(localStorage);
                    const sbKey = keys.find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));

                    if (sbKey) {
                        console.log('[useAuth] Attempting manual session recovery...');
                        const raw = localStorage.getItem(sbKey);
                        if (raw) {
                            const { access_token, refresh_token } = JSON.parse(raw);
                            const { data, error } = await supabase.auth.setSession({
                                access_token,
                                refresh_token
                            });

                            if (!error && data.session) {
                                console.log('[useAuth] Session recovered successfully.');
                                currentSession = data.session;
                            } else {
                                console.warn('[useAuth] Recovery failed:', error);
                            }
                        }
                    }
                } catch (err) {
                    console.error('[useAuth] Recovery exception:', err);
                }
            }

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
