import { useState, useEffect } from 'react';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithPopup,
    signOut as firebaseSignOut,
    type User
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '../lib/firebase';

export const useAuth = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isFirebaseConfigured) {
            setLoading(false);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signInWithEmail = async (email: string, pass: string) => {
        if (!isFirebaseConfigured) throw new Error('Firebase no está configurado');
        return signInWithEmailAndPassword(auth, email, pass);
    };

    const signUpWithEmail = async (email: string, pass: string) => {
        if (!isFirebaseConfigured) throw new Error('Firebase no está configurado');
        return createUserWithEmailAndPassword(auth, email, pass);
    };

    const signInWithGoogle = async () => {
        if (!isFirebaseConfigured) throw new Error('Firebase no está configurado');
        return signInWithPopup(auth, googleProvider);
    };

    const signOut = async () => {
        try {
            if (isFirebaseConfigured) {
                await firebaseSignOut(auth);
            }
        } catch (err) {
            console.warn('[useAuth] Error al cerrar sesión:', err);
        } finally {
            setUser(null);
        }
    };

    return {
        user,
        session: user, // Alias for backward compatibility if components check session
        loading,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signOut,
        isAuthenticated: !!user,
    };
};
