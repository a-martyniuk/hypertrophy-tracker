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
            let sessionToUse = null;
            const { data: { session: existingSession } } = await supabase.auth.getSession();

            if (existingSession) {
                // AGGRESSIVE REFRESH: If session is valid but we want to ensure it's not stale
                // Refresh if it expires in less than 1 hour (3600s) to be super safe
                const now = Math.floor(Date.now() / 1000);
                if (existingSession.expires_at && (existingSession.expires_at - now < 3600)) {
                    console.log('[useAuth] Session expiring soon (<1h), forcing refresh...');
                    const { data: { session: refreshedSession } } = await supabase.auth.refreshSession();
                    if (refreshedSession) {
                        console.log('[useAuth] Refresh SUCCESS.');
                        sessionToUse = refreshedSession;
                    } else {
                        console.warn('[useAuth] Refresh failed, using existing session.');
                        sessionToUse = existingSession;
                    }
                } else {
                    sessionToUse = existingSession;
                }
            }

            // FAILSAFE: Auto-Recovery from LocalStorage
            // If we still don't have a usable session, try to scrape one from storage
            if (!sessionToUse && typeof window !== 'undefined') {
                try {
                    const keys = Object.keys(localStorage);
                    const sbKey = keys.find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));

                    if (sbKey) {
                        console.log('[useAuth] Attempting manual session recovery...');
                        const raw = localStorage.getItem(sbKey);
                        if (raw) {
                            const { access_token, refresh_token } = JSON.parse(raw);
                            // We use setSession which validates and refreshes if needed
                            const { data, error: restoreError } = await supabase.auth.setSession({
                                access_token,
                                refresh_token
                            });

                            if (!restoreError && data.session) {
                                console.log('[useAuth] Session recovered successfully.');
                                sessionToUse = data.session;
                            } else {
                                console.warn('[useAuth] Recovery failed:', restoreError);
                            }
                        }
                    }
                } catch (err) {
                    console.error('[useAuth] Recovery exception:', err);
                }
            }

            setSession(sessionToUse);
            setUser(sessionToUse?.user ?? null);
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
